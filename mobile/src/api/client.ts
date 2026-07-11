import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl ?? 'http://localhost:8000/api/v1/';

const PUBLIC_PATHS = ['auth/login/', 'auth/register/', 'auth/reset-password/'];

export const AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getApiError(e: any, fallback = 'Request failed'): string {
  const d = e?.response?.data;
  if (!d) return e?.message || fallback;
  if (typeof d === 'string') return d;
  if (d.error) return String(d.error);
  if (d.detail) return String(d.detail);
  if (d.non_field_errors) {
    return Array.isArray(d.non_field_errors) ? d.non_field_errors.join(', ') : String(d.non_field_errors);
  }
  const fields = Object.entries(d)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
    .join('\n');
  return fields || fallback;
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
}

export const getAuthToken = async () => {
  try {
    return await SecureStore.getItemAsync('access_token');
  } catch {
    return null;
  }
};

function isPublicUrl(url?: string) {
  if (!url) return false;
  return PUBLIC_PATHS.some((p) => url.includes(p));
}

AxiosInstance.interceptors.request.use(
  async (config) => {
    if (!isPublicUrl(config.url)) {
      const token = await getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

AxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearTokens();
    }
    return Promise.reject(error);
  },
);
