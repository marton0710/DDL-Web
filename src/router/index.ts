import { createRouter, createWebHistory } from 'vue-router'
import { authApi } from '../api/auth'
import { isAuthenticationError } from '../api/client'
import { useSession } from '../state/session'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/home', name: 'home', component: () => import('../views/HomeView.vue'), meta: { requiresAuth: true } },
    { path: '/profile', name: 'profile', component: () => import('../views/ProfileView.vue'), meta: { requiresAuth: true } },
    { path: '/about', name: 'about', component: () => import('../views/AboutView.vue') },
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  try {
    const currentUser = await authApi.getCurrentUser()
    useSession().setDisplayName(currentUser.name)
    return true
  } catch (error) {
    if (!isAuthenticationError(error)) return true

    useSession().clearSession()
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }
})

export default router
