<template>
  <div class="pdf-viewer">
    <div class="pdf-toolbar">
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <a class="download-btn" href="#" @click.prevent="downloadPdf">
        <el-button type="primary">{{ locale.download }}</el-button>
      </a>
    </div>
    <div class="mobile-download-bar">
      <a class="mobile-download-btn" href="#" @click.prevent="downloadPdf">
        <img src="../assets/download.svg" alt="download" />
        <span>{{ locale.download }}</span>
      </a>
    </div>
    <div class="pdf-loading" v-if="loading">
      <div class="loading-spinner"></div>
      <span class="loading-text">{{ locale.loading }} {{ loadingProgress }}%</span>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: loadingProgress + '%' }"></div>
      </div>
    </div>
    <div class="pdf-error" v-else-if="loadError">
      <span class="error-icon">⚠️</span>
      <span class="error-text">{{ errorMessage }}</span>
      <el-button type="primary" @click="retryLoad">{{ locale.retry }}</el-button>
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
          <span class="page-num">{{ page }}</span>
        </div>
      </div>
      <div class="pdf-content" ref="contentRef">
        <div
          v-for="page in totalPages"
          :key="page"
          :data-page="page"
          :ref="(el) => { if (el) wrapperRefs[page] = el }"
          class="page-wrapper"
          :style="{ minHeight: pageHeight + 'px' }"
        >
          <canvas v-if="visiblePages.has(page)" :ref="(el) => setCanvasRef(page, el)"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, nextTick, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

GlobalWorkerOptions.workerSrc = import.meta.env.BASE_URL + 'pdf.worker.min.js'

const i18n: Record<string, { download: string; loading: string; retry: string }> = {
  zh: { download: '下载', loading: '加载中...', retry: '重试' },
  en: { download: 'Download', loading: 'Loading...', retry: 'Retry' },
  es: { download: 'Descargar', loading: 'Cargando...', retry: 'Reintentar' },
  ja: { download: 'ダウンロード', loading: '読み込み中...', retry: 'リトライ' },
  de: { download: 'Herunterladen', loading: 'Laden...', retry: 'Wiederholen' },
  fr: { download: 'Télécharger', loading: 'Chargement...', retry: 'Réessayer' },
  ko: { download: '다운로드', loading: '로딩 중...', retry: '재시도' },
  th: { download: 'ดาวน์โหลด', loading: 'กำลังโหลด...', retry: 'ลองใหม่' },
  ru: { download: 'Скачать', loading: 'Загрузка...', retry: 'Повторить' },
  'zh-TW': { download: '下載', loading: '載入中...', retry: '重試' },
  tr: { download: 'İndir', loading: 'Yükleniyor...', retry: 'Tekrar dene' },
  uk: { download: 'Завантажити', loading: 'Завантаження...', retry: 'Повторити' },
}

const getLocale = (): { download: string; loading: string; retry: string } => {
  const lang = navigator.language || 'en'
  if (i18n[lang]) return i18n[lang]
  const prefix = lang.split('-')[0]
  if (prefix === 'zh') return i18n['zh-TW']
  if (i18n[prefix]) return i18n[prefix]
  return i18n['en']
}

const locale = getLocale()

const route = useRoute()
const sncode = route.query.sncode as string | undefined
void sncode

const isWechat = () => /MicroMessenger/i.test(navigator.userAgent)

const downloadPdf = async () => {
  if (isWechat()) {
    window.location.href = pdfUrl
    return
  }
  const res = await fetch(pdfUrl)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'X1_Meeting_manual.pdf'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 200)
}

const pdfUrl = 'https://cdn.timekettle.co/X1_Meeting/manual.pdf'
const totalPages = ref(0)
const currentPage = ref(1)
const contentRef = ref<HTMLElement | null>(null)
const sidebarRef = ref<HTMLElement | null>(null)
const loading = ref(true)
const loadingProgress = ref(0)
const loadError = ref(false)
const errorMessage = ref('')
const pageHeight = ref(600)
const visiblePages = reactive(new Set<number>())

const thumbRefs: Record<number, any> = {}
const wrapperRefs: Record<number, any> = {}

