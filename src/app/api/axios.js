import axios from 'axios';

const api = axios.create({
  // baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://shop-back-production-a38c.up.railway.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    if (typeof config.headers?.set === 'function') {
      config.headers.set('Content-Type', undefined);
    } else {
      config.headers['Content-Type'] = undefined;
      config.headers['content-type'] = undefined;
    }
  }
  return config;
});

export default api;

