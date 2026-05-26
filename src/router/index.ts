import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'pdf-viewer',
      component: () => import('../views/PdfViewer.vue'),
    },
    {
      path: '/x1m',
      name: 'x1m-pdf-viewer',
      component: () => import('../views/PdfViewer.vue'),
    },
  ],
})

export default router