let pdfDoc: PDFDocumentProxy | null = null
let mainScale = 1
const renderedPages = new Set<number>()
const renderedThumbs = new Set<number>()
const canvasElements: Record<number, HTMLCanvasElement> = {}

let visibilityObserver: IntersectionObserver | null = null
let currentPageObserver: IntersectionObserver | null = null

const setCanvasRef = (page: number, el: any) => {
  if (el) {
    canvasElements[page] = el as HTMLCanvasElement
    if (!renderedPages.has(page)) {
      renderSinglePage(page)
    }
  }
}

const renderPage = async (page: PDFPageProxy, canvas: HTMLCanvasElement, scale: number) => {
  const viewport = page.getViewport({ scale })
  canvas.width = viewport.width
  canvas.height = viewport.height
  canvas.style.width = '100%'
  canvas.style.height = 'auto'
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    console.error('Failed to get canvas 2d context')
    return
  }
  await page.render({ canvasContext: ctx, viewport }).promise
}

const renderSinglePage = async (pageNum: number) => {
  if (!pdfDoc || renderedPages.has(pageNum)) return
  const canvas = canvasElements[pageNum]
  if (!canvas) return
  renderedPages.add(pageNum)
  try {
    const page = await pdfDoc.getPage(pageNum)
    await renderPage(page, canvas, mainScale)
  } catch (e) {
    renderedPages.delete(pageNum)
    console.error(`Render page ${pageNum} failed:`, e)
  }
}

const renderThumbnail = async (pageNum: number) => {
  if (!pdfDoc || renderedThumbs.has(pageNum)) return
  const canvas = thumbRefs[pageNum]
  if (!canvas) return
  renderedThumbs.add(pageNum)
  try {
    const page = await pdfDoc.getPage(pageNum)
    await renderPage(page, canvas, 0.3)
  } catch (e) {
    renderedThumbs.delete(pageNum)
  }
}

const renderAllThumbnails = async () => {
  if (!pdfDoc) return
  for (let i = 1; i <= totalPages.value; i++) {
    await renderThumbnail(i)
  }
}

const scrollToPage = (pageNum: number) => {
  const el = wrapperRefs[pageNum]
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const scrollThumbIntoView = (pageNum: number) => {
  const sidebar = sidebarRef.value
  if (!sidebar) return
  const thumbEl = sidebar.children[pageNum - 1] as HTMLElement
  if (thumbEl) {
    thumbEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}

const setupObservers = () => {
  const container = contentRef.value
  if (!container) return

  // Observer to track which pages are near the viewport (large margin for preloading)
  visibilityObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const pageNum = Number(entry.target.getAttribute('data-page'))
        if (entry.isIntersecting) {
          if (!visiblePages.has(pageNum)) {
            visiblePages.add(pageNum)
          }
        } else {
          if (visiblePages.has(pageNum)) {
            visiblePages.delete(pageNum)
            renderedPages.delete(pageNum)
            delete canvasElements[pageNum]
          }
        }
      }
    },
    { root: container, rootMargin: '800px 0px' }
  )

  // Observer to track which page is currently in view (for page counter)
  currentPageObserver = new IntersectionObserver(
    (entries) => {
      let maxRatio = 0
      let visiblePage = currentPage.value
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio
          visiblePage = Number(entry.target.getAttribute('data-page'))
        }
      }
      if (maxRatio > 0 && visiblePage !== currentPage.value) {
        currentPage.value = visiblePage
        scrollThumbIntoView(visiblePage)
      }
    },
    { root: container, threshold: [0, 0.25, 0.5, 0.75, 1] }
  )

  for (let i = 1; i <= totalPages.value; i++) {
    const el = wrapperRefs[i]
    if (el) {
      visibilityObserver.observe(el)
      currentPageObserver.observe(el)
    }
  }
}

// Safari bfcache: when the page is restored from back/forward cache,
// pdfjs-dist's web worker is in a broken state (network connections closed,
// worker context lost). Detect this and force a full reload.
const handlePageShow = (event: PageTransitionEvent) => {
  if (event.persisted) {
    window.location.reload()
  }
}

