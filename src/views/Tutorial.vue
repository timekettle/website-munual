<template>
  <div class="tutorial">

    <!-- 顶部栏：tab（操作视频 / 使用手册）居中 + 语言下拉框靠右 -->
    <header class="tutorial-header">
      <!-- 品牌区：logo + 帮助中心（仅桌面端） -->
      <div class="header-brand">
        <img class="header-logo" :src="logoUrl" alt="" />
        <span class="header-divider"></span>
        <span class="header-help">{{ t.helpCenter }}</span>
      </div>

      <nav class="tabs">
        <button
          type="button"
          class="tab"
          :class="{ active: activeTab === 'video' }"
          @click="switchTab('video')"
        >
          <span>{{ t.tabVideo }}</span>
        </button>
        <button
          type="button"
          class="tab"
          :class="{ active: activeTab === 'manual' }"
          @click="switchTab('manual')"
        >
          <span>{{ t.tabManual }}</span>
        </button>
      </nav>

      <div class="lang-wrap">
        <el-dropdown v-if="!isSmallScreen" trigger="click" @command="onLangChange" @visible-change="onLangDropdownVisible">
          <span class="lang-trigger" :class="{ active: langDropdownVisible }">
            <img class="lang-icon" :src="langIconUrl" alt="" />
           
            <span class="lang-label">{{ langLabel }}</span>
            <svg class="lang-caret" viewBox="0 0 24 24" width="12" height="12">
              <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="lang in languages"
                :key="lang.code"
                :command="lang.code"
              >
                <div class="lang-opt">
                  <span class="lang-opt-main">{{ lang.native }}</span>
                  <span class="lang-opt-sub">{{ lang.names[currentLang] }}</span>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 小屏：点击打开语言抽屉 -->
        <span v-else class="lang-trigger" :class="{ active: langDrawerOpen }" @click="openLangDrawer">
          <span class="lang-label">{{ langLabel }}</span>
          <svg class="lang-caret" viewBox="0 0 24 24" width="12" height="12">
            <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </div>
    </header>

    <!-- 操作视频 tab -->
    <main v-if="activeTab === 'video'" class="video-tab">
      <div class="video-main">
      <!-- 视频播放器（自定义控制条：无音量，含倍速与全屏） -->
      <div class="video-player" :class="{ 'css-fullscreen': cssFullscreen, 'css-fullscreen-exiting': cssFullscreenExiting }" ref="videoPlayerRef" @mouseenter="isHovering = true" @mouseleave="isHovering = false" @mousemove="onPlayerMove" @touchstart="onPlayerTouch" @touchmove="onPlayerTouch">
        <video
          ref="videoRef"
          class="video-el"
          :key="currentVideo.url"
          :src="currentVideo.url"
          :data-video-id="currentVideo.id"
          :poster="currentPoster"
          preload="metadata"
          playsinline
          @click="togglePlay"
          @play="onVideoPlay"
          @pause="onVideoPause"
          @ended="onVideoEnded"
          @waiting="buffering = true"
          @playing="buffering = false"
          @canplay="buffering = false"
          @timeupdate="onTimeUpdate"
          @loadedmetadata="onLoadedMetadata"
        />

        <!-- 缓冲加载提示 -->
        <div v-if="buffering" class="video-buffering">
          <div class="buffering-spinner"></div>
        </div>

        <!-- 中央播放按钮（未播放时） -->
        <div v-if="!playing" class="video-placeholder" :class="{ 'is-fullscreen': fullscreen }" @click="togglePlay">
          <button type="button" class="play-btn" aria-label="play">
            <svg viewBox="0 0 24 24" width="34" height="34">
              <path d="M8 5v14l11-7z" fill="currentColor" />
            </svg>
          </button>
        </div>

        <!-- 底部控制条 -->
        <div v-if="!fullscreen" class="video-controls" :class="{ 'controls-hidden': controlsHiddenEffect }" @click.stop>
          <button type="button" class="ctrl-btn" :aria-label="playing ? 'pause' : 'play'" @click="togglePlay">
            <svg v-if="playing" viewBox="0 0 24 24" width="18" height="18">
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" fill="currentColor" />
            </svg>
            <svg v-else viewBox="0 0 24 24" width="18" height="18">
              <path d="M8 5v14l11-7z" fill="currentColor" />
            </svg>
          </button>

          <div class="progress" @pointerdown="onSeekPointerDown" @pointermove="onSeekPointerMove" @pointerup="onSeekPointerEnd" @pointercancel="onSeekPointerEnd">
            <div class="progress-track">
              <div class="progress-played" :style="{ width: progress + '%' }"></div>
              <span class="progress-dot" :style="{ left: progress + '%' }"></span>
            </div>
          </div>

          <span class="time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>

          <div class="speed-wrap">
            <button type="button" class="speed-btn" @click.stop="toggleSpeedMenu">{{ speed }}</button>
            <ul v-if="speedMenuOpen" class="speed-menu" @click.stop>
              <li
                v-for="s in speeds"
                :key="s"
                :class="{ active: s === speed }"
                @click="setSpeed(s)"
              >
                {{ s }}
              </li>
            </ul>
          </div>

          <button
            type="button"
            class="ctrl-btn"
            :aria-label="fullscreen ? 'exit fullscreen' : 'fullscreen'"
            @click="toggleFullscreen"
          >
            <svg v-if="fullscreen" viewBox="0 0 24 24" width="18" height="18">
              <path d="M8 3v3a2 2 0 0 1-2 2H3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M16 3v3a2 2 0 0 0 2 2h3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M8 21v-3a2 2 0 0 0-2-2H3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M16 21v-3a2 2 0 0 1 2-2h3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <svg v-else viewBox="0 0 24 24" width="18" height="18">
              <path d="M8 3H5a2 2 0 0 0-2 2v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M16 3h3a2 2 0 0 1 2 2v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M8 21H5a2 2 0 0 1-2-2v-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M16 21h3a2 2 0 0 0 2-2v-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>

        <!-- 全屏专属 UI：顶部（章节徽章 + 返回）、章节抽屉、底部控制条 -->
        <div v-if="fullscreen" class="fs-top" :class="{ 'fs-ui-hidden': fsUiHidden }">
          <button type="button" class="fs-exit" aria-label="exit fullscreen" @click="toggleFullscreen">
            <svg viewBox="0 0 24 24" width="28" height="28">
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>

        <div v-if="fullscreen && fsChaptersOpen" class="fs-chapters-mask" @click="toggleFsChapters"></div>

        <aside v-if="fullscreen && fsChaptersOpen" class="fs-chapters" @click.stop>
          <div class="fs-chapters-header">{{ t.chapterList }}</div>
          <ul class="fs-chapters-list">
            <li
              v-for="(item, i) in timeline"
              :key="i"
              class="fs-chapter"
              :class="{ active: i === activeTimelineIndex }"
              @click="playFsChapter(i)"
            >
              <span class="fs-chapter-time">
                <svg class="fs-chapter-play" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" fill="currentColor" />
                </svg>
                {{ formatClock(item.seconds) }}
              </span>
              <span class="fs-chapter-label">{{ item.label }}</span>
            </li>
          </ul>
        </aside>

        <div v-if="fullscreen" class="fs-controls" :class="{ 'fs-ui-hidden': fsUiHidden }" @click.stop>
          <div class="fs-progress" @pointerdown="onSeekPointerDown" @pointermove="onSeekPointerMove" @pointerup="onSeekPointerEnd" @pointercancel="onSeekPointerEnd">
            <div class="fs-progress-track">
              <div class="fs-progress-played" :style="{ width: progress + '%' }"></div>
              <span class="fs-progress-dot" :style="{ left: progress + '%' }"></span>
            </div>
          </div>
          <div class="fs-controls-row">
            <button type="button" class="fs-btn fs-btn-play" :aria-label="playing ? 'pause' : 'play'" @click="togglePlay">
              <svg v-if="playing" viewBox="0 0 24 24" width="26" height="26">
                <path d="M6 5h4v14H6zM14 5h4v14h-4z" fill="currentColor" />
              </svg>
              <svg v-else viewBox="0 0 24 24" width="26" height="26">
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
            </button>
            <span class="fs-time">
              <span>{{ formatTime(currentTime) }}</span><span class="fs-time-total"> / {{ formatTime(duration) }}</span>
            </span>
            <span v-if="activeTimelineLabel" class="fs-chapter-chip">{{ activeTimelineLabel }}</span>
            <span class="fs-spacer"></span>
            <button v-if="timeline.length > 0" type="button" class="fs-pill" @click="toggleFsChapters">{{ t.chapters }}</button>
            <div class="fs-speed-wrap">
              <button type="button" class="fs-pill fs-speed" @click.stop="toggleSpeedMenu">{{ speedShort }}</button>
              <ul v-if="speedMenuOpen" class="speed-menu fs-speed-menu" @click.stop>
                <li
                  v-for="s in speeds"
                  :key="s"
                  :class="{ active: s === speed }"
                  @click="setSpeed(s)"
                >
                  {{ s }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 章节标题 + 目录按钮 -->
      <div class="chapters-header">
        <h2 class="chapters-title">{{ currentVideo.title }}</h2>
        <button type="button" class="dir-btn" @click="openDrawer">
          <span>{{ t.directory }}</span>
        </button>
      </div>

      <!-- 时间线 -->
      <ul v-if="timeline.length > 0" class="timeline">
        <li
          v-for="(item, i) in timeline"
          :key="i"
          class="timeline-item"
          :class="{ active: i === activeTimelineIndex }"
          @click="playAt(i)"
        >
          <div class="timeline-chip">
            <svg class="timeline-play" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" fill="currentColor" />
            </svg>
            <span class="timeline-time">{{ formatClock(item.seconds) }}</span>
          </div>
          <span class="timeline-label">{{ item.label }}</span>
        </li>
      </ul>
      </div>

      <!-- 目录侧边栏（桌面端，宽屏时取代抽屉） -->
      <aside class="video-sidebar">
        <div class="sidebar-header">
          <img class="sidebar-header-icon" :src="directoryIconUrl" alt="" />
          <span class="sidebar-title">{{ t.directory }}</span>
        </div>
        <ul class="sidebar-list">
          <li
            v-for="item in videos"
            :key="item.id"
            class="catalog-item"
            :class="{ active: item.id === currentVideo.id }"
            @click="selectVideo(item.id)"
          >
            <img class="item-icon" :src="item.icon" :alt="item.title" />
            <div class="item-info">
              <p class="item-title">{{ item.title }}</p>
              <p class="item-duration">
                {{ item.duration }}
                <span v-if="item.id === currentVideo.id" class="item-eq" aria-hidden="true">
                  <i></i><i></i><i></i>
                </span>
              </p>
            </div>
          </li>
        </ul>
      </aside>
    </main>

    <!-- 使用手册 tab：内嵌 PdfViewer -->
    <main v-else class="manual-tab">
      <PdfViewer embedded :lang="currentLang" />
    </main>

    <!-- 目录抽屉（自下而上） -->
    <transition name="mask-fade">
      <div v-if="drawerOpen" class="drawer-mask" @click="closeDrawer"></div>
    </transition>
    <transition name="drawer-slide">
      <div v-if="drawerOpen" class="drawer" :style="{ top: drawerTop + 'px' }">
        <div class="drawer-header">
          <span class="drawer-title">{{ t.directory }}</span>
          <button type="button" class="drawer-close" aria-label="close" @click="closeDrawer">
            <svg viewBox="0 0 24 24" width="30" height="30">
              <path d="M4 4l16 16M20 4L4 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </div>
        <ul class="drawer-list">
          <li
            v-for="item in videos"
            :key="item.id"
            class="catalog-item"
            :class="{ active: item.id === currentVideo.id }"
            @click="selectVideo(item.id)"
          >
            <img class="item-icon" :src="item.icon" :alt="item.title" />
            <div class="item-info">
              <p class="item-title">{{ item.title }}</p>
            </div>
          </li>
        </ul>
      </div>
    </transition>

    <!-- 语言抽屉（小屏，自下而上） -->
    <transition name="mask-fade">
      <div v-if="langDrawerOpen" class="drawer-mask" @click="closeLangDrawer"></div>
    </transition>
    <transition name="drawer-slide">
      <div v-if="langDrawerOpen" class="drawer lang-drawer" :style="{ top: drawerTop + 'px' }">
        <div class="drawer-header">
          <span class="drawer-title">{{ t.langSelect }}</span>
          <button type="button" class="drawer-close" aria-label="close" @click="closeLangDrawer">
            <svg viewBox="0 0 24 24" width="30" height="30">
              <path d="M4 4l16 16M20 4L4 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </div>
        <ul class="lang-list">
          <li
            v-for="lang in languages"
            :key="lang.code"
            class="lang-item"
            :class="{ active: lang.code === currentLang }"
            @click="selectLang(lang.code)"
          >
            <div class="lang-item-info">
              <p class="lang-item-name">{{ lang.native }}</p>
              <p class="lang-item-sub">{{ lang.names[currentLang] }}</p>
            </div>
            <svg v-if="lang.code === currentLang" class="lang-check" viewBox="0 0 24 24" width="24" height="24">
              <path d="M5 12l5 5L20 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </li>
        </ul>
      </div>
    </transition>


  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { track } from '../plugins/sensors'
import iconLight from '../assets/icon_light.svg'
import iconGroup from '../assets/icon_group.svg'
import iconAsk from '../assets/icon_ask.svg'
import iconConversion from '../assets/icon_conversion.svg'
import iconListen from '../assets/icon_listen.svg'
import iconVideo from '../assets/icon_video.svg'
import iconOther from '../assets/icon_other.svg'
const videoUrl = 'https://tmk-resources.oss-cn-shenzhen.aliyuncs.com/TimekettleX1/Video/X1_meeting.mp4'
const groupMeetingUrl = 'https://tmk-resources.oss-cn-shenzhen.aliyuncs.com/TimekettleX1/Video/Group_meeting.mp4'
const twoPersonConversationUrl = 'https://tmk-resources.oss-cn-shenzhen.aliyuncs.com/TimekettleX1/Video/two_person_conversation.mp4'
const audienceTranslationUrl = 'https://tmk-resources.oss-cn-shenzhen.aliyuncs.com/TimekettleX1/Video/audience_translation.mp4'
const callVideoUrl = 'https://tmk-resources.oss-cn-shenzhen.aliyuncs.com/TimekettleX1/Video/call_video.mp4'
const holdInHandUrl = 'https://tmk-resources.oss-cn-shenzhen.aliyuncs.com/TimekettleX1/Video/hold_in_hand.mp4'
const otherUrl = 'https://tmk-resources.oss-cn-shenzhen.aliyuncs.com/TimekettleX1/Video/other.mp4'
// 多语言分语言视频（德语/日语等）所在目录前缀
const tutorialClipBase = 'https://tmk-resources.oss-cn-shenzhen.aliyuncs.com/TimekettleX1/Video/X1%20Meeting%20Tutorials/X1M%20%E6%95%99%E5%AD%A6%E5%88%86%E5%89%AA%E8%BE%91'

// 多人会议分剪辑（德语/日语等）所在目录前缀（多人会议为独立目录，文件名即语言名）
const groupMeetingClipBase = 'https://tmk-resources.oss-cn-shenzhen.aliyuncs.com/TimekettleX1/Video/X1%20Meeting%20Tutorials/X1M%20%E5%A4%9A%E4%BA%BA%E4%BC%9A%E8%AE%AE%20%E5%88%86%E5%89%AA%E8%BE%91'
import logoUrl from '../assets/tutorial/logo.svg'
import directoryIconUrl from '../assets/tutorial/icon_directory.svg'
import langIconUrl from '../assets/tutorial/icon_lang.svg'
import PdfViewer from './PdfViewer.vue'
import { applyDocumentTitle } from '../i18n'

type TabKey = 'video' | 'manual'

interface VideoItem {
  id: number
  title: string
  icon: string
  url: string
  duration: string
}

interface TimelineItem {
  seconds: number
  label: string
  key: MsgKey
}

interface Messages {
  tabVideo: string
  tabManual: string
  directory: string
  manualEmpty: string
  helpCenter: string
  chapters: string
  chapterList: string
  langSelect: string
  // 视频标题
  videoOverview: string
  videoGroupMeeting: string
  videoTwoPerson: string
  videoListen: string
  videoHandheld: string
  videoCall: string
  videoOther: string
  // 时间线章节
  tUnbox: string
  tActivate: string
  tUnboxActivate: string
  tOffline: string
  tSpeed: string
  tExportMinutes: string
  tUploadLogs: string
  tSystemUpdate: string
  tFactoryReset: string
  tEartips: string
  // 汇总视频专属章节（英语/西班牙语/德语使用；中文/日语沿用默认章节）
  tMultiMode: string
  tGroupMeetingFeature: string
  tOneToOne: string
  tListenPlay: string
  tMedia: string
  tQandAHandheld: string
  tListenMode: string
  tCallMode: string
  tHandheldMode: string
  tHost: string
  tMember: string
  tPhone: string
  tComputer: string
  tMicNotes: string
  tLangSwitch: string
  tMeetingSettings: string
  tKeySettings: string
}

type MsgKey = keyof Messages

interface TimelineMetaItem {
  seconds: number
  key: MsgKey
}

interface VideoMeta {
  id: number
  titleKey: MsgKey
  icon: string
  url: string
  urlByLang?: Partial<Record<string, string>>
  duration: string
  durationByLang?: Partial<Record<string, string>>
}

interface LanguageItem {
  code: string
  native: string
  names: Record<string, string>
}

const languages: LanguageItem[] = [
  { code: 'zh', native: '中文', names: { zh: '中文', en: 'Chinese', es: 'Chino', ja: '中国語', de: 'Chinesisch' } },
  { code: 'en', native: 'English', names: { zh: '英语', en: 'English', es: 'Inglés', ja: '英語', de: 'Englisch' } },
  { code: 'es', native: 'Español', names: { zh: '西班牙语', en: 'Spanish', es: 'Español', ja: 'スペイン語', de: 'Spanisch' } },
  { code: 'ja', native: '日本語', names: { zh: '日语', en: 'Japanese', es: 'Japonés', ja: '日本語', de: 'Japanisch' } },
  { code: 'de', native: 'Deutsch', names: { zh: '德语', en: 'German', es: 'Alemán', ja: 'ドイツ語', de: 'Deutsch' } },
]

const messages: Record<string, Messages> = {
  zh: { tabVideo: '操作视频', tabManual: '使用手册', directory: '目录', manualEmpty: '暂无内容', helpCenter: '帮助中心', langSelect: '语言选择', chapters: '章节', chapterList: '章节目录', videoOverview: '使用教学汇总', videoGroupMeeting: '多人会议模式', videoTwoPerson: '双人对话模式', videoListen: '旁听翻译模式', videoHandheld: '手持翻译模式', videoCall: '通话/视频翻译模式', videoOther: '其他', tUnbox: '开箱', tActivate: '激活', tUnboxActivate: '开箱激活', tOffline: '离线翻译模式', tSpeed: '翻译速度调整', tExportMinutes: '导出会议纪要', tUploadLogs: '上传日志', tSystemUpdate: '系统和耳机升级', tFactoryReset: '恢复出厂设置', tEartips: '耳套和耳挂', tMultiMode: '多模式翻译', tGroupMeetingFeature: '多人会议功能', tOneToOne: '一对一翻译模式', tListenPlay: '聆听与播放翻译模式', tMedia: '媒体翻译模式', tQandAHandheld: '问答与手持翻译模式', tListenMode: '旁听翻译模式', tCallMode: '通话/视频翻译模式', tHandheldMode: '手持翻译模式', tHost: '主持人端操作', tMember: '成员端操作', tPhone: '手机端操作', tComputer: '电脑端操作', tMicNotes: '耳机收音注意事项', tLangSwitch: '语种切换说明', tMeetingSettings: '主持人-会议设置讲解', tKeySettings: '主持人-关键设置开关说明' },
  en: { tabVideo: 'Video', tabManual: 'Manual', directory: 'Video List', manualEmpty: 'No content yet', helpCenter: 'Help Center', langSelect: 'Language', chapters: 'Chapters', chapterList: 'Chapter List', videoOverview: 'Tutorial Overview', videoGroupMeeting: 'Multi-Person Translation Mode', videoTwoPerson: 'Two-person Conversation', videoListen: 'Listen Translation', videoHandheld: 'Handheld Translation', videoCall: 'Call & Video Translation', videoOther: 'Others', tUnbox: 'Unboxing', tActivate: 'Power On and Activation', tUnboxActivate: 'Unboxing & Activation', tOffline: 'Offline Translation Mode', tSpeed: 'Translation Speed Adjustment', tExportMinutes: 'Export Meeting Minutes', tUploadLogs: 'Upload Logs', tSystemUpdate: 'System and Headset Firmware Upgrade', tFactoryReset: 'Restore Factory Settings', tEartips: 'Ear Tips and Ear Hooks', tMultiMode: 'Multi-Person Translation Mode', tGroupMeetingFeature: 'Group Meeting', tOneToOne: 'One-on-One Translation Mode', tListenPlay: 'Listen & Play Translation Mode', tMedia: 'Media Translation Mode', tQandAHandheld: 'Ask & Go Handheld Translation Mode', tListenMode: 'Listen Translation Mode', tCallMode: 'Call & Video Translation Mode', tHandheldMode: 'Handheld Translation Mode', tHost: 'Operation for X1 Meeting Host', tMember: 'Operation for X1 Meeting Participant', tPhone: 'Operations for Mobile Participants', tComputer: 'Operations for Computer Participants', tMicNotes: 'Earbuds Audio Recording Notes', tLangSwitch: 'Language Switching Instructions', tMeetingSettings: 'Meeting Setup Explanation for Host (Basic Settings)', tKeySettings: 'Key Setting Switch Instructions for Host' },
  es: { tabVideo: 'Vídeo', tabManual: 'Manual', directory: 'Lista de vídeos', manualEmpty: 'Sin contenido', helpCenter: 'Centro de ayuda', langSelect: 'Idioma', chapters: 'Capítulos', chapterList: 'Lista de capítulos', videoOverview: 'Resumen de tutoriales', videoGroupMeeting: 'Modo de Traducción para Varios', videoTwoPerson: 'Conversación a dos', videoListen: 'Traducción en escucha', videoHandheld: 'Traducción de mano', videoCall: 'Traducción en llamadas', videoOther: 'Otros', tUnbox: 'Desembalaje', tActivate: 'Encendido y activación', tUnboxActivate: 'Desembalaje y activación', tOffline: 'Modo de traducción sin conexión', tSpeed: 'Ajuste de la velocidad de traducción', tExportMinutes: 'Exportar actas de la reunión', tUploadLogs: 'Subir registros', tSystemUpdate: 'Actualización del firmware del sistema y de los auriculares', tFactoryReset: 'Restaurar configuración de fábrica', tEartips: 'Almohadillas y ganchos para orejas', tMultiMode: 'Modo de Traducción para Varios', tGroupMeetingFeature: 'Reunión en grupo', tOneToOne: 'Modo de Traducción Cara-a-Cara', tListenPlay: 'Modo de Traducción Escuchar y Reproducir', tMedia: 'Modo de Traducción Multimedia', tQandAHandheld: 'Modo de Traducción de Mano Preguntar e Ir', tListenMode: 'Modo de traducción en escucha', tCallMode: 'Modo de traducción en llamadas', tHandheldMode: 'Modo de traducción de mano', tHost: 'Operación para el anfitrión de X1 Meeting', tMember: 'Operación para el participante de X1 Meeting', tPhone: 'Operaciones para participantes móviles', tComputer: 'Operaciones para participantes desde computadora', tMicNotes: 'Notas sobre la grabación de audio con los auriculares', tLangSwitch: 'Instrucciones para cambiar de idioma', tMeetingSettings: 'Explicación de la configuración de la reunión para el anfitrión', tKeySettings: 'Instrucciones sobre los interruptores de configuración clave para el anfitrión' },
  ja: { tabVideo: '操作動画', tabManual: '取扱説明書', directory: '動画一覧', manualEmpty: 'コンテンツなし', helpCenter: 'ヘルプセンター', langSelect: '言語', chapters: 'チャプター', chapterList: 'チャプター一覧', videoOverview: '使い方まとめ', videoGroupMeeting: '多人数会議機能', videoTwoPerson: '2人対話', videoListen: '傍聴翻訳', videoHandheld: '手持ち翻訳', videoCall: '通話・ビデオ翻訳', videoOther: 'その他', tUnbox: '開封', tActivate: '起動とアクティベーション', tUnboxActivate: '開封とアクティベーション', tOffline: 'オフライン通訳モード', tSpeed: '通訳速度調整', tExportMinutes: '会議議事録のエクスポート', tUploadLogs: 'ログのアップロード', tSystemUpdate: 'システムとイヤホンのアップグレード', tFactoryReset: '工場出荷状態にリセット', tEartips: 'イヤーピースとイヤーフック', tMultiMode: '複数モード翻訳', tGroupMeetingFeature: '多人数会議機能', tOneToOne: '1対1翻訳', tListenPlay: 'リスニング＆再生翻訳', tMedia: 'メディア翻訳', tQandAHandheld: '質問＆手持ち翻訳', tListenMode: '傍受通訳モード', tCallMode: '通話/ビデオ通訳モード', tHandheldMode: '手持ち通訳モード', tHost: 'ホスト側の操作', tMember: 'X1 デバイス（参加者側）の操作', tPhone: 'スマホ側の操作', tComputer: 'パソコン側の操作', tMicNotes: 'イヤホン音声収集時の注意点', tLangSwitch: '言語切り替えの説明', tMeetingSettings: 'ホストによる会議設定の説明', tKeySettings: 'ホストによる重要設定スイッチの説明' },
  de: { tabVideo: 'Video', tabManual: 'Handbuch', directory: 'Videoliste', manualEmpty: 'Kein Inhalt', helpCenter: 'Hilfe-Center', langSelect: 'Sprache', chapters: 'Kapitel', chapterList: 'Kapitelliste', videoOverview: 'Tutorial-Übersicht', videoGroupMeeting: 'Übersetzung für mehrere Modus', videoTwoPerson: 'Gespräch zu zweit', videoListen: 'Zuhörübersetzung', videoHandheld: 'Handübersetzung', videoCall: 'Anruf- & Videoübersetzung', videoOther: 'Sonstiges', tUnbox: 'Auspacken', tActivate: 'Einschalten und Aktivierung', tUnboxActivate: 'Auspacken & Aktivierung', tOffline: 'Offline-Übersetzungsmodus', tSpeed: 'Anpassung der Übersetzungsgeschwindigkeit', tExportMinutes: 'Besprechungsprotokolle exportieren', tUploadLogs: 'Protokolle hochladen', tSystemUpdate: 'System- und Kopfhörer Firmware-Upgrade', tFactoryReset: 'Werkseinstellungen', tEartips: 'Ohrstöpsel und Ohrbügel', tMultiMode: 'Übersetzung für mehrere Modus', tGroupMeetingFeature: 'Gruppenbesprechung', tOneToOne: 'Ein-zu-Eins-Übersetzungsmodus', tListenPlay: 'Hören & Abspielen-Übersetzungsmodus', tMedia: 'Medien-Übersetzung-Modus', tQandAHandheld: 'Fragen & Los-Handheld-Übersetzungsmodus', tListenMode: 'Zuhörübersetzungsmodus', tCallMode: 'Anruf- & Videoübersetzungsmodus', tHandheldMode: 'Handübersetzungsmodus', tHost: 'Bedienung für den X1 Meeting-Gastgeber', tMember: 'Bedienung für den X1 Meeting-Teilnehmer', tPhone: 'Bedienung für mobile Teilnehmer', tComputer: 'Bedienung für Computer-Teilnehmer', tMicNotes: 'Hinweise zur Audioaufnahme mit den Ohrhörern', tLangSwitch: 'Anweisungen zum Sprachwechsel', tMeetingSettings: 'Erklärung der Meeting-Einrichtung für den Gastgeber', tKeySettings: 'Anweisungen für wichtige Einstellungsschalter für den Gastgeber' },
}

const getDefaultLang = (): string => {
  const lang = navigator.language || 'en'
  if (messages[lang]) return lang
  const prefix = lang.split('-')[0]
  if (messages[prefix]) return prefix
  return 'en'
}

const currentLang = ref<string>(getDefaultLang())
const t = computed<Messages>(() => messages[currentLang.value] ?? messages.zh)

const videoMeta: VideoMeta[] = [
  {
    id: 1,
    titleKey: 'videoOverview',
    icon: iconLight,
    url: videoUrl,
    urlByLang: {
      en: 'https://tmk-resources.oss-cn-shenzhen.aliyuncs.com/TimekettleX1/Video/X1%20Meeting%20Tutorials/X1_Meeting-Tutorial-EN.mp4',
      es: 'https://tmk-resources.oss-cn-shenzhen.aliyuncs.com/TimekettleX1/Video/X1%20Meeting%20Tutorials/X1_Meeting-Tutorial-ES.mp4',
      ja: 'https://tmk-resources.oss-cn-shenzhen.aliyuncs.com/TimekettleX1/Video/X1%20Meeting%20Tutorials/X1_Meeting-Tutorial-JP.mp4',
      de: 'https://tmk-resources.oss-cn-shenzhen.aliyuncs.com/TimekettleX1/Video/X1%20Meeting%20Tutorials/X1_Meeting-Tutorial-DE.mp4',
    },
    duration: '10:55',
    durationByLang: { en: '11:39', es: '12:51', ja: '11:49', de: '12:40' },
  },
  { id: 2, titleKey: 'videoGroupMeeting', icon: iconGroup, url: groupMeetingUrl, urlByLang: { de: `${groupMeetingClipBase}/%E5%BE%B7%E8%AF%AD.mp4`, ja: `${groupMeetingClipBase}/%E6%97%A5%E8%AF%AD.mp4`, en: `${groupMeetingClipBase}/%E8%8B%B1%E6%96%87.mp4`, es: `${groupMeetingClipBase}/%E8%A5%BF%E8%AF%AD.mp4` }, duration: '4:58', durationByLang: { en: '5:19', es: '6:05', ja: '5:24', de: '5:49' } },
  { id: 3, titleKey: 'videoTwoPerson', icon: iconConversion, url: twoPersonConversationUrl, urlByLang: { de: `${tutorialClipBase}/%E5%BE%B7%E8%AF%AD/%E5%8F%8C%E4%BA%BA%E5%AF%B9%E8%AF%9D.mp4`, ja: `${tutorialClipBase}/%E6%97%A5%E8%AF%AD/%E5%8F%8C%E4%BA%BA%E5%AF%B9%E8%AF%9D.mp4`, en: `${tutorialClipBase}/%E8%8B%B1%E6%96%87/%E5%8F%8C%E4%BA%BA%E5%AF%B9%E8%AF%9D.mp4`, es: `${tutorialClipBase}/%E8%A5%BF%E8%AF%AD/%E5%8F%8C%E4%BA%BA%E5%AF%B9%E8%AF%9D.mp4` }, duration: '0:42', durationByLang: { en: '0:47', es: '0:48', ja: '0:46', de: '0:48' } },
  { id: 4, titleKey: 'videoListen', icon: iconListen, url: audienceTranslationUrl, urlByLang: { de: `${tutorialClipBase}/%E5%BE%B7%E8%AF%AD/%E6%97%81%E5%90%AC%E7%BF%BB%E8%AF%91.mp4`, ja: `${tutorialClipBase}/%E6%97%A5%E8%AF%AD/%E6%97%81%E5%90%AC%E7%BF%BB%E8%AF%91.mp4`, en: `${tutorialClipBase}/%E8%8B%B1%E6%96%87/%E6%97%81%E5%90%AC%E7%BF%BB%E8%AF%91.mp4`, es: `${tutorialClipBase}/%E8%A5%BF%E8%AF%AD/%E6%97%81%E5%90%AC%E7%BF%BB%E8%AF%91.mp4` }, duration: '0:41', durationByLang: { en: '0:43', es: '0:48', ja: '0:44', de: '0:51' } },
  { id: 5, titleKey: 'videoHandheld', icon: iconAsk, url: holdInHandUrl, urlByLang: { de: `${tutorialClipBase}/%E5%BE%B7%E8%AF%AD/%E6%89%8B%E6%8C%81%E7%BF%BB%E8%AF%91.mp4`, ja: `${tutorialClipBase}/%E6%97%A5%E8%AF%AD/%E6%89%8B%E6%8C%81%E7%BF%BB%E8%AF%91.mp4`, en: `${tutorialClipBase}/%E8%8B%B1%E6%96%87/%E6%89%8B%E6%8C%81%E7%BF%BB%E8%AF%91.mp4`, es: `${tutorialClipBase}/%E8%A5%BF%E8%AF%AD/%E6%89%8B%E6%8C%81%E7%BF%BB%E8%AF%91.mp4` }, duration: '0:20', durationByLang: { en: '0:23', es: '0:26', ja: '0:23', de: '0:24' } },
  { id: 6, titleKey: 'videoCall', icon: iconVideo, url: callVideoUrl, urlByLang: { de: `${tutorialClipBase}/%E5%BE%B7%E8%AF%AD/%E9%80%9A%E8%AF%9D%E8%A7%86%E9%A2%91%E7%BF%BB%E8%AF%91.mp4`, ja: `${tutorialClipBase}/%E6%97%A5%E8%AF%AD/%E9%80%9A%E8%AF%9D%E8%A7%86%E9%A2%91%E7%BF%BB%E8%AF%91.mp4`, en: `${tutorialClipBase}/%E8%8B%B1%E6%96%87/%E9%80%9A%E8%AF%9D%E8%A7%86%E9%A2%91%E7%BF%BB%E8%AF%91.mp4`, es: `${tutorialClipBase}/%E8%A5%BF%E8%AF%AD/%E9%80%9A%E8%AF%9D%E8%A7%86%E9%A2%91%E7%BF%BB%E8%AF%91.mp4` }, duration: '0:44', durationByLang: { en: '0:50', es: '0:56', ja: '0:50', de: '0:58' } },
  { id: 7, titleKey: 'videoOther', icon: iconOther, url: otherUrl, urlByLang: { de: `${tutorialClipBase}/%E5%BE%B7%E8%AF%AD/%E5%85%B6%E4%BB%96%E5%8A%9F%E8%83%BD-%E6%97%A5%E5%BF%97%20%E5%8D%87%E7%BA%A7%20%E4%BD%A9%E6%88%B4.mp4`, ja: `${tutorialClipBase}/%E6%97%A5%E8%AF%AD/%E5%85%B6%E4%BB%96%E5%8A%9F%E8%83%BD-%E6%97%A5%E5%BF%97%20%E5%8D%87%E7%BA%A7%20%E4%BD%A9%E6%88%B4.mp4`, en: `${tutorialClipBase}/%E8%8B%B1%E6%96%87/%E5%85%B6%E4%BB%96%E5%8A%9F%E8%83%BD-%E6%97%A5%E5%BF%97%20%E5%8D%87%E7%BA%A7%20%E4%BD%A9%E6%88%B4.mp4`, es: `${tutorialClipBase}/%E8%A5%BF%E8%AF%AD/%E5%85%B6%E4%BB%96%E5%8A%9F%E8%83%BD-%E6%97%A5%E5%BF%97%20%E5%8D%87%E7%BA%A7%20%E4%BD%A9%E6%88%B4.mp4` }, duration: '3:17', durationByLang: { en: '1:44', es: '1:52', ja: '1:46', de: '1:52' } },
]

// 用 OSS 视频截帧能力生成封面：t_1000 取第 1 秒那一帧，避开片头黑屏
function videoSnapshot(url: string, w = 320, h = 180): string {
  return `${url}?x-oss-process=video/snapshot,t_1000,f_jpg,w_${w},h_${h}`
}

const videos = computed<VideoItem[]>(() =>
  videoMeta.map((m) => ({
    id: m.id,
    title: t.value[m.titleKey],
    icon: m.icon,
    url: m.urlByLang?.[currentLang.value] ?? m.url,
    duration: m.durationByLang?.[currentLang.value] ?? m.duration,
  }))
)

// 时间线章节（mm:ss 已转换为秒数），按视频 id 分组，label 通过 key 本地化。
const timelineMeta: Record<number, TimelineMetaItem[]> = {
  1: [
    { seconds: 3, key: 'tUnbox' },
    { seconds: 20, key: 'tUnboxActivate' },
    { seconds: 88, key: 'tGroupMeetingFeature' },
    { seconds: 385, key: 'videoTwoPerson' },
    { seconds: 427, key: 'videoListen' },
    { seconds: 469, key: 'videoCall' },
    { seconds: 513, key: 'videoHandheld' },
    { seconds: 533, key: 'tOffline' },
    { seconds: 553, key: 'tSpeed' },
    { seconds: 561, key: 'tExportMinutes' },
    { seconds: 594, key: 'tUploadLogs' },
    { seconds: 608, key: 'tSystemUpdate' },
    { seconds: 619, key: 'tFactoryReset' },
    { seconds: 636, key: 'tEartips' },
  ],
  2: [
    { seconds: 0, key: 'videoGroupMeeting' },
    { seconds: 8, key: 'tHost' },
    { seconds: 84, key: 'tMember' },
    { seconds: 138, key: 'tPhone' },
    { seconds: 189, key: 'tComputer' },
    { seconds: 231, key: 'tMicNotes' },
    { seconds: 247, key: 'tLangSwitch' },
    { seconds: 261, key: 'tMeetingSettings' },
    { seconds: 280, key: 'tKeySettings' },
  ],
  7: [
    { seconds: 0, key: 'tUnbox' },
    { seconds: 16, key: 'tActivate' },
    { seconds: 82, key: 'tOffline' },
    { seconds: 101, key: 'tSpeed' },
    { seconds: 109, key: 'tExportMinutes' },
    { seconds: 141, key: 'tUploadLogs' },
    { seconds: 155, key: 'tSystemUpdate' },
    { seconds: 181, key: 'tEartips' },
  ],
}

// 汇总视频（id=1）、多人会议视频（id=2）、其他功能视频（id=7）各语言章节时间点不同，按语言单独覆盖。
// id=1：英语/西班牙语/德语沿用「多模式/一对一/聆听播放/媒体/问答手持」结构；
//       日语沿用默认（中文）「多人会议/旁听/通话视频/手持」结构，且无「双人对话」「恢复出厂设置」章节。
// id=2：各语言仅时间点不同（章节结构与默认一致）。
// id=7：默认（中文）含开箱/激活/离线等前段章节；英语/西语/德语/日语仅含后半段（速度/导出/上传/升级/恢复出厂/耳套）。
const timelineByLang: Partial<Record<string, Record<number, TimelineMetaItem[]>>> = {
  en: {
    1: [
      { seconds: 3, key: 'tUnbox' },
      { seconds: 22, key: 'tActivate' },
      { seconds: 88, key: 'tMultiMode' },
      { seconds: 407, key: 'tOneToOne' },
      { seconds: 454, key: 'tListenPlay' },
      { seconds: 498, key: 'tMedia' },
      { seconds: 548, key: 'tQandAHandheld' },
      { seconds: 572, key: 'tOffline' },
      { seconds: 594, key: 'tSpeed' },
      { seconds: 603, key: 'tExportMinutes' },
      { seconds: 637, key: 'tUploadLogs' },
      { seconds: 651, key: 'tSystemUpdate' },
      { seconds: 662, key: 'tFactoryReset' },
      { seconds: 678, key: 'tEartips' },
    ],
    2: [
      { seconds: 0, key: 'videoGroupMeeting' },
      { seconds: 8, key: 'tHost' },
      { seconds: 87, key: 'tMember' },
      { seconds: 146, key: 'tPhone' },
      { seconds: 200, key: 'tComputer' },
      { seconds: 247, key: 'tMicNotes' },
      { seconds: 263, key: 'tLangSwitch' },
      { seconds: 280, key: 'tMeetingSettings' },
      { seconds: 300, key: 'tKeySettings' },
    ],
    7: [
      { seconds: 1, key: 'tSpeed' },
      { seconds: 9, key: 'tExportMinutes' },
      { seconds: 42, key: 'tUploadLogs' },
      { seconds: 56, key: 'tSystemUpdate' },
      { seconds: 68, key: 'tFactoryReset' },
      { seconds: 84, key: 'tEartips' },
    ],
  },
  es: {
    1: [
      { seconds: 3, key: 'tUnbox' },
      { seconds: 22, key: 'tActivate' },
      { seconds: 90, key: 'tMultiMode' },
      { seconds: 455, key: 'tOneToOne' },
      { seconds: 504, key: 'tListenPlay' },
      { seconds: 552, key: 'tMedia' },
      { seconds: 609, key: 'tQandAHandheld' },
      { seconds: 635, key: 'tOffline' },
      { seconds: 659, key: 'tSpeed' },
      { seconds: 668, key: 'tExportMinutes' },
      { seconds: 703, key: 'tUploadLogs' },
      { seconds: 718, key: 'tSystemUpdate' },
      { seconds: 729, key: 'tFactoryReset' },
      { seconds: 746, key: 'tEartips' },
    ],
    2: [
      { seconds: 0, key: 'videoGroupMeeting' },
      { seconds: 8, key: 'tHost' },
      { seconds: 101, key: 'tMember' },
      { seconds: 168, key: 'tPhone' },
      { seconds: 229, key: 'tComputer' },
      { seconds: 281, key: 'tMicNotes' },
      { seconds: 301, key: 'tLangSwitch' },
      { seconds: 320, key: 'tMeetingSettings' },
      { seconds: 342, key: 'tKeySettings' },
    ],
    7: [
      { seconds: 1, key: 'tSpeed' },
      { seconds: 9, key: 'tExportMinutes' },
      { seconds: 44, key: 'tUploadLogs' },
      { seconds: 58, key: 'tSystemUpdate' },
      { seconds: 70, key: 'tFactoryReset' },
      { seconds: 87, key: 'tEartips' },
    ],
  },
  ja: {
    1: [
      { seconds: 3, key: 'tUnbox' },
      { seconds: 22, key: 'tActivate' },
      { seconds: 90, key: 'tGroupMeetingFeature' },
      { seconds: 463, key: 'tListenMode' },
      { seconds: 507, key: 'tCallMode' },
      { seconds: 557, key: 'tHandheldMode' },
      { seconds: 589, key: 'tOffline' },
      { seconds: 604, key: 'tSpeed' },
      { seconds: 612, key: 'tExportMinutes' },
      { seconds: 646, key: 'tUploadLogs' },
      { seconds: 661, key: 'tSystemUpdate' },
      { seconds: 689, key: 'tEartips' },
    ],
    2: [
      { seconds: 0, key: 'videoGroupMeeting' },
      { seconds: 8, key: 'tHost' },
      { seconds: 89, key: 'tMember' },
      { seconds: 149, key: 'tPhone' },
      { seconds: 204, key: 'tComputer' },
      { seconds: 252, key: 'tMicNotes' },
      { seconds: 269, key: 'tLangSwitch' },
      { seconds: 285, key: 'tMeetingSettings' },
      { seconds: 304, key: 'tKeySettings' },
    ],
    7: [
      { seconds: 1, key: 'tSpeed' },
      { seconds: 9, key: 'tExportMinutes' },
      { seconds: 43, key: 'tUploadLogs' },
      { seconds: 58, key: 'tSystemUpdate' },
      { seconds: 69, key: 'tFactoryReset' },
      { seconds: 85, key: 'tEartips' },
    ],
  },
  de: {
    1: [
      { seconds: 3, key: 'tUnbox' },
      { seconds: 24, key: 'tActivate' },
      { seconds: 94, key: 'tMultiMode' },
      { seconds: 444, key: 'tOneToOne' },
      { seconds: 492, key: 'tListenPlay' },
      { seconds: 544, key: 'tMedia' },
      { seconds: 602, key: 'tQandAHandheld' },
      { seconds: 626, key: 'tOffline' },
      { seconds: 649, key: 'tSpeed' },
      { seconds: 658, key: 'tExportMinutes' },
      { seconds: 692, key: 'tUploadLogs' },
      { seconds: 707, key: 'tSystemUpdate' },
      { seconds: 737, key: 'tEartips' },
    ],
    2: [
      { seconds: 0, key: 'videoGroupMeeting' },
      { seconds: 8, key: 'tHost' },
      { seconds: 94, key: 'tMember' },
      { seconds: 159, key: 'tPhone' },
      { seconds: 218, key: 'tComputer' },
      { seconds: 268, key: 'tMicNotes' },
      { seconds: 289, key: 'tLangSwitch' },
      { seconds: 306, key: 'tMeetingSettings' },
      { seconds: 327, key: 'tKeySettings' },
    ],
    7: [
      { seconds: 1, key: 'tSpeed' },
      { seconds: 9, key: 'tExportMinutes' },
      { seconds: 43, key: 'tUploadLogs' },
      { seconds: 58, key: 'tSystemUpdate' },
      { seconds: 71, key: 'tFactoryReset' },
      { seconds: 89, key: 'tEartips' },
    ],
  },
}

const activeTab = ref<TabKey>('video')
const currentVideoId = ref<number>(videoMeta[0].id)

const videoRef = ref<HTMLVideoElement | null>(null)
const videoPlayerRef = ref<HTMLDivElement | null>(null)
const seeking = ref(false)
const playing = ref(false)
const buffering = ref(false)
const isHovering = ref(false)
const shouldAutoplay = ref(false)
// 当前视频是否已上报过「视频点击」：默认视频进入页面即选中、未经过 selectVideo，
// 首次点击播放时才补埋；暂停→继续播放不重复埋
const videoClickReported = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const speed = ref('1.0x')
const speedMenuOpen = ref(false)
const speeds = ['0.75x', '1.0x', '1.25x', '1.5x', '2.0x']
const fullscreen = ref(false)
// iOS / 部分内置浏览器不支持元素级 requestFullscreen，改用 CSS 假全屏（自定义 UI + 横屏旋转）
const cssFullscreen = ref(false)
// 退出 CSS 假全屏时的过渡态：先播放「淡出 + 缩小」动画，动画结束后再真正移除全屏状态
const cssFullscreenExiting = ref(false)
let cssFullscreenExitTimer: number | null = null
const fsChaptersOpen = ref(false)
const drawerOpen = ref(false)
const drawerTop = ref(0)
const langDrawerOpen = ref(false)
const langDropdownVisible = ref(false)
const isSmallScreen = ref(window.matchMedia('(max-width: 768px)').matches)

// 全屏控制条自动隐藏：播放时闲置一段时间后淡出，避免遮挡视频
const fsUiHidden = ref(false)
let fsUiHideTimer: number | null = null

// 小屏非全屏控制条自动隐藏：播放时 2s 无操作后淡出（触摸屏无 hover，改用定时器）
const controlsHidden = ref(false)
let controlsHideTimer: number | null = null

// 延迟收起目录抽屉 / 全屏章节列表的定时器
let drawerCloseTimer: number | null = null
let fsChaptersCloseTimer: number | null = null
// 当前章节按播放进度动态计算，播放跨越章节边界时标题/高亮随之切换
const activeTimelineIndex = computed(() => {
  const list = timeline.value
  let idx = -1
  for (let i = 0; i < list.length; i++) {
    if (currentTime.value >= list[i].seconds) idx = i
    else break
  }
  return idx
})

const langLabel = computed(() => languages.find((l) => l.code === currentLang.value)?.native ?? currentLang.value)
const currentVideo = computed(() => videos.value.find((v) => v.id === currentVideoId.value) ?? videos.value[0])
const currentPoster = computed(() => videoSnapshot(currentVideo.value.url, 640, 360))
const timeline = computed<TimelineItem[]>(() => {
  const meta = timelineByLang[currentLang.value]?.[currentVideoId.value] ?? timelineMeta[currentVideoId.value]
  return (meta ?? []).map((it) => ({ seconds: it.seconds, label: t.value[it.key], key: it.key }))
})
const progress = computed(() => (duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0))
const activeTimelineLabel = computed(() => {
  if (activeTimelineIndex.value < 0) return ''
  return timeline.value[activeTimelineIndex.value]?.label ?? ''
})
const speedShort = computed(() => speed.value.replace(/\.0x$/, 'x'))

// 小屏用定时器控制控制条显隐；桌面端沿用 hover 逻辑
const controlsHiddenEffect = computed(() =>
  isSmallScreen.value ? controlsHidden.value : playing.value && !isHovering.value
)

// ===== 神策埋点 =====
// 埋点属性值统一用「中文名」上报，与界面语言无关，保证后台数据跨语言一致
const videoChineseName = (id: number): string => {
  const meta = videoMeta.find((m) => m.id === id)
  return meta ? messages.zh[meta.titleKey] : ''
}

function trackLanguageSelection(code: string) {
  const lang = languages.find((l) => l.code === code)
  if (!lang) return
  track('X1ProHelpSite_SystemLanguageSelection', {
    SelectLanguage: lang.native,
  })
}

// 视频播放时长统计（秒）：累计「视频内容进度时长」——
// 用 video.currentTime 差值累加，倍速播放按实际走过的内容时长计（2x 放 10s = 20s），
// 暂停时进度不动、差值自然为 0，天然排除暂停时间
let accumulatedPlaySeconds = 0
// 本次播放起点对应的视频内容时间(currentTime)，null 表示当前未在累计
let playStartVideoTime: number | null = null

// 结算当前播放段：把「起点 → 现在」的视频内容时长累加到累计值，不重置累计值
function settlePlaySegment() {
  if (playStartVideoTime !== null) {
    const now = videoRef.value?.currentTime ?? currentTime.value
    accumulatedPlaySeconds += now - playStartVideoTime
    playStartVideoTime = null
  }
}

function onVideoPlay() {
  playing.value = true
  if (playStartVideoTime === null) {
    playStartVideoTime = videoRef.value?.currentTime ?? currentTime.value
  }
}

function onVideoPause() {
  playing.value = false
  settlePlaySegment()
}

function reportPlayDuration() {
  const seconds = Math.round(accumulatedPlaySeconds)
  accumulatedPlaySeconds = 0
  playStartVideoTime = null
  if (seconds < 1) return
  track('X1ProHelpSite_VideoPlayDuration', {
    VideoName: videoChineseName(currentVideoId.value),
    PlayDuration: seconds,
  })
}

// 播放结束 / 切视频 / 切 Tab / 离开页面时结算并上报本次播放时长
function settlePlayDuration() {
  settlePlaySegment()
  reportPlayDuration()
}

function onVideoEnded() {
  playing.value = false
  settlePlayDuration()
}

function switchTab(tab: TabKey) {
  // 切走视频 Tab 时结算本次播放时长
  if (tab === 'manual' && activeTab.value === 'video') {
    settlePlayDuration()
  }
  activeTab.value = tab
  clearDrawerCloseTimer()
  drawerOpen.value = false
  // Tab 点击埋点（默认选中的 Tab 不触发：switchTab 仅在用户点击时被调用）
  track('X1ProHelpSite_TabClick', {
    TabName: tab === 'video' ? messages.zh.tabVideo : messages.zh.tabManual,
  })
}

function onLangChange(code: string) {
  currentLang.value = code
  trackLanguageSelection(code)
}

function selectVideo(id: number) {
  // 切换到不同视频前，结算上一个视频的播放时长
  if (currentVideoId.value !== id) {
    settlePlayDuration()
  }
  currentVideoId.value = id
  playing.value = false
  buffering.value = false
  currentTime.value = 0
  duration.value = 0
  speedMenuOpen.value = false
  fsChaptersOpen.value = false
  shouldAutoplay.value = true
  // 视频点击埋点
  videoClickReported.value = true
  track('X1ProHelpSite_VideoClick', {
    VideoName: videoChineseName(id),
  })
  // 移动端小屏：点击目录项后延迟 1s 再收起目录抽屉
  clearDrawerCloseTimer()
  drawerCloseTimer = window.setTimeout(() => {
    drawerOpen.value = false
    drawerCloseTimer = null
  }, 100)
}

function computeDrawerTop() {
  const player = videoPlayerRef.value
  if (player) {
    drawerTop.value = Math.max(player.getBoundingClientRect().bottom, 0)
  }
}

function openDrawer() {
  clearDrawerCloseTimer()
  computeDrawerTop()
  drawerOpen.value = true
}

function closeDrawer() {
  clearDrawerCloseTimer()
  drawerOpen.value = false
}

function openLangDrawer() {
  computeDrawerTop()
  langDrawerOpen.value = true
}

function closeLangDrawer() {
  langDrawerOpen.value = false
}

function onLangDropdownVisible(visible: boolean) {
  langDropdownVisible.value = visible
}

function selectLang(code: string) {
  currentLang.value = code
  langDrawerOpen.value = false
  trackLanguageSelection(code)
}

// play() 请求被后续 pause()/load()/再次 play() 打断时，浏览器会以 AbortError reject。
// 这属于正常的「请求被更新」而非真实失败（比如快速切换时间点时上一次 play 被新一次打断），
// 跳过告警，避免刷屏误导为播放失败。
function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError'
}

