import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

interface User {
  id: string;
  email: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const register = async (email: string, password: string) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await axios.post<AuthResponse>('/api/auth/register', {
        email,
        password
      });
      
      token.value = response.data.token;
      user.value = response.data.user;
      localStorage.setItem('token', token.value);
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Registration failed';
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await axios.post<AuthResponse>('/api/auth/login', {
        email,
        password
      });
      
      token.value = response.data.token;
      user.value = response.data.user;
      localStorage.setItem('token', token.value);
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Login failed';
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
  };

  const checkAuth = async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return;

    try {
      loading.value = true;
      const response = await axios.post<AuthResponse>('/api/auth/verify-token', {
        token: savedToken
      });
      
      token.value = savedToken;
      user.value = response.data.user;
    } catch (err) {
      logout();
    } finally {
      loading.value = false;
    }
  };

  return {
    user,
    token,
    loading,
    error,
    register,
    login,
    logout,
    checkAuth
  };
}); 