const loadPdf = async () => {
  if (!pdfUrl) {
    loadError.value = true
    errorMessage.value = 'PDF URL is not available'
    loading.value = false
    return
  }

  // Reset state for retry
  loadError.value = false
  errorMessage.value = ''
  loading.value = true
  loadingProgress.value = 0

  const attemptLoad = async (tier: number, useStream: boolean, useRange: boolean) => {
    console.log(`PDF loading: Tier ${tier} (stream=${useStream}, range=${useRange})`)
    const task = getDocument({
      url: pdfUrl,
      withCredentials: false,
      disableRange: !useRange,
      disableStream: !useStream,
      // disableAutoFetch only takes effect when disableStream is also true
      ...(useStream ? {} : { disableAutoFetch: false }),
    })
    task.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
      if (total > 0) {
        loadingProgress.value = Math.min(Math.round((loaded / total) * 100), 100)
      }
    }
    const doc = await task.promise
    return doc
  }

  try {
    // Tier 1: disableRange (no HTTP 206 CORS issues) + streaming (progressive render)
    // Single full-file download, bytes processed as they arrive.
    // Much better UX than Tier 2 because pages start rendering before download completes.
    pdfDoc = await attemptLoad(1, true, false)
  } catch (tier1Err) {
    console.warn('PDF Tier 1 (stream) failed, falling back to Tier 2:', tier1Err)
    // Reset progress for retry
    loadingProgress.value = 0
    try {
      // Tier 2: disableStream — XHR-based full download, maximum compatibility
      pdfDoc = await attemptLoad(2, false, false)
    } catch (tier2Err) {
      console.error('PDF Tier 2 (no-stream) also failed:', tier2Err)
      loading.value = false
      loadError.value = true
      const lang = navigator.language || 'en'
      if (lang.startsWith('zh')) {
        errorMessage.value = 'PDF 加载失败，请检查网络连接后重试'
      } else {
        errorMessage.value = 'Failed to load PDF. Please check your network and try again.'
      }
      return
    }
  }

  totalPages.value = pdfDoc.numPages

  const firstPage = await pdfDoc.getPage(1)
  const baseViewport = firstPage.getViewport({ scale: 1.0 })

  const containerWidth = window.innerWidth
  const displayWidth = Math.min(containerWidth, 800)
  const dpr = window.devicePixelRatio || 1
  mainScale = (displayWidth / baseViewport.width) * dpr

  pageHeight.value = Math.round(displayWidth * (baseViewport.height / baseViewport.width))

  loading.value = false
  await nextTick()
  setupObservers()
  renderAllThumbnails()
}

const retryLoad = () => {
  loadPdf()
}

onMounted(() => {
  window.addEventListener('pageshow', handlePageShow)
  loadPdf()
})

onBeforeUnmount(() => {
  window.removeEventListener('pageshow', handlePageShow)
  visibilityObserver?.disconnect()
  currentPageObserver?.disconnect()
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

.pdf-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.error-icon {
  font-size: 48px;
}

.error-text {
  font-size: 14px;
  color: #666;
  text-align: center;
  max-width: 280px;
  line-height: 1.5;
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
  padding: 16px;
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

.mobile-download-bar {
  display: none;
}

.mobile-download-btn {
  display: none;
}

@media (max-width: 768px) {
  .pdf-toolbar {
    display: none;
  }
  .pdf-sidebar {
    display: none;
  }
  .pdf-content {
    padding: 4px 0;
    gap: 4px;
    padding-bottom: 72px;
  }
  .page-wrapper {
    max-width: 100%;
    box-shadow: none;
  }
  .mobile-download-bar {
    display: block;
    width: 100%;
    background: #fff;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 24px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
    box-sizing: border-box;
    z-index: 100;
  }
  .mobile-download-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 48px;
    background: #fff;
    border-radius: 12px;
    border: 1px solid #191D26;
    text-decoration: none;
    color: #191D26;
    font-size: 16px;
    font-weight: 500;
  }
  .mobile-download-btn img {
    width: 24px;
  }
}
</style>