async function togglePlay() {
  const v = videoRef.value
  if (!v) return
  if (v.paused) {
    v.playbackRate = parseFloat(speed.value)
    // 点击播放即视为一次「视频点击」：默认视频未经过 selectVideo，需在此补埋
    if (!videoClickReported.value) {
      videoClickReported.value = true
      track('X1ProHelpSite_VideoClick', {
        VideoName: videoChineseName(currentVideoId.value),
      })
    }
    try {
      await v.play()
    } catch (e) {
      if (!isAbortError(e)) console.warn('视频播放失败:', e)
    }
  } else {
    v.pause()
  }
}

// 空格键控制视频播放/暂停（仅在「操作视频」tab 生效，避免干扰手册滚动与按钮聚焦）
function onKeydown(e: KeyboardEvent) {
  if (e.code !== 'Space' || e.repeat) return
  if (activeTab.value !== 'video') return
  e.preventDefault()
  togglePlay()
}

function playAt(index: number) {
  const item = timeline.value[index]
  if (!item) return
  const v = videoRef.value
  if (!v) return
  // 跳转前先结算当前播放段：章节跳转属于「离开当前进度」，跳变距离不计入播放时长
  settlePlaySegment()
  v.currentTime = item.seconds
  currentTime.value = item.seconds
  if (!v.paused) {
    // 此前已在播放时，play() 不会重复触发 play 事件，手动以跳转后位置续上起点
    playStartVideoTime = item.seconds
  }
  v.playbackRate = parseFloat(speed.value)
  v.play().catch((e) => {
    if (!isAbortError(e)) console.warn('视频播放失败:', e)
  })
  // 章节点击埋点（playFsChapter 内部也调用 playAt，会一并触发，无需重复埋）
  track('X1ProHelpSite_ChapterClick', {
    VideoName: videoChineseName(currentVideoId.value),
    ChapterName: messages.zh[item.key],
  })
}

