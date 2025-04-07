import axios, { AxiosRequestConfig } from 'axios';
import authService from './auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000'
});

// Request interceptor
api.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    console.log('=== Request Interceptor ===');
    console.log('Request URL:', config.url);
    
    // Wait for auth to initialize
    await authService.waitForAuthInit();

    // Don't add token for login and register endpoints
    if (config.url?.includes('/auth/login') || config.url?.includes('/auth/register')) {
      console.log('Auth endpoint detected, skipping token addition');
      return config;
    }

    if (!authService.isAuthenticated()) {
      console.log('User not authenticated, redirecting to login');
      authService.logout();
      return Promise.reject('Not authenticated');
    }

    let token = localStorage.getItem('token');
    console.log('Token from localStorage:', token);

    if (!token) {
      console.log('No token found, attempting refresh...');
      token = await authService.refreshToken();
      console.log('Refreshed token:', token);
    }

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Final request headers:', config.headers);
      return config;
    }

    console.log('No token available after refresh attempt');
    authService.logout();
    return Promise.reject('No authentication token available');
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const token = await authService.refreshToken();
        if (token) {
          // Update the request header
          originalRequest.headers.Authorization = `Bearer ${token}`;
          // Retry the request
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }

      // If we get here, refresh failed
      authService.logout();
    }

    return Promise.reject(error);
  }
);

// Initialize headers from stored token
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default api; 