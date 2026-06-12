import { createRouter, createWebHashHistory } from 'vue-router'
import { useStorage } from '../composables/useStorage.js'

const routes = [
  {
    path: '/setup',
    component: () => import('../views/Setup.vue'),
  },
  {
    path: '/',
    component: () => import('../views/Home.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/writing',
    component: () => import('../views/WritingForm.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/publish',
    component: () => import('../views/PublishForm.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/adhoc',
    component: () => import('../views/AdhocForm.vue'),
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