async function toggleFullscreen() {
  const el = videoPlayerRef.value
  if (!el) return

  // 退出全屏（原生或 CSS 假全屏）
  if (fullscreen.value) {
    fsChaptersOpen.value = false
    speedMenuOpen.value = false
    if (cssFullscreen.value) {
      exitCssFullscreen()
    } else if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch (e) {
        console.warn('退出全屏失败:', e)
      }
    }
    return
  }

  // 小屏移动端：统一走 CSS 假全屏（rotate 模拟横屏）。
  // 不依赖系统方向锁定，避免 iOS/鸿蒙/微信等内核下原生全屏 + orientation lock 的兼容性问题，
  // 也避免「先进原生全屏（竖屏）→ 锁失败 → 退出再切 CSS 假全屏」造成的竖屏→横屏闪动。
  if (isSmallScreen.value) {
    enterCssFullscreen()
    return
  }

  // 桌面端：标准 Fullscreen API（桌面浏览器对 requestFullscreen / orientation lock 支持较一致）
  if (typeof el.requestFullscreen === 'function') {
    try {
      await el.requestFullscreen()
      await lockLandscape()
    } catch (e) {
      console.warn('进入全屏失败:', e)
    }
    return
  }

  console.warn('当前浏览器不支持全屏')
}

