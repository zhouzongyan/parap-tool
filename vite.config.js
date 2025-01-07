import { fileURLToPath, URL } from 'node:url'
import { viteSingleFile } from "vite-plugin-singlefile"
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'


// 获取命令行参数
const args = process.argv.slice(2);

// 解析参数为对象
const CUSTOMPARAMS = args.reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  if (key && value) {
    acc[key.replace(/^--/, '')] = value;
  }
  return acc;
}, {});

// https://vite.dev/config/
export default defineConfig({
  define: {
    CUSTOMPARAMS: JSON.stringify(CUSTOMPARAMS || {}),
  },
  plugins: [
    vue(),
    CUSTOMPARAMS.singlefile !== "" ? viteSingleFile() : null
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    // 设置输出目录
    // outDir: '/Users/parapeng/Desktop/apkEditor/app/html/dist',
    // emptyOutDir: true,
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
