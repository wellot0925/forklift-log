import { useState, useEffect, useRef } from 'react'

const CHECK_INTERVAL = 5 * 60 * 1000 // 5분

// vite.config.js의 emitVersionFile 플러그인이 빌드마다 새로 내보내는 dist/version.json과
// 이 번들에 박힌 __APP_VERSION__을 비교해, 새 배포가 나왔는지 감지한다.
export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const checking = useRef(false)
  const found = useRef(false)

  useEffect(() => {
    const check = async () => {
      if (checking.current || found.current) return
      checking.current = true
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
        if (res.ok) {
          const { version } = await res.json()
          if (version && version !== __APP_VERSION__) {
            found.current = true
            setUpdateAvailable(true)
          }
        }
      } catch {
        // 오프라인 등 네트워크 오류는 무시하고 다음 체크 때 재시도
      } finally {
        checking.current = false
      }
    }

    check()
    const interval = setInterval(check, CHECK_INTERVAL)
    const onVisible = () => { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', check)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', check)
    }
  }, [])

  return updateAvailable
}