// CSS 假全屏：固定铺满视口并旋转 90° 模拟横屏，未播放也能进入、展示自定义控制条
function enterCssFullscreen() {
  cssFullscreen.value = true
  fullscreen.value = true
  // 拦截系统返回键：push 一个占位 history，用户按返回键时触发 popstate 退出全屏，
  // 而不是直接离开页面（鸿蒙/微信等内核下页面内「返回」按钮可能因 rotate 点击失效）
  try {
    history.pushState({ cssFullscreen: true }, '')
    window.addEventListener('popstate', onCssFullscreenPopstate)
  } catch {
    /* 忽略：不支持 history API 时仅依赖页面内退出按钮 */
  }
}

function onCssFullscreenPopstate() {
  if (cssFullscreen.value) {
    exitCssFullscreen()
  }
}

function exitCssFullscreen() {
  // 退出动画播放中，忽略重复触发
  if (cssFullscreenExiting.value) return
  cssFullscreenExiting.value = true
  // 先播放「淡出 + 缩小」退出动画（横屏 → 竖屏），动画结束后再真正移除全屏状态
  cssFullscreenExitTimer = window.setTimeout(() => {
    cssFullscreen.value = false
    fullscreen.value = false
    cssFullscreenExiting.value = false
    cssFullscreenExitTimer = null
    window.removeEventListener('popstate', onCssFullscreenPopstate)
    // 清理进入全屏时 push 的占位 history，避免之后按返回键再回退一次
    if (history.state && history.state.cssFullscreen) {
      history.back()
    }
  }, 320)
}

