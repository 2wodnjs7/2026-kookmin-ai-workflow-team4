import axios from 'axios';
import { apiUrl } from '@/api/config';
import { ApiRequestError } from '@/api/errors';
import { getToken } from '@/utils/auth';

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.url && !config.url.startsWith('http')) {
    config.url = apiUrl(config.url);
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 0;
      const message =
        (error.response?.data as { message?: string })?.message ??
        error.message ??
        '요청 처리 중 오류가 발생했습니다.';
      const code = (error.response?.data as { code?: string })?.code;
      return Promise.reject(new ApiRequestError(message, status, code));
    }
    return Promise.reject(error);
  },
);

export default api;
