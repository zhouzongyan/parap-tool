import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/tool': {
        target: 'http://localhost:80', // 后端API服务器地址
        changeOrigin: false, // 是否改变源地址
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            // 处理代理错误，返回404
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found, Palse open backend!');
          });
        }
      },
    },
  }
})