// 锁定横屏（桌面端原生全屏时调用；浏览器不支持时静默忽略）
async function lockLandscape() {
  const so = screen.orientation
  if (!so || typeof so.lock !== 'function') return
  try {
    await so.lock('landscape')
  } catch {
    try {
      await so.lock('landscape-primary')
    } catch (err) {
      console.warn('锁定横屏失败:', err)
    }
  }
}

function unlockOrientation() {
  const so = screen.orientation
  if (so && typeof so.unlock === 'function') {
    try {
      so.unlock()
    } catch {
      /* ignore */
    }
  }
}

function onFullscreenChange() {
  // CSS 假全屏由 enter/exitCssFullscreen 管理状态，不响应原生 fullscreenchange
  if (cssFullscreen.value) return
  fullscreen.value = !!document.fullscreenElement
  if (!fullscreen.value) {
    fsChaptersOpen.value = false
    speedMenuOpen.value = false
    unlockOrientation()
  }
}

function onTimeUpdate() {
  if (videoRef.value) currentTime.value = videoRef.value.currentTime
}

function onLoadedMetadata(e: Event) {
  const v = e.target as HTMLVideoElement
  if (!v) return
  if (videoRef.value) duration.value = videoRef.value.duration
  // 仅当事件来自当前选中的视频时才自动播放，
  // 避免快速切换目录时旧视频的 loadedmetadata 抢占 shouldAutoplay 标志，导致最终视频停在开始处不播放
  if (!shouldAutoplay.value) return
  if (Number(v.dataset.videoId) !== currentVideoId.value) return
  shouldAutoplay.value = false
  v.playbackRate = parseFloat(speed.value)
  v.play().catch((err) => {
    if (!isAbortError(err)) console.warn('自动播放失败:', err)
  })
}

