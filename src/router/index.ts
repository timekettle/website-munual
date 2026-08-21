import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      alias: '/tutorial',
      name: 'tutorial',
      component: () => import('../views/Tutorial.vue'),
    },
    {
      path: '/x1m',
      name: 'x1m-pdf-viewer',
      component: () => import('../views/PdfViewer.vue'),
    },
  ],
})

export default router
