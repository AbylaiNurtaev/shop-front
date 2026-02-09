import axios from 'axios';

const api = axios.create({
  // baseURL: 'http://localhost:3000/api',
  baseURL: 'https://shop-back-production-a38c.up.railway.app/api',
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

// Обработчик ответов для автоматической обработки ошибок
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если ошибка 401 и это не повторный запрос
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');

      // Если есть refreshToken, пытаемся обновить токен
      if (refreshToken) {
        try {
          const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            refreshToken: refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;

          if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
            }

            // Повторяем оригинальный запрос с новым токеном
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Если не удалось обновить токен, очищаем localStorage и перенаправляем на логин
          console.error('Не удалось обновить токен', refreshError);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userId');
          localStorage.removeItem('storeId');
          localStorage.removeItem('brandId');
          localStorage.removeItem('userRole');

          // Не делаем автоматический редирект, чтобы не ломать текущий флоу
          // Приложение само обработает отсутствие токена через restoreSession
        }
      } else {
        // Если нет refreshToken, очищаем localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('storeId');
        localStorage.removeItem('brandId');
        localStorage.removeItem('userRole');
      }
    }

    return Promise.reject(error);
  }
);

export default api;

