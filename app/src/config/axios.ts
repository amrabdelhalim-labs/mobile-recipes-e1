import axios from 'axios';
import { Preferences } from '@capacitor/preferences';
import { API_URL } from './urls';

const api = axios.create({
  baseURL: API_URL,
  responseType: 'json',
  headers: {
    'Content-Type': 'application/json',
  },
});

// إضافة Bearer token تلقائيًا لجميع الطلبات إذا كان موجودًا
api.interceptors.request.use(
  async (config) => {
    try {
      const { value } = await Preferences.get({ key: 'accessToken' });
      if (value) {
        // Token مخزن مع Bearer prefix بالفعل
        config.headers.Authorization = value;
      }
    } catch (error) {
      console.error('Failed to get token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
