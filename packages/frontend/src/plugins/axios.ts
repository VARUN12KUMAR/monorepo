import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import router from '@/router';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

axios.interceptors.request.use(config => {
  const authStore = useAuthStore();
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`;
  }
  return config;
});

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore();
      authStore.logout();
      router.push('/login');
    }
    return Promise.reject(error);
  }
);

export default axios; 