import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { useAuthStore } from './auth';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchTasks = async (filter: 'all' | 'my' | 'shared' = 'all') => {
    try {
      loading.value = true;
      error.value = null;
      const response = await axios.get<Task[]>(`/api/tasks?filter=${filter}`);
      tasks.value = response.data;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch tasks';
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  const createTask = async (title: string, description?: string) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await axios.post<Task>('/api/tasks', {
        title,
        description
      });
      tasks.value.unshift(response.data);
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create task';
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await axios.put<Task>(`/api/tasks/${id}`, updates);
      const index = tasks.value.findIndex(t => t.id === id);
      if (index !== -1) {
        tasks.value[index] = response.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update task';
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      loading.value = true;
      error.value = null;
      await axios.delete(`/api/tasks/${id}`);
      tasks.value = tasks.value.filter(t => t.id !== id);
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete task';
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  const shareTask = async (id: string, email: string) => {
    try {
      loading.value = true;
      error.value = null;
      await axios.post(`/api/tasks/${id}/share`, { email });
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to share task';
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    shareTask
  };
}); 