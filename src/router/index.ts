import { createRouter, createWebHistory } from 'vue-router'
import { track } from '../plugins/sensors'

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

// 页面浏览埋点：访问任意页面时触发（含首次进入）
router.afterEach(() => {
  track('X1ProHelpSite_PageView')
})

export default router
