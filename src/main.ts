import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import VConsole from 'vconsole'
import App from './App.vue'
import router from './router'
import sensors from './plugins/sensors'
import { applyDocumentTitle } from './i18n'

new VConsole()

if (!(Map.prototype as any).getOrInsertComputed) {
  (Map.prototype as any).getOrInsertComputed = function (key: any, callbackInsert: (key: any) => any) {
    if (this.has(key)) {
      return this.get(key)
    }
    const value = callbackInsert(key)
    this.set(key, value)
    return value
  }
}


const app = createApp(App)
app.config.globalProperties.$sensors = sensors
app.use(router)
app.use(ElementPlus)
app.mount('#app')

// 根据浏览器语言设置页面标题（覆盖 index.html 中的默认标题）
applyDocumentTitle(navigator.language || 'en')
