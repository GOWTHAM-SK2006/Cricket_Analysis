import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  (config as any).meta = { startTime: Date.now() };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  console.log(`[API Diagnostic Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => {
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
