<template>
  <div class="task-list">
    <nav class="navbar">
      <div class="nav-brand">
        <h1>Task Manager</h1>
      </div>
      <button class="logout-button" @click="handleLogout">
        <span class="icon">🚪</span>
        Logout
      </button>
    </nav>

    <div class="task-header">
      <h2>Tasks</h2>
      <div class="filters">
        <button 
          v-for="f in filters" 
          :key="f"
          :class="{ active: filter === f }"
          @click="filter = f"
          class="filter-button"
        >
          {{ formatFilterText(f) }}
        </button>
      </div>
    </div>

    <div class="create-task-card">
      <input
        v-model="newTaskTitle"
        placeholder="Task title"
        @keyup.enter="createNewTask"
      />
      <textarea
        v-model="newTaskDescription"
        placeholder="Task description (optional)"
        rows="2"
      ></textarea>
      <button 
        class="create-button" 
        @click="createNewTask" 
        :disabled="!newTaskTitle.trim()"
      >
        <span class="icon">+</span>
        Add Task
      </button>
    </div>

    <div v-if="loading" class="loading-spinner">
      <div class="spinner"></div>
      Loading tasks...
    </div>

    <div v-else-if="error" class="error-card">
      <span class="icon">⚠️</span>
      {{ error }}
    </div>

    <div v-else class="tasks-grid">
      <div v-for="task in tasks" :key="task.id" class="task-card" :class="task.status.toLowerCase()">
        <div class="task-card-header">
          <span class="status-badge" :class="task.status.toLowerCase()">
            {{ task.status.replace('_', ' ') }}
          </span>
          <div class="task-actions">
            <button class="icon-button" @click="editTask(task)" title="Edit">
              ✏️
            </button>
            <button class="icon-button" @click="shareTask(task)" title="Share">
              🔗
            </button>
            <button class="icon-button delete" @click="deleteTask(task.id)" title="Delete">
              🗑️
            </button>
          </div>
        </div>

        <h3 class="task-title">{{ task.title }}</h3>
        <p class="task-description" v-if="task.description">
          {{ task.description }}
        </p>
        
        <div class="task-footer">
          <span class="task-date">
            Created: {{ new Date(task.created_at).toLocaleDateString() }}
          </span>
        </div>
      </div>
    </div>

    <!-- Edit Task Modal -->
    <Modal v-if="showEditModal" @close="showEditModal = false">
      <template #header>
        <h3>Edit Task</h3>
      </template>
      <form @submit.prevent="updateCurrentTask" class="edit-form">
        <div class="form-group">
          <label>Title</label>
          <input v-model="editingTask.title" placeholder="Task title" required />
        </div>
        
        <div class="form-group">
          <label>Description</label>
          <textarea 
            v-model="editingTask.description" 
            placeholder="Task description"
            rows="3"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label>Status</label>
          <select v-model="editingTask.status">
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="cancel" @click="showEditModal = false">
            Cancel
          </button>
          <button type="submit" class="save">
            Save Changes
          </button>
        </div>
      </form>
    </Modal>

    <!-- Share Task Modal -->
    <Modal v-if="showShareModal" @close="showShareModal = false">
      <template #header>
        <h3>Share Task</h3>
      </template>
      <form @submit.prevent="shareCurrentTask" class="share-form">
        <div class="form-group">
          <label>Share with (email)</label>
          <input 
            v-model="shareEmail" 
            type="email" 
            placeholder="Enter email address" 
            required 
          />
        </div>
        <div class="modal-actions">
          <button type="button" class="cancel" @click="showShareModal = false">
            Cancel
          </button>
          <button type="submit" class="save">
            Share Task
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useTaskStore } from '@/stores/task';
import Modal from '@/components/shared/Modal.vue';
import type { Task } from '@/types';
import { useRouter } from 'vue-router';
import authService from '@/services/auth';
import api from '@/services/axios';