// 进度条点击/拖拽 seek：统一用 pointer 事件，按下即跳转，按住拖动时连续更新。
// CSS 假全屏竖屏下播放器被 rotate(90deg) 旋转，进度方向映射到屏幕纵向（Y 轴），
// 此时 getBoundingClientRect 的宽高已互换，需按 clientY 计算，否则会跳错甚至回退。
function seekRatioFromPointer(e: PointerEvent, bar: HTMLElement): number {
  const rect = bar.getBoundingClientRect()
  const rotated = cssFullscreen.value && window.matchMedia('(orientation: portrait)').matches
  return rotated
    ? Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1)
    : Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1)
}

function applySeekRatio(ratio: number) {
  const v = videoRef.value
  if (!v || !duration.value) return
  v.currentTime = ratio * duration.value
  currentTime.value = v.currentTime
}

function onSeekPointerDown(e: PointerEvent) {
  const bar = e.currentTarget as HTMLElement
  if (!bar || !duration.value) return
  try { bar.setPointerCapture(e.pointerId) } catch { /* ignore */ }
  // 开始拖动前结算当前播放段：拖动导致的进度跳变不计入播放时长
  settlePlaySegment()
  seeking.value = true
  applySeekRatio(seekRatioFromPointer(e, bar))
}

function onSeekPointerMove(e: PointerEvent) {
  if (!seeking.value) return
  const bar = e.currentTarget as HTMLElement
  if (!bar) return
  applySeekRatio(seekRatioFromPointer(e, bar))
}

function onSeekPointerEnd(e: PointerEvent) {
  const bar = e.currentTarget as HTMLElement
  try {
    if (bar && bar.hasPointerCapture(e.pointerId)) bar.releasePointerCapture(e.pointerId)
  } catch { /* ignore */ }
  seeking.value = false
  // 拖动结束：若视频仍在播放，从当前位置重新开始累计（seek 不触发 play 事件，需手动续起点）
  const v = videoRef.value
  if (v && !v.paused) {
    playStartVideoTime = v.currentTime
  }
}

function toggleFsChapters() {
  clearFsChaptersCloseTimer()
  fsChaptersOpen.value = !fsChaptersOpen.value
}

function playFsChapter(index: number) {
  playAt(index)
  // 全屏点击章节后延迟 1s 再收起章节列表
  clearFsChaptersCloseTimer()
  fsChaptersCloseTimer = window.setTimeout(() => {
    fsChaptersOpen.value = false
    fsChaptersCloseTimer = null
  }, 100)
}

function toggleSpeedMenu() {
  speedMenuOpen.value = !speedMenuOpen.value
  if (isSmallScreen.value && !fullscreen.value) {
    if (speedMenuOpen.value) clearControlsHideTimer()
    else revealControls()
  }
}

function setSpeed(s: string) {
  speed.value = s
  if (videoRef.value) videoRef.value.playbackRate = parseFloat(s)
  speedMenuOpen.value = false
  if (isSmallScreen.value && !fullscreen.value) revealControls()
}

function onPlayerMove() {
  if (fullscreen.value) {
    revealFsUi()
  } else if (isSmallScreen.value) {
    revealControls()
  }
}

function onPlayerTouch() {
  if (!fullscreen.value && isSmallScreen.value) revealControls()
}

function revealFsUi() {
  fsUiHidden.value = false
  if (playing.value) scheduleFsUiHide()
}

function scheduleFsUiHide() {
  if (fsUiHideTimer !== null) clearTimeout(fsUiHideTimer)
  fsUiHideTimer = window.setTimeout(() => {
    if (playing.value && !speedMenuOpen.value && !fsChaptersOpen.value && !seeking.value) {
      fsUiHidden.value = true
    }
    fsUiHideTimer = null
  }, 3000)
}

function clearFsUiHideTimer() {
  if (fsUiHideTimer !== null) {
    clearTimeout(fsUiHideTimer)
    fsUiHideTimer = null
  }
}

function revealControls() {
  controlsHidden.value = false
  if (playing.value && isSmallScreen.value && !fullscreen.value) scheduleControlsHide()
}

function scheduleControlsHide() {
  clearControlsHideTimer()
  controlsHideTimer = window.setTimeout(() => {
    if (playing.value && isSmallScreen.value && !fullscreen.value && !speedMenuOpen.value && !seeking.value) {
      controlsHidden.value = true
    }
    controlsHideTimer = null
  }, 2000)
}

function clearControlsHideTimer() {
  if (controlsHideTimer !== null) {
    clearTimeout(controlsHideTimer)
    controlsHideTimer = null
  }
}

function clearDrawerCloseTimer() {
  if (drawerCloseTimer !== null) {
    clearTimeout(drawerCloseTimer)
    drawerCloseTimer = null
  }
}

function clearFsChaptersCloseTimer() {
  if (fsChaptersCloseTimer !== null) {
    clearTimeout(fsChaptersCloseTimer)
    fsChaptersCloseTimer = null
  }
}

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

watch([drawerOpen, langDrawerOpen], ([drawer, lang]) => {
  document.body.style.overflow = drawer || lang ? 'hidden' : ''
})

