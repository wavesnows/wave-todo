import { createRouter, createWebHashHistory } from 'vue-router'
import { useStorage } from '../composables/useStorage.js'

const routes = [
  {
    path: '/setup',
    component: () => import('../views/Setup.vue'),
  },
  {
    path: '/',
    component: () => import('../views/TaskForm.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to) => {
  const { getToken, getRepo } = useStorage()
  if (to.meta.requiresAuth) {
    if (!getToken()) return '/setup'
    if (!getRepo()) return '/setup'
  }
})

export default router
