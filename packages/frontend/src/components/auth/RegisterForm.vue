<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <img src="@/assets/logo.svg" alt="Logo" class="logo" />
        <h1>Create Account</h1>
        <p class="subtitle">Join us to start managing your tasks</p>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label for="email">
            <span class="icon">📧</span>
            Email
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="Enter your email"
            autocomplete="email"
          />
        </div>
        
        <div class="form-group">
          <label for="password">
            <span class="icon">🔒</span>
            Password
          </label>
          <div class="password-input">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              placeholder="Choose a password"
              autocomplete="new-password"
            />
            <button 
              type="button" 
              class="toggle-password"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
          <p class="password-hint">Must be at least 6 characters long</p>
        </div>

        <div v-if="authStore.error" class="error-message">
          <span class="icon">⚠️</span>
          {{ authStore.error }}
        </div>

        <button type="submit" class="submit-button" :disabled="authStore.loading">
          <span class="icon" v-if="authStore.loading">🔄</span>
          <span v-else>✨</span>
          {{ authStore.loading ? 'Creating account...' : 'Create Account' }}
        </button>

        <div class="auth-footer">
          <p>Already have an account?</p>
          <router-link to="/login" class="switch-auth">
            Log In
            <span class="icon">→</span>
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);

const handleSubmit = async () => {
  try {
    await authStore.register(email.value, password.value);
    router.push('/tasks');
  } catch (error) {
    // Error is already handled in the store
  }
};
</script> 