// 切换语言时同步更新页面标题
watch(currentLang, (lang) => applyDocumentTitle(lang))

// 切换语言时，若在视频 tab，重置播放状态（多语言视频切换后重新加载对应视频）
watch(currentLang, () => {
  if (activeTab.value !== 'video') return
  // 切换语言会重新加载对应语言视频，先结算当前播放段
  settlePlaySegment()
  playing.value = false
  buffering.value = false
  currentTime.value = 0
  duration.value = 0
  speedMenuOpen.value = false
  fsChaptersOpen.value = false
})

// 全屏下播放/暂停与进出全屏时，控制条的自动隐藏调度
watch(playing, (p) => {
  if (fullscreen.value) {
    if (p) {
      scheduleFsUiHide()
    } else {
      fsUiHidden.value = false
      clearFsUiHideTimer()
    }
    return
  }
  // 小屏非全屏：播放时 2s 无操作自动隐藏控制条，暂停时始终显示
  if (isSmallScreen.value) {
    if (p) {
      scheduleControlsHide()
    } else {
      controlsHidden.value = false
      clearControlsHideTimer()
    }
  }
})

watch(fullscreen, (f) => {
  if (f) {
    fsUiHidden.value = false
    if (playing.value) scheduleFsUiHide()
  } else {
    fsUiHidden.value = false
    clearFsUiHideTimer()
    // 退出全屏回到小屏内联，若在播放则重新调度控制条自动隐藏
    if (isSmallScreen.value) {
      controlsHidden.value = false
      if (playing.value) scheduleControlsHide()
    }
  }
})

function onWindowResize() {
  isSmallScreen.value = window.matchMedia('(max-width: 768px)').matches
  if (!isSmallScreen.value) {
    langDrawerOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
  window.addEventListener('resize', onWindowResize)
  window.addEventListener('keydown', onKeydown)
  // 进入页面即上报一次系统语言选择：此时语言已按系统/默认语言确定
  trackLanguageSelection(currentLang.value)
  // 小屏进入页面默认展开目录弹窗（对应设计稿「默认进入页」）
  if (window.matchMedia('(max-width: 768px)').matches) {
    openDrawer()
  }
})

onBeforeUnmount(() => {
  settlePlayDuration()
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  window.removeEventListener('resize', onWindowResize)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('popstate', onCssFullscreenPopstate)
  document.body.style.overflow = ''
  clearDrawerCloseTimer()
  clearFsChaptersCloseTimer()
  clearFsUiHideTimer()
  clearControlsHideTimer()
  if (cssFullscreenExitTimer !== null) {
    clearTimeout(cssFullscreenExitTimer)
    cssFullscreenExitTimer = null
  }
})
</script>

<style scoped>
.tutorial {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #ffffff;
  color: #1e1e1e;
  -webkit-tap-highlight-color: transparent;
}

/* ---------- 顶部栏 ---------- */
.tutorial-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  padding: 0 12px;
  background: #ffffff;
  box-shadow: 0 1px 0 #f0f0f0;
  flex-shrink: 0;
}

.tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  background: #F2F4F7;
  border-radius: 999px;
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: none;
  background: transparent;
  padding: 8px 18px;
  border-radius: 999px;
  font-size: 15px;
  line-height: 1;
  color: #606060;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s, color 0.2s;
}

.tab.active {
  color: #0A85FF;
  font-weight: 500;
  background: #ffffff;
}

.lang-wrap {
  position: absolute;
  right: 12px;
  display: flex;
}

.lang-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #606060;
  cursor: pointer;
  outline: none;
  font-size: 13px;
  white-space: nowrap;
}

.lang-label {
  max-width: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lang-caret {
  color: #989898;
}

.lang-trigger.active {
  color: #0A85FF;
}

.lang-trigger.active .lang-caret {
  color: #0A85FF;
}

/* 语言下拉项：上行为浏览器语言下的语种名，下行为该语种自身名称 */
.lang-opt {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.35;
}

.lang-opt-main {
  font-size: 14px;
  color: #191d26;
}

.lang-opt-sub {
  font-size: 12px;
  color: #a1a7b2;
}

/* ---------- 视频播放器 ---------- */
.video-tab {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
}

.video-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  min-width: 0;
}

.video-player {
  position: relative;
  flex-shrink: 0;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #d9d9d9;
}

.video-player:fullscreen {
  max-width: none;
  aspect-ratio: auto;
  background: #000000;
}

/* CSS 假全屏（iOS / 不支持元素全屏的小屏浏览器）：固定铺满视口并旋转模拟横屏，
   展示自定义控制条而非系统默认播放器。 */
.video-player.css-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  max-width: none;
  aspect-ratio: auto;
  background: #000000;
  /* 进入全屏时淡入，缓解竖屏→横屏的突兀切换（横屏方向，无旋转） */
  animation: fs-fade-in 0.3s ease-out;
}

/* 横屏：自然铺满，不旋转 */
@media (orientation: landscape) {
  .video-player.css-fullscreen {
    width: 100vw;
    height: 100vh;
    width: 100dvw;
    height: 100dvh;
  }
}

/* 竖屏：宽高互换并旋转 90°，旋转后恰好填满竖屏视口。
   进入时从略小的尺寸放大 + 淡入，让「点全屏变横屏」的切换更平滑。 */
@media (orientation: portrait) {
  .video-player.css-fullscreen {
    width: 100vh;
    height: 100vw;
    width: 100dvh;
    height: 100dvw;
    transform: rotate(90deg) translateY(-100%);
    transform-origin: top left;
    animation: fs-enter-rotate 0.35s cubic-bezier(0.22, 0.61, 0.36, 1);
  }
}

/* 全屏进入动画：淡入（横屏方向） */
@keyframes fs-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* 全屏进入动画：淡入 + 轻微放大（竖屏方向，旋转状态保持不变避免旋转过程中方向错乱） */
@keyframes fs-enter-rotate {
  from {
    opacity: 0;
    transform: rotate(90deg) translateY(-100%) scale(0.92);
  }
  to {
    opacity: 1;
    transform: rotate(90deg) translateY(-100%) scale(1);
  }
}

/* 退出全屏（横屏 → 竖屏）：缩小 + 淡出，与进入动画反向，让退出切换同样平滑。
   退出态仍保留 .css-fullscreen 以维持固定定位与旋转，动画结束后再由脚本移除全屏状态。 */
@media (orientation: portrait) {
  .video-player.css-fullscreen.css-fullscreen-exiting {
    animation: fs-exit-rotate 0.3s ease-in forwards;
  }
}

@media (orientation: landscape) {
  .video-player.css-fullscreen.css-fullscreen-exiting {
    animation: fs-fade-out 0.3s ease-in forwards;
  }
}

@keyframes fs-exit-rotate {
  from {
    opacity: 1;
    transform: rotate(90deg) translateY(-100%) scale(1);
  }
  to {
    opacity: 0;
    transform: rotate(90deg) translateY(-100%) scale(0.85);
  }
}

@keyframes fs-fade-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}

.video-player.css-fullscreen .video-el,
.video-player:fullscreen .video-el {
  background: #000000;
}

.video-el {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  background: #d9d9d9;
}

.video-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.play-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border: none;
  border-radius: 50%;
  background: #989898;
  color: #ffffff;
  cursor: pointer;
  transition: transform 0.15s, background 0.2s;
}

.play-btn:hover {
  background: #0A85FF;
}

.play-btn:active {
  transform: scale(0.95);
}

/* 全屏时中央播放按钮放大，按设计稿（灰底 + 大三角） */
.video-placeholder.is-fullscreen .play-btn {
  width: 80px;
  height: 80px;
  background: #989898;
}

.video-placeholder.is-fullscreen .play-btn svg {
  width: 46px;
  height: 46px;
}

.video-buffering {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.buffering-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #0A85FF;
  border-radius: 50%;
  animation: buffering-spin 0.8s linear infinite;
}

@keyframes buffering-spin {
  to { transform: rotate(360deg); }
}

.video-controls {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 10px;
  background: rgba(0, 0, 0, 0.5);
  color: #ffffff;
  transition: opacity 0.25s;
}

.video-controls.controls-hidden {
  opacity: 0;
  pointer-events: none;
}

.ctrl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  box-sizing: border-box;
  border: none;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  flex-shrink: 0;
}

.progress {
  flex: 1;
  height: 28px;
  display: flex;
  align-items: center;
  cursor: pointer;
  touch-action: none;
}

.progress-track {
  position: relative;
  width: 100%;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.progress-played {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: #0A85FF;
  border-radius: 2px;
}

.progress-dot {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ffffff;
}

.time {
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}

.speed-wrap {
  position: relative;
  flex-shrink: 0;
}

.speed-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  height: 26px;
  padding: 0 6px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #ffffff;
  font-size: 12px;
  cursor: pointer;
}

.speed-menu {
  position: absolute;
  bottom: 34px;
  right: 0;
  list-style: none;
  margin: 0;
  padding: 4px 0;
  min-width: 76px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  z-index: 5;
}

.speed-menu li {
  padding: 8px 0;
  font-size: 13px;
  color: #1e1e1e;
  text-align: center;
  cursor: pointer;
}

.speed-menu li:hover {
  background: #f5f5f5;
}

.speed-menu li.active {
  color: #0A85FF;
  font-weight: 600;
}

/* ---------- 全屏 UI ---------- */
.fs-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 5px 18px;
  z-index: 6;
  pointer-events: none;
  background:#000000;
  transition: opacity 0.25s ease, visibility 0.25s ease;
}

.fs-exit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  flex-shrink: 0;
  pointer-events: auto;
}

.fs-chapters-mask {
  position: absolute;
  inset: 0;
  z-index: 7;
  background: transparent;
}

.fs-chapters {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 300px;
  max-width: 48vw;
  padding: 24px 20px 20px;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.75);
  color: #ffffff;
  overflow-y: auto;
  z-index: 8;
}

.fs-chapters-header {
  font-size: 17px;
  font-weight: 500;
  line-height: 1.3;
  margin-bottom: 14px;
}

.fs-chapters-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fs-chapter {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  border: 1px solid #ffffff;
  border-radius: 14px;
  cursor: pointer;
  font-size: 15px;
  line-height: 1.4;
}

.fs-chapter.active {
  background: #ffffff;
  color: #000000;
}

.fs-chapter.active .fs-chapter-play {
  color: #000000;
}

.fs-chapter-time {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 6px;
  white-space: nowrap;
  flex-shrink: 0;
}

.fs-chapter-play {
  width: 14px;
  height: 14px;
  color: #ffffff;
}

