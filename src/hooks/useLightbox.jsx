import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

const Ctx = createContext(null)

function ZoomableImage({ src }) {
  const imgRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [pos, setPos]     = useState({ x: 0, y: 0 })

  // 핀치 상태
  const pinch  = useRef(null) // { startDist, startScale }
  // 팬 상태 (확대 중 손가락 드래그)
  const pan    = useRef(null) // { startX, startY, startPos }
  // 더블탭 감지
  const dtap   = useRef({ count: 0, timer: null })

  const getDist = (t) =>
    Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)

  const handleTouchStart = useCallback((e) => {
    e.stopPropagation()
    if (e.touches.length === 2) {
      pinch.current = { startDist: getDist(e.touches), startScale: scale }
      pan.current = null
    } else if (e.touches.length === 1) {
      pan.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startPos: { ...pos },
      }
    }
  }, [scale, pos])

  const handleTouchMove = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.touches.length === 2 && pinch.current) {
      const newScale = Math.max(1, Math.min(6,
        pinch.current.startScale * getDist(e.touches) / pinch.current.startDist
      ))
      setScale(newScale)
    } else if (e.touches.length === 1 && pan.current && scale > 1) {
      setPos({
        x: pan.current.startPos.x + e.touches[0].clientX - pan.current.startX,
        y: pan.current.startPos.y + e.touches[0].clientY - pan.current.startY,
      })
    }
  }, [scale])

  const handleTouchEnd = useCallback((e) => {
    e.stopPropagation()

    // 줌 임계값 미만이면 원래대로
    setScale(s => {
      if (s < 1.1) { setPos({ x: 0, y: 0 }); return 1 }
      return s
    })

    // 더블탭 감지 (핀치가 아닐 때만)
    if (e.changedTouches.length === 1 && !pinch.current) {
      dtap.current.count++
      clearTimeout(dtap.current.timer)
      if (dtap.current.count >= 2) {
        dtap.current.count = 0
        setScale(s => {
          if (s > 1) { setPos({ x: 0, y: 0 }); return 1 }
          return 2.5
        })
      } else {
        dtap.current.timer = setTimeout(() => { dtap.current.count = 0 }, 320)
      }
    }

    if (e.touches.length === 0) pinch.current = null
  }, [])

  // touchmove 는 passive: false 로 등록해야 preventDefault() 가 작동함
  useEffect(() => {
    const el = imgRef.current
    if (!el) return
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    return () => el.removeEventListener('touchmove', handleTouchMove)
  }, [handleTouchMove])

  return (
    <img
      ref={imgRef}
      src={src}
      alt="확대 보기"
      draggable={false}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={e => e.stopPropagation()}
      style={{
        maxWidth: '100%',
        maxHeight: '100dvh',
        objectFit: 'contain',
        borderRadius: 8,
        transform: `scale(${scale}) translate(${pos.x / scale}px, ${pos.y / scale}px)`,
        transformOrigin: 'center',
        willChange: 'transform',
        touchAction: 'none',
        userSelect: 'none',
        cursor: scale > 1 ? 'grab' : 'default',
      }}
    />
  )
}

export function LightboxProvider({ children }) {
  const [state, setState] = useState(null) // { photos: [], idx: number }

  const open   = useCallback((photos, idx) => setState({ photos, idx }), [])
  const close  = useCallback(() => setState(null), [])
  const setIdx = useCallback(idx => setState(s => s ? { ...s, idx } : null), [])

  return (
    <Ctx.Provider value={{ open, close }}>
      {children}

      {state && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.93)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.18s ease',
          }}
          onClick={close}
        >
          <ZoomableImage src={state.photos[state.idx]} />

          {/* 닫기 */}
          <button
            onClick={close}
            style={{
              position: 'absolute', top: 20, right: 20,
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 20, lineHeight: 1,
            }}
          >✕</button>

          {/* 힌트 */}
          <div style={{
            position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
            fontSize: 12, color: 'rgba(255,255,255,0.5)',
            pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>
            핀치 또는 더블탭으로 확대
          </div>

          {/* 점 네비게이션 */}
          {state.photos.length > 1 && (
            <div style={{
              position: 'absolute', bottom: 30,
              left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 12,
            }}>
              {state.photos.map((_, i) => (
                <div
                  key={i}
                  onClick={e => { e.stopPropagation(); setIdx(i) }}
                  style={{
                    width: 8, height: 8, borderRadius: '50%', cursor: 'pointer',
                    background: i === state.idx ? 'white' : 'rgba(255,255,255,0.35)',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Ctx.Provider>
  )
}

export const useLightbox = () => useContext(Ctx)
