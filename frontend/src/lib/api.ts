import axios, { type AxiosResponse, type AxiosRequestConfig } from 'axios';

export const isNativePlatform = (): boolean => {
  if (typeof window === 'undefined') return false;
  const win = window as any;
  if (win.Capacitor?.isNativePlatform?.()) return true;
  if (win.location.protocol === 'capacitor:' || win.location.protocol === 'ionic:') return true;
  // Android Capacitor WebView serves from https://localhost without an explicit port
  if (win.location.hostname === 'localhost' && !win.location.port) return true;
  return false;
};

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('cpi_custom_api_url');
    if (customUrl && customUrl.trim()) return customUrl.trim();

    if (isNativePlatform()) {
      return 'https://cpicoach.com/api';
    }
  }

  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim();
  }

  return '/api';
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getCache = new Map<string, { data: any; timestamp: number }>();
const inFlightRequests = new Map<string, Promise<any>>();
// Shortened TTL: 15 seconds for general GETs to prevent stale screens, while preventing duplicate rapid fires
const CACHE_TTL_MS = 15_000;

export const clearApiCache = (urlPrefix?: string) => {
  if (urlPrefix) {
    for (const key of getCache.keys()) {
      if (key.startsWith(urlPrefix)) {
        getCache.delete(key);
      }
    }
    for (const key of inFlightRequests.keys()) {
      if (key.startsWith(urlPrefix)) {
        inFlightRequests.delete(key);
      }
    }
  } else {
    getCache.clear();
    inFlightRequests.clear();
  }
};

const originalGet = api.get.bind(api);
api.get = function <T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R> {
  const isNoCache = config?.headers?.['Cache-Control'] === 'no-cache' || config?.params?._nocache;
  const cached = isNoCache ? null : getCache.get(url);

  // If cache exists and is fresh (and not an empty array that might be stale)
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    // Only use cache if it has data or is very fresh (< 5s)
    const isEmptyList = Array.isArray(cached.data) && cached.data.length === 0;
    const cacheAge = Date.now() - cached.timestamp;
    
    if (!isEmptyList || cacheAge < 5_000) {
      // Background revalidation
      if (!inFlightRequests.has(url)) {
        const revalidatePromise = originalGet<T, R, D>(url, config)
          .then((res: any) => {
            getCache.set(url, { data: res.data, timestamp: Date.now() });
            return res;
          })
          .catch(() => {})
          .finally(() => {
            inFlightRequests.delete(url);
          });
        inFlightRequests.set(url, revalidatePromise);
      }

      // Instant response
      return Promise.resolve({
        data: cached.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config || {},
      } as unknown as R);
    }
  }

  // Deduplicate concurrent in-flight requests to the same URL
  if (inFlightRequests.has(url)) {
    return inFlightRequests.get(url)!;
  }

  const reqPromise = originalGet<T, R, D>(url, config)
    .then((res: any) => {
      getCache.set(url, { data: res.data, timestamp: Date.now() });
      return res;
    })
    .finally(() => {
      inFlightRequests.delete(url);
    });

  inFlightRequests.set(url, reqPromise);
  return reqPromise as Promise<R>;
} as any;

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  (config as any).meta = { startTime: Date.now() };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  const method = config.method?.toLowerCase();
  if (method === 'post' || method === 'put' || method === 'delete') {
    getCache.clear();
    inFlightRequests.clear();
  }

  console.log(`[API Diagnostic Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase();
    if (method === 'get' && response.config.url) {
      getCache.set(response.config.url, { data: response.data, timestamp: Date.now() });
    }
    const duration = Date.now() - ((response.config as any).meta?.startTime || Date.now());
    const recordCount = Array.isArray(response.data) ? response.data.length : (response.data ? 1 : 0);
    console.log(`[API Diagnostic Response] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status} (${duration}ms) - Records: ${recordCount}`);
    return response;
  },
  (error) => {
    const duration = Date.now() - ((error.config?.meta?.startTime) || Date.now());
    console.error(`[API Diagnostic Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} - (${duration}ms) - Message: ${error.message}`);
    return Promise.reject(error);
  }
);