const taskStore = useTaskStore();
const router = useRouter();
const filters = ['all', 'my', 'shared'] as const;
const filter = ref<typeof filters[number]>('all');
const newTaskTitle = ref('');
const newTaskDescription = ref('');
const showEditModal = ref(false);
const showShareModal = ref(false);
const editingTask = ref<Task | null>(null);
const sharingTask = ref<Task | null>(null);
const shareEmail = ref('');
const loading = ref(true);
const error = ref('');
const tasks = ref<Task[]>([]);

onMounted(async () => {
  await authService.waitForAuthInit();
  await fetchTasks();
});

watch(filter, () => {
  fetchTasks();
});

const fetchTasks = async () => {
  try {
    loading.value = true;
    error.value = '';

    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const response = await api.get('/api/tasks', {
      params: { filter: filter.value }
    });
    tasks.value = response.data;
  } catch (e) {
    console.error('Error fetching tasks:', e);
    if (e === 'Not authenticated') {
      router.push('/login');
    } else {
      error.value = 'Failed to load tasks';
    }
  } finally {
    loading.value = false;
  }
};

const createNewTask = async () => {
  if (!newTaskTitle.value.trim()) return;
  
  try {
    const response = await api.post('/api/tasks', {
      title: newTaskTitle.value,
      description: newTaskDescription.value
    });
    tasks.value.push(response.data);
    newTaskTitle.value = '';
    newTaskDescription.value = '';
  } catch (error) {
    console.error('Error creating task:', error);
  }
};

const editTask = (task: Task) => {
  editingTask.value = { ...task };
  showEditModal.value = true;
};

const updateCurrentTask = async () => {
  if (!editingTask.value) return;
  
  try {
    const response = await api.put(`/api/tasks/${editingTask.value.id}`, editingTask.value);
    const index = tasks.value.findIndex(t => t.id === editingTask.value?.id);
    if (index !== -1) {
      tasks.value[index] = response.data;
    }
    showEditModal.value = false;
  } catch (error) {
    console.error('Error updating task:', error);
  }
};

const deleteTask = async (id: string) => {
  if (!confirm('Are you sure you want to delete this task?')) return;
  
  try {
    await api.delete(`/api/tasks/${id}`);
    tasks.value = tasks.value.filter(t => t.id !== id);
  } catch (error) {
    console.error('Error deleting task:', error);
  }
};

const shareTask = (task: Task) => {
  sharingTask.value = task;
  showShareModal.value = true;
};

const shareCurrentTask = async () => {
  if (!sharingTask.value || !shareEmail.value) return;
  
  try {
    await api.post(`/api/tasks/${sharingTask.value.id}/share`, {
      email: shareEmail.value
    });
    showShareModal.value = false;
    shareEmail.value = '';
  } catch (error) {
    console.error('Error sharing task:', error);
  }
};

const formatFilterText = (f: string) => {
  return f.charAt(0).toUpperCase() + f.slice(1);
};

const handleLogout = () => {
  authService.logout();
};
</script>

<style scoped>
.navbar {
  background-color: #4CAF50;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-brand h1 {
  margin: 0;
  font-size: 1.5rem;
}

.logout-button {
  background: none;
  border: 1px solid white;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.logout-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.task-list {
  padding-top: 80px;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 0 2rem;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.filter-button {
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 20px;
  background-color: #e0e0e0;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.filter-button.active {
  background-color: #4CAF50;
  color: white;
}

.filter-button:hover {
  background-color: #4CAF50;
  color: white;
}

.create-task-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.create-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #4CAF50;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.create-button:disabled {
  background: #cccccc;
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 0 1rem;
}

.task-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.task-card.pending {
  border-left: 4px solid #ffd700;
}

.task-card.in_progress {
  border-left: 4px solid #2196F3;
}

.task-card.completed {
  border-left: 4px solid #4CAF50;
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.in_progress {
  background: #cce5ff;
  color: #004085;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.task-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1.25rem;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.icon-button:hover {
  opacity: 1;
}

.task-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

.task-description {
  color: #666;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.task-footer {
  font-size: 0.875rem;
  color: #888;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-card {
  background: #fff3cd;
  color: #856404;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.cancel {
  background: #f8f9fa;
  color: #333;
}

.save {
  background: #4CAF50;
  color: white;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

input,
textarea,
select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 1rem;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}
</style> 