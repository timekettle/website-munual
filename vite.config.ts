import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    vue(),
    legacy({
      targets: ['Chrome >= 64', 'Safari >= 12', 'Firefox >= 60'],
      modernTargets: ['Chrome >= 64', 'Safari >= 12', 'Firefox >= 60'],
      modernPolyfills: true,
    }),
  ],
  server: {
    port: 8080,
  },
  build: {
    target: ['es2015', 'chrome64', 'safari12'],
  },
})
