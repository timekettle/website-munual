import sensors from 'sa-sdk-javascript'

const serverUrl = import.meta.env.VITE_SENSORS_SERVER_URL

if (serverUrl) {
  sensors.init({
    // 数据接收地址，形如 https://xxx.datasink.sensorsdata.cn/sa?project=xxx&token=xxx
    server_url: serverUrl,
    // 页面浏览改用自定义事件 X1ProHelpSite_PageView（在路由 afterEach 里埋），
    // 故关闭 SDK 默认的 $pageview 自动采集，避免重复统计
    // 使用客户端时间，避免设备时区偏差
    use_client_time: true,
    // 使用默认 ajax 发送。
    // 不要全局用 'beacon'：sendBeacon 发后不管、无重试、低优先级，频繁埋点会在真机上被静默丢弃，
    // 导致「实机触发数 > 神策后台接收数」。SPA 内切路由/切组件时页面仍在，XHR 足以送达。
    send_type: 'ajax',
    // 关闭神策 SDK 自带的 web-sdk-log 日志（改用下方 track 里的中文日志）
    show_log: false,
    heatmap: {
      // 可视化全埋点 / 点击图：默认关闭，需要时改为 'default' 并在后台开启对应能力
      clickmap: 'not_collect',
      scroll_notice_map: 'not_collect',
    },
  })
} else if (import.meta.env.DEV) {
  console.warn(
    '[sensors] 未配置 VITE_SENSORS_SERVER_URL，神策埋点未初始化。请在 .env 或 .env.production 中配置。'
  )
}

// 事件名 → 中文显示名
const EVENT_LABELS: Record<string, string> = {
  X1ProHelpSite_PageView: '使用指导网站-打开浏览',
  X1ProHelpSite_TabClick: '使用指导网站-Tab点击',
  X1ProHelpSite_VideoClick: '使用指导网站-视频点击',
  X1ProHelpSite_ChapterClick: '使用指导网站-视频章节点击',
  X1ProHelpSite_VideoPlayDuration: '使用指导网站-视频播放时长',
  X1ProHelpSite_ManualDownload: '使用指导网站-使用手册下载',
  X1ProHelpSite_SystemLanguageSelection: '使用指导网站-系统语言选择',
}

// 属性名 → 中文显示名
const PROPERTY_LABELS: Record<string, string> = {
  TabName: 'Tab名称',
  VideoName: '视频名称',
  ChapterName: '章节名称',
  PlayDuration: '播放时长(秒)',
  SelectLanguage: '系统语言选择',
}

// 统一埋点入口：开发环境打印「英文变量名 + 中文显示名」日志便于验证触发，再调用 SDK track
// 测试等非 dev 环境如需看日志，在构建环境注入 VITE_ENABLE_TRACK_LOG=true 即可
const showTrackLog = import.meta.env.DEV || import.meta.env.VITE_ENABLE_TRACK_LOG === 'true'

export function track(eventName: string, properties?: Record<string, any>) {
  if (showTrackLog) {
    const eventLabel = EVENT_LABELS[eventName] ?? eventName
    // 事件：英文变量名（中文显示名），未命中映射时只显示英文变量名
    const eventDisplay = eventLabel === eventName ? eventName : `${eventName}（${eventLabel}）`
    const propsLabel: Record<string, any> = {}
    if (properties) {
      for (const key of Object.keys(properties)) {
        // 属性：英文变量名(中文显示名)，未命中映射时只显示英文变量名
        const label = PROPERTY_LABELS[key]
        const displayKey = label && label !== key ? `${key}(${label})` : key
        propsLabel[displayKey] = properties[key]
      }
    }
    console.log(`[神策埋点] ${eventDisplay}`, propsLabel)
  }
  sensors.track(eventName, properties)
}

export default sensors
