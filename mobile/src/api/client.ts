import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl ?? 'http://localhost:8000/api/v1/';

export const AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getAuthToken = async () => {
  try {
    const token = await SecureStore.getItemAsync('access_token');
    return token;
  } catch (error) {
    console.error('Unauthorized:', error);
    return null;
  }
}

AxiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

AxiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      if (error.response && error.response.status === 401) {
        console.error('Unauthorized:', error.response.data);
        await SecureStore.deleteItemAsync('access_token');
      }
      return Promise.reject(error);
    }
    
);

