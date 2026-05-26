<template>
  <div class="pdf-viewer">
    <div class="pdf-toolbar">
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <a class="download-btn" href="https://cdn.timekettle.co/X1_Meeting/manual.pdff" download="X1_Meeting_manual.pdf">
        <el-button type="primary">下载</el-button>
      </a>
    </div>
    <div class="pdf-loading" v-if="loading">
      <div class="loading-spinner"></div>
      <span class="loading-text">加载中... {{ loadingProgress }}%</span>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: loadingProgress + '%' }"></div>
      </div>
    </div>
    <div class="pdf-body" v-else>
      <div class="pdf-sidebar" ref="sidebarRef">
        <div
          v-for="page in totalPages"
          :key="'thumb-' + page"
          :class="['thumbnail-item', { active: currentPage === page }]"
          @click="scrollToPage(page)"
        >
          <canvas :ref="(el) => { if (el) thumbRefs[page] = el }"></canvas>
          <span class="page-num">{{ page }} / {{ totalPages }}</span>
        </div>
      </div>
      <div class="pdf-content" ref="contentRef">
        <div
          v-for="page in totalPages"
          :key="'page-' + page"
          :data-page="page"
          :ref="(el) => { if (el) pageRefs[page] = el }"
          class="page-wrapper"
        >
          <canvas :ref="(el) => { if (el) canvasRefs[page] = el }"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

const route = useRoute()
const sncode = route.query.sncode as string | undefined
void sncode

const pdfUrl = 'https://cdn.timekettle.co/X1_Meeting/manual.pdf'
// const pdfUrl = 'https://cdn.timekettle.co/pdfUpload/kkktest.pdf'
const totalPages = ref(0)
const currentPage = ref(1)
const contentRef = ref<HTMLElement | null>(null)
const sidebarRef = ref<HTMLElement | null>(null)
const loading = ref(true)
const loadingProgress = ref(0)

const canvasRefs: Record<number, any> = {}
const thumbRefs: Record<number, any> = {}
const pageRefs: Record<number, any> = {}

let observer: IntersectionObserver | null = null
let lazyObserver: IntersectionObserver | null = null
let pdfDoc: PDFDocumentProxy | null = null
const renderedPages = new Set<number>()
let mainScale = 1

const INITIAL_PAGES = 3

const renderPage = async (page: PDFPageProxy, canvas: HTMLCanvasElement, scale: number) => {
  const viewport = page.getViewport({ scale })
  canvas.width = viewport.width
  canvas.height = viewport.height
  canvas.style.width = '100%'
  canvas.style.height = 'auto'
  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport, canvas } as any).promise
}

const scrollToPage = (pageNum: number) => {
  const el = pageRefs[pageNum]
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const setupPageObserver = () => {
  if (!contentRef.value) return
  observer = new IntersectionObserver(
    (entries) => {
      let maxRatio = 0
      let visiblePage = currentPage.value
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio
          visiblePage = Number(entry.target.getAttribute('data-page'))
        }
      })
      if (maxRatio > 0) {
        currentPage.value = visiblePage
        scrollThumbIntoView(visiblePage)
      }
    },
    { root: contentRef.value, threshold: [0, 0.25, 0.5, 0.75, 1] }
  )
  for (let i = 1; i <= totalPages.value; i++) {
    if (pageRefs[i]) observer.observe(pageRefs[i])
  }
}

const setupLazyObserver = () => {
  if (!contentRef.value) return
  lazyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pageNum = Number(entry.target.getAttribute('data-page'))
          if (!renderedPages.has(pageNum)) {
            renderSinglePage(pageNum)
          }
        }
      })
    },
    { root: contentRef.value, rootMargin: '200px 0px' }
  )
  for (let i = INITIAL_PAGES + 1; i <= totalPages.value; i++) {
    if (pageRefs[i]) lazyObserver.observe(pageRefs[i])
  }
}

