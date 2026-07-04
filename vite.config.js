import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const APP_VERSION = String(Date.now())

// 빌드마다 고유한 버전을 dist/version.json으로 내보내, 배포된 앱이 최신인지
// 클라이언트에서 폴링해 확인할 수 있게 함 (useAppUpdate.jsx 참고)
function emitVersionFile() {
  return {
    name: 'emit-version-file',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version: APP_VERSION }),
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), emitVersionFile()],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
})
