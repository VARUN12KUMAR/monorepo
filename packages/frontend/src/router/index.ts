import { createRouter, createWebHistory } from 'vue-router';
import { authGuard } from './guards';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/tasks'
    },
    {
      path: '/login',
      component: () => import('@/components/auth/LoginForm.vue'),
      meta: { public: true }
    },
    {
      path: '/register',
      component: () => import('@/components/auth/RegisterForm.vue'),
      meta: { public: true }
    },
    {
      path: '/tasks',
      component: () => import('@/components/tasks/TaskList.vue')
    }
  ]
});

router.beforeEach(authGuard);

export default router; 