const renderSinglePage = async (pageNum: number) => {
  if (!pdfDoc || renderedPages.has(pageNum)) return
  renderedPages.add(pageNum)
  const page = await pdfDoc.getPage(pageNum)
  if (canvasRefs[pageNum]) await renderPage(page, canvasRefs[pageNum], mainScale)
  if (thumbRefs[pageNum]) await renderPage(page, thumbRefs[pageNum], 0.4)
}

const scrollThumbIntoView = (pageNum: number) => {
  const sidebar = sidebarRef.value
  if (!sidebar) return
  const thumbEl = sidebar.children[pageNum - 1] as HTMLElement
  if (thumbEl) {
    thumbEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}

const renderInitialPages = async () => {
  if (!pdfDoc) return
  const firstPage = await pdfDoc.getPage(1)
  const baseViewport = firstPage.getViewport({ scale: 1.0 })
  const containerWidth = contentRef.value?.clientWidth || 800
  const displayWidth = Math.min(containerWidth, 800)
  const dpr = Math.max(window.devicePixelRatio || 1, 2)
  mainScale = (displayWidth / baseViewport.width) * dpr

  const count = Math.min(INITIAL_PAGES, pdfDoc.numPages)
  for (let i = 1; i <= count; i++) {
    await renderSinglePage(i)
  }

  setupPageObserver()
  setupLazyObserver()
}

watch(totalPages, async (val) => {
  if (val > 0) {
    await nextTick()
    await renderInitialPages()
  }
})

onMounted(async () => {
  try {
    const loadingTask = getDocument({
      url: pdfUrl,
      disableAutoFetch: true,
      disableStream: false,
      rangeChunkSize: 65536,
    })
    loadingTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
      if (total > 0) {
        loadingProgress.value = Math.min(Math.round((loaded / total) * 100), 100)
      }
    }
    pdfDoc = await loadingTask.promise
    totalPages.value = pdfDoc.numPages
    loading.value = false
  } catch (e) {
    console.error('PDF load failed:', e)
    loading.value = false
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  lazyObserver?.disconnect()
  pdfDoc?.destroy()
})
</script>

<style scoped>
.pdf-viewer {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #e8e8e8;
  overflow: hidden;
}

.pdf-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 0 24px;
  background: #222;
  color: #fff;
  height: 48px;
  flex-shrink: 0;
}

.page-info {
  font-size: 14px;
}

.download-btn {
  text-decoration: none;
}

.download-btn :deep(.el-button) {
  padding: 6px 16px;
  font-size: 13px;
}

.pdf-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e0e0e0;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 14px;
  color: #666;
}

.progress-bar {
  width: 240px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #409eff;
  transition: width 0.3s;
}

.pdf-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.pdf-sidebar {
  width: 180px;
  min-width: 180px;
  overflow-y: auto;
  background: #333;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.thumbnail-item {
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 4px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: border-color 0.2s;
}

.thumbnail-item.active {
  border-color: #409eff;
}

.thumbnail-item:hover {
  border-color: #79bbff;
}

.thumbnail-item canvas {
  width: 100%;
  height: auto;
  display: block;
}

.page-num {
  font-size: 12px;
  color: #aaa;
  margin-top: 4px;
}

.pdf-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 40px 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.page-wrapper {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  max-width: 800px;
  width: 100%;
  box-sizing: border-box;
}

.page-wrapper canvas {
  display: block;
  width: 100%;
  height: auto;
}

@media (max-width: 1024px) {
  .pdf-sidebar {
    width: 140px;
    min-width: 140px;
    padding: 8px;
  }
  .pdf-content {
    padding: 24px 30px;
  }
}

@media (max-width: 768px) {
  .pdf-sidebar {
    display: none;
  }
  .pdf-content {
    padding: 8px 0;
    gap: 8px;
  }
  .page-wrapper {
    max-width: 100%;
    box-shadow: none;
  }
}
</style>