.fs-chapter-label {
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.fs-controls {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0 16px 0px;
  background: #000000;
  z-index: 6;
  transition: opacity 0.25s ease, visibility 0.25s ease;
}

.fs-ui-hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.fs-progress {
  height: 24px;
  display: flex;
  align-items: center;
  cursor: pointer;
  touch-action: none;
  /* margin-bottom: 8px; */
}

.fs-progress-track {
  position: relative;
  width: 100%;
  height: 6px;
  background: #d2d2d2;
  border-radius: 28px;
}

.fs-progress-played {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: #ffffff;
  border-radius: 28px;
}

.fs-progress-dot {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
}

.fs-controls-row {
  display: flex;
  align-items: center;
  gap: 20px;
}

.fs-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  flex-shrink: 0;
}

.fs-btn-play {
  width: 44px;
  height: 44px;
}

.fs-time {
  font-size: 15px;
  color: #ffffff;
  white-space: nowrap;
  flex-shrink: 0;
}

.fs-time-total {
  color: #aeaeb2;
}

.fs-chapter-chip {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 16px;
  border-radius: 16px;
  color: #ffffff;
  font-size: 15px;
  white-space: nowrap;
  flex-shrink: 0;
  max-width: 35%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fs-spacer {
  flex: 1;
}

.fs-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  padding: 0 24px;
  border: 1px solid #ffffff;
  border-radius: 20px;
  background: transparent;
  color: #ffffff;
  font-size: 15px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.fs-speed {
  font-size: 15px;
}

.fs-speed-wrap {
  position: relative;
  flex-shrink: 0;
}

.fs-speed-menu {
  bottom: 48px;
  right: 0;
  z-index: 10;
}

/* ---------- 章节标题 + 目录按钮 ---------- */
.chapters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 16px 0;
  flex-shrink: 0;
}

.chapters-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.3;
  color: #1e1e1e;
  word-break: break-word;
}

.dir-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  border: 1px solid #e8e8e8;
  border-radius: 17px;
  background: #ffffff;
  color: #606060;
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;
}

.dir-btn:active {
  background: #f5f5f5;
}

/* ---------- 时间线 ---------- */
.timeline {
  position: relative;
  list-style: none;
  margin: 0;
  padding: 8px 16px 24px 30px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.timeline-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

/* 竖向连接线：每项画一段，随内容整体延伸；首项从圆点起、末项到圆点止 */
.timeline-item::after {
  content: '';
  position: absolute;
  left: -14px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #ececec;
  z-index: 0;
}

.timeline-item:first-child::after {
  top: 50%;
}

.timeline-item:last-child::after {
  bottom: 50%;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -13px;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #D1DDF0;
  z-index: 1;
}

@media (hover: hover) {
  .timeline-item:hover {
    background: #ECF2FD;
  }
}


.timeline-item.active .timeline-chip {
  border: 1px solid #0A85FF;
  background: #ffffff;
}

.timeline-item.active .timeline-play,
.timeline-item.active .timeline-time {
  color: #0A85FF;
}

.timeline-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: none;
  background: #eef2fd;
  border-radius: 999px;
  color: #EEF2FD;
  flex-shrink: 0;
}

.timeline-play {
  display: block;
  width: 14px;
  height: 14px;
  color: #8C8C8C;
  flex-shrink: 0;
}

.timeline-time {
  font-size: 13px;
  color: #8C8C8C;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.timeline-label {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: #1e1e1e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---------- 目录抽屉 ---------- */
.drawer-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
}

.drawer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 101;
  max-width: 640px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 12px 12px 0 0;
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 0px;
  flex-shrink: 0;
}

.drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e1e1e;
}

.drawer-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #606060;
  cursor: pointer;
}

.drawer-list {
  list-style: none;
  margin: 0;
  padding: 4px 20px 16px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

/* ---------- 目录项 ---------- */
.catalog-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.15s;
  margin:10px 0px;
}

.catalog-item::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -6px;
  height: 1px;
  /* margin: 6px 0; */
  background: #E3EBF8;
}

.catalog-item:hover {
  background: #f8fafd;
}

.catalog-item.active {
  background: #edf2fc;
}

.item-icon {
  width: 30px;
  height: 30px;
  object-fit: contain;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-title {
  margin: 0;
  font-size: 14px;
  color: #1e1e1e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.catalog-item.active .item-title {
  font-weight: 600;
}

/* ---------- 语言抽屉 ---------- */
.lang-list {
  list-style: none;
  margin: 0;
  padding: 8px 16px 16px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.lang-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 7px;
  border-bottom: 1px solid #e3ebf8;
  cursor: pointer;
  flex-shrink: 0;
  min-height: 44px;
  box-sizing: border-box;
}

.lang-item:last-child {
  border-bottom: none;
}

.lang-item.active {
  background: #ecf2fd;
}

.lang-item-info {
  flex: 1;
  min-width: 0;
}

.lang-item-name {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  color: #191d26;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lang-item-sub {
  margin: 2px 0 0;
  font-size: 12px;
  line-height: 1.3;
  color: #a1a7b2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lang-check {
  color: #0a85ff;
  flex-shrink: 0;
}

/* ---------- 目录侧边栏（桌面端） ---------- */
.video-sidebar {
  display: none;
}

.sidebar-header {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e1e1e;
}

.sidebar-list {
  list-style: none;
  margin: 0;
  padding: 8px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

/* ---------- 使用手册（内嵌 PDF） ---------- */
.manual-tab {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.manual-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #c0c0c0;
}

.manual-empty-icon {
  opacity: 0.6;
}

.manual-empty p {
  margin: 0;
  font-size: 14px;
  color: #989898;
}

/* ---------- 抽屉过渡 ---------- */
.mask-fade-enter-active,
.mask-fade-leave-active {
  transition: opacity 0.25s;
}

.mask-fade-enter-from,
.mask-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active {
  transition: transform 0.28s ease-out;
}

/* 弹窗移下（收起）时速度由快到慢，视觉上更柔和 */
.drawer-slide-leave-active {
  transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateY(100%);
}

/* ---------- 桌面端专用元素（移动端默认隐藏） ---------- */
.header-brand,
.lang-icon {
  display: none;
}

/* ---------- 宽屏布局（> 768px）：目录变为右侧菜单栏，按设计还原 ---------- */
@media (min-width: 769px) {
  /* 顶栏：更高 + 品牌区 + 阴影 */
  .tutorial-header {
    height: 56px;
    padding: 0 23px;
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
  }

  .header-brand {
    display: flex;
    align-items: center;
    gap: 14px;
    position: absolute;
    left: 23px;
  }

  .header-logo {
    display: block;
    height: 18px;
    width: auto;
  }

  .header-divider {
    width: 1px;
    height: 14px;
    background: #dbdee4;
  }

  .header-help {
    font-size: 14px;
    color: #000000;
    white-space: nowrap;
  }

  .lang-wrap {
    right: 23px;
  }

  .lang-icon {
    display: block;
    width: 16px;
    height: 16px;
  }

  /* 顶栏 tab：去掉胶囊背景，改用下边框高亮选中项 */
  .tabs {
    background: transparent;
    padding: 0;
    gap: 8px;
  }

  .tab {
    padding: 5px 18px;
    color: #1e1e1e;
    border-radius: 0;
    border-bottom: 2px solid transparent;
  }

  /* 激活 tab：蓝色下边框 */
  .tab.active {
    background: transparent;
    border-bottom-color: #0A85FF;
  }

  /* 主体宽度 */
  .video-tab {
    flex-direction: row;
    max-width: 1160px;
    margin-top: 20px;
  }

  .chapters-title {
    font-size: 30px;
    font-weight: 600;
  }

  /* 时间线：胶囊改为填充式 */
  .timeline-chip {
    border: none;
    background: #eef2fd;
  }

  .timeline-item.active .timeline-chip {
    border-color: transparent;
    background: #0a85ff;
  }

  .timeline-item.active .timeline-play,
  .timeline-item.active .timeline-time {
    color: #ffffff;
  }

  /* 目录侧栏：灰底浮层卡片 */
  .video-sidebar {
    display: flex;
    flex-direction: column;
    width: 370px;
    flex-shrink: 0;
    min-height: 0;
    margin: 0px 16px 16px 6px;
    border: none;
    border-radius: 7px;
    background: #f7f9fb;
    overflow: hidden;
  }

  .sidebar-header {
    height: 55px;
    gap: 10px;
    padding: 0 20px;
    border-bottom: 1px solid #eceef3;
  }

  .sidebar-header-icon {
    display: block;
    width: 18px;
    height: 18px;
  }

  .sidebar-title {
    font-size: 20px;
    font-weight: 500;
  }

  .sidebar-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }

  .video-sidebar .catalog-item {
    align-items: flex-start;
    gap: 14px;
    padding: 5px 20px;
    border-radius: 7px;
  }

  .video-sidebar .catalog-item::after {
    display: none;
  }

  .video-sidebar .catalog-item.active {
    background: #ffffff;
  }

  .video-sidebar .item-title {
    font-size: 16px;
    font-weight: 500;
  }

  .video-sidebar .item-duration {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0 0;
    font-size: 14px;
    color: #626773;
    white-space: nowrap;
  }

  .video-sidebar .catalog-item.active .item-title,
  .video-sidebar .catalog-item.active .item-duration {
    color: #0a85ff;
  }

  /* 激活项时长旁“正在播放”音量条 */
  .item-eq {
    display: inline-flex;
    align-items: flex-end;
    gap: 2px;
    height: 10px;
    flex-shrink: 0;
  }

  .item-eq i {
    display: block;
    width: 2px;
    border-radius: 1px;
    background: #0a85ff;
    transform-origin: bottom;
    animation: item-eq-bounce 0.9s ease-in-out infinite;
  }

  .item-eq i:nth-child(1) { height: 10px; animation-delay: 0s; }
  .item-eq i:nth-child(2) { height: 5px; animation-delay: 0.15s; }
  .item-eq i:nth-child(3) { height: 8px; animation-delay: 0.3s; }

  @keyframes item-eq-bounce {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(0.35); }
  }

  .dir-btn {
    display: none;
  }
}

/* ---------- 电脑小屏（桌面端但窗口较窄）：适当缩小视频区域，避免挤压下方时间线 ---------- */
@media (min-width: 769px) and (max-width: 1366px) {
  .video-player {
    max-width: 620px;
    margin: 0 auto;
  }
}

/* ---------- 移动端（iPhone 等小屏）：加大控制条播放/全屏按钮 ----------
   原因：底部控制条按钮原先为 28×28 点击区域 + 18×18 图标，低于 iOS 推荐的 44pt
   最小触控目标，且固定像素在部分（尤其大屏）机型上观感偏小。此处放大按钮与图标、
   并抬高控制条，保证可点性与视觉一致。 */
@media (max-width: 768px) {
  .video-controls {
    height: 48px;
    padding: 0 8px;
    gap: 8px;
  }

  .ctrl-btn {
    width: 40px;
    height: 40px;
  }

  .ctrl-btn svg {
    width: 24px;
    height: 24px;
  }

  .progress {
    height: 40px;
  }

  .speed-btn {
    height: 30px;
    min-width: 44px;
    font-size: 13px;
  }
}
</style>
