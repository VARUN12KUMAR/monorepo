<template>
  <div class="app">
    <!-- Only show nav when user is authenticated and not on login/register pages -->
    <nav v-if="shouldShowNav">
      <router-link to="/tasks">Tasks</router-link>
      <button @click="logout">Logout</button>
    </nav>
    
    <router-view></router-view>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useRouter, useRoute } from 'vue-router';
import { computed } from 'vue';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const shouldShowNav = computed(() => {
  const authPages = ['/login', '/register'];
  return authStore.user && !authPages.includes(route.path);
});

const logout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.app {
  min-height: 100vh;
}

nav {
  padding: 1rem;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

nav a {
  color: #333;
  text-decoration: none;
}

nav button {
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style> 