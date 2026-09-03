// 网站标题（<title>）多语言映射：根据浏览器语言或用户所选语言设置页面标题。
// 不在该映射范围内的语言统一回退到英语标题。
const SITE_TITLES: Record<string, string> = {
  zh: 'X1 Meeting 帮助中心',
  en: 'X1 Meeting Help Center',
  es: 'Centro de ayuda de X1 Meeting',
  ja: 'X1 Meeting ヘルプセンター',
  de: 'X1 Meeting‑Hilfe',
  fr: "Centre d'aide X1 Meeting",
  ko: 'X1 Meeting 도움말 센터',
  th: 'ศูนย์ช่วยเหลือ X1 Meeting',
  ru: 'Справочный центр X1 Meeting',
  'zh-TW': 'X1 Meeting 幫助中心',
  tr: 'X1 Meeting Yardım Merkezi',
  uk: 'Центр допомоги X1 Meeting',
}

// 繁体中文相关语言代码（zh-TW / zh-HK / zh-MO / zh-Hant 等），避免被 prefix 回退误判为简体中文
const TRADITIONAL_CHINESE_RE = /^zh-(tw|hk|mo|hant)\b/i

export function resolveSiteTitle(lang: string): string {
  const code = (lang || '').toLowerCase()
  if (SITE_TITLES[code]) return SITE_TITLES[code]
  if (TRADITIONAL_CHINESE_RE.test(code)) return SITE_TITLES['zh-TW']
  const prefix = code.split('-')[0]
  if (SITE_TITLES[prefix]) return SITE_TITLES[prefix]
  return SITE_TITLES.en
}

export function applyDocumentTitle(lang: string): void {
  document.title = resolveSiteTitle(lang)
}
