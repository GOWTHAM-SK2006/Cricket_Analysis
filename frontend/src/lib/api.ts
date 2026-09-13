import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 120_000; // 2 minutes in-memory client cache

const originalGet = api.get.bind(api);
api.get = function <T = any, R = axios.AxiosResponse<T>, D = any>(url: string, config?: axios.AxiosRequestConfig<D>): Promise<R> {
  const cached = getCache.get(url);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    // Background revalidation
    originalGet<T, R, D>(url, config).then((res) => {
      getCache.set(url, { data: res.data, timestamp: Date.now() });
    }).catch(() => {});

    // Instant 0ms response
    return Promise.resolve({
      data: cached.data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config || {},
    } as unknown as R);
  }

  return originalGet<T, R, D>(url, config);
} as any;

api.interceptors.request.use((config) => {
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
