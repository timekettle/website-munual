import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'

if (!Map.prototype.getOrInsertComputed) {
  Map.prototype.getOrInsertComputed = function (key: any, callbackInsert: (key: any) => any) {
    if (this.has(key)) {
      return this.get(key)
    }
    const value = callbackInsert(key)
    this.set(key, value)
    return value
  }
}


const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.mount('#app')
