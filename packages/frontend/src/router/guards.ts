import { NavigationGuard } from 'vue-router';
import authService from '../services/auth';

export const authGuard: NavigationGuard = async (to, from, next) => {
  // Wait for auth to initialize
  await authService.waitForAuthInit();

  // Allow access to public routes
  if (to.meta.public) {
    next();
    return;
  }

  // Check if route requires auth
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!authService.isAuthenticated()) {
      // Save the intended destination
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      });
    } else {
      next();
    }
  } else {
    next();
  }
}; 