import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      host: true,
      port: Number(env.VITE_PORT) || 5173,
      proxy: {
        [env.VITE_APP_BASE_API]: {
          target: env.VITE_API_URL,
          changeOrigin: true
          // 后端已设置 app.setGlobalPrefix('api')，无需 rewrite
        },
        '/uploads': {
          target: env.VITE_API_URL,
          changeOrigin: true
        }
      }
    }
  }
})
