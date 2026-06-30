import { useRef, useState, useEffect, useCallback } from 'react'

const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#ffffff','#111111']
const BASE_LW = 4

function drawArrow(ctx, x1, y1, x2, y2, color, lw) {
  const dx = x2 - x1, dy = y2 - y1
  if (Math.hypot(dx, dy) < 2) return
  const angle = Math.atan2(dy, dx)
  const headLen = Math.max(lw * 4, 20)
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = lw
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6))
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export default function PhotoAnnotator({ src, onClose, onSave }) {
  const canvasRef = useRef(null)
  const sr = useRef({ tool: 'pen', color: COLORS[0], drawing: false, start: null, snap: null })
  const [tool, setToolUI] = useState('pen')
  const [color, setColorUI] = useState(COLORS[0])
  const [history, setHistory] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [textPos, setTextPos] = useState(null)

  const setTool = t => { sr.current.tool = t; setToolUI(t) }
  const setColor = c => { sr.current.color = c; setColorUI(c) }

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const c = canvasRef.current
      if (!c) return
      c.width = img.naturalWidth
      c.height = img.naturalHeight
      const ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0)
      setHistory([ctx.getImageData(0, 0, c.width, c.height)])
      setLoaded(true)
    }
    img.onerror = () => {
      // CORS 실패 시 non-CORS로 fallback (toDataURL 불가능하지만 표시는 가능)
      const img2 = new Image()
      img2.onload = () => {
        const c = canvasRef.current
        if (!c) return
        c.width = img2.naturalWidth
        c.height = img2.naturalHeight
        try { c.getContext('2d').drawImage(img2, 0, 0) } catch {}
        setLoaded(true)
      }
      img2.src = src
    }
    img.src = src
  }, [src])

  const getScale = () => {
    const c = canvasRef.current
    if (!c) return 1
    return c.width / c.getBoundingClientRect().width
  }

  const getPos = e => {
    const c = canvasRef.current
    const r = c.getBoundingClientRect()
    const t = e.touches?.[0] || e.changedTouches?.[0] || e
    const s = getScale()
    return { x: (t.clientX - r.left) * s, y: (t.clientY - r.top) * s }
  }

  const onStart = useCallback(e => {
    e.preventDefault()
    const { tool, color } = sr.current
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    const pos = getPos(e)
    const lw = BASE_LW * getScale()

    if (tool === 'text') {
      setTextPos(pos)
      return
    }

    sr.current.snap = ctx.getImageData(0, 0, c.width, c.height)
    sr.current.start = pos

    if (tool === 'pen') {
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
      ctx.strokeStyle = color
      ctx.lineWidth = lw
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }

    sr.current.drawing = true
  }, [])

  const onMove = useCallback(e => {
    e.preventDefault()
    if (!sr.current.drawing) return
    const { tool, color, start, snap } = sr.current
    const c = canvasRef.current
    const ctx = c.getContext('2d')
    const pos = getPos(e)
    const lw = BASE_LW * getScale()

    if (tool === 'pen') {
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    } else if (tool === 'arrow' && start && snap) {
      ctx.putImageData(snap, 0, 0)
      drawArrow(ctx, start.x, start.y, pos.x, pos.y, color, lw)
    }
  }, [])

  const onEnd = useCallback(e => {
    e.preventDefault()
    if (!sr.current.drawing) return
    const { tool, color, start, snap } = sr.current
    const c = canvasRef.current
    const ctx = c.getContext('2d')
    const pos = getPos(e)
    const lw = BASE_LW * getScale()

    if (tool === 'pen') {
      ctx.closePath()
    } else if (tool === 'arrow' && start) {
      if (snap) ctx.putImageData(snap, 0, 0)
      drawArrow(ctx, start.x, start.y, pos.x, pos.y, color, lw)
    }

    setHistory(h => [...h, ctx.getImageData(0, 0, c.width, c.height)])
    sr.current.drawing = false
    sr.current.start = null
    sr.current.snap = null
  }, [])

  useEffect(() => {
    const c = canvasRef.current
    if (!c || !loaded) return
    c.addEventListener('touchstart', onStart, { passive: false })
    c.addEventListener('touchmove', onMove, { passive: false })
    c.addEventListener('touchend', onEnd, { passive: false })
    return () => {
      c.removeEventListener('touchstart', onStart)
      c.removeEventListener('touchmove', onMove)
      c.removeEventListener('touchend', onEnd)
    }
  }, [loaded, onStart, onMove, onEnd])

  const undo = () => {
    if (history.length <= 1) return
    const newH = history.slice(0, -1)
    setHistory(newH)
    canvasRef.current.getContext('2d').putImageData(newH[newH.length - 1], 0, 0)
  }

  const confirmText = text => {
    const pos = textPos
    setTextPos(null)
    if (!text.trim() || !pos) return
    const c = canvasRef.current
    const ctx = c.getContext('2d')
    const fs = 22 * getScale()
    ctx.save()
    ctx.font = `bold ${fs}px sans-serif`
    ctx.textBaseline = 'top'
    ctx.lineWidth = fs * 0.12
    ctx.strokeStyle = 'rgba(0,0,0,0.8)'
    ctx.strokeText(text, pos.x, pos.y)
    ctx.fillStyle = sr.current.color
    ctx.fillText(text, pos.x, pos.y)
    ctx.restore()
    setHistory(h => [...h, ctx.getImageData(0, 0, c.width, c.height)])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.92)
      await onSave(dataUrl)
    } catch (e) {
      setSaving(false)
      if (e?.name === 'SecurityError') {
        alert('저장 실패: 이미지 CORS 오류입니다.\nFirebase Storage CORS 설정이 필요합니다.')
      } else {
        alert('저장에 실패했습니다.')
      }
    }
  }

  const toolLabel = { pen: '🖊 펜', arrow: '→ 화살표', text: 'T 텍스트' }[tool]

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100001, background:'#000', display:'flex', flexDirection:'column' }}>

      {/* 헤더 */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 12px', height:52, background:'rgba(0,0,0,0.85)',
        borderBottom:'1px solid rgba(255,255,255,0.08)', flexShrink:0,
      }}>
        <button onClick={onClose} style={bs}>취소</button>
        <span style={{ color:'#fff', fontSize:14, fontWeight:700 }}>{toolLabel}</span>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={undo} disabled={history.length <= 1}
            style={{ ...bs, opacity: history.length <= 1 ? 0.35 : 1 }}>↩ 되돌리기</button>
          <button onClick={handleSave} disabled={saving} style={{
            ...bs, background:'#2563eb', borderRadius:8, padding:'5px 13px',
            color:'#fff', opacity: saving ? 0.6 : 1,
          }}>
            {saving ? '저장 중...' : '✓ 저장'}
          </button>
        </div>
      </div>

      {/* 캔버스 영역 */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', padding:4 }}>
        {!loaded && <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14 }}>사진 불러오는 중...</p>}
        <canvas
          ref={canvasRef}
          style={{
            maxWidth:'100%', maxHeight:'100%',
            display: loaded ? 'block' : 'none',
            touchAction:'none', userSelect:'none',
            cursor: tool === 'text' ? 'text' : 'crosshair',
          }}
        />
      </div>

      {/* 하단 툴바 */}
      <div style={{
        background:'rgba(0,0,0,0.88)', borderTop:'1px solid rgba(255,255,255,0.08)',
        padding:'10px 16px 20px', flexShrink:0,
      }}>
        <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:10 }}>
          {[['pen','🖊 펜'],['arrow','→ 화살표'],['text','T 텍스트']].map(([k, lbl]) => (
            <button key={k} onClick={() => setTool(k)} style={{
              padding:'7px 16px', borderRadius:20, fontSize:13, fontWeight:700,
              border:'1.5px solid', cursor:'pointer',
              borderColor: tool === k ? '#fff' : 'rgba(255,255,255,0.22)',
              background: tool === k ? 'rgba(255,255,255,0.16)' : 'transparent',
              color:'#fff',
            }}>{lbl}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{
              width:28, height:28, borderRadius:'50%', background:c, cursor:'pointer', padding:0, flexShrink:0,
              border: color === c ? '3px solid #fff' : '2px solid rgba(255,255,255,0.15)',
              outline: color === c ? '2px solid rgba(255,255,255,0.4)' : 'none',
              outlineOffset:1,
            }} />
          ))}
        </div>
      </div>

      {/* 텍스트 입력 바텀시트 */}
      {textPos && (
        <TextSheet color={color} onConfirm={confirmText} onCancel={() => setTextPos(null)} />
      )}
    </div>
  )
}

function TextSheet({ color, onConfirm, onCancel }) {
  const [val, setVal] = useState('')
  return (
    <div style={{
      position:'absolute', inset:0, background:'rgba(0,0,0,0.6)',
      display:'flex', alignItems:'flex-end', zIndex:10,
    }}>
      <div style={{ width:'100%', background:'#1a1a1a', padding:'16px 16px 28px', borderRadius:'18px 18px 0 0' }}>
        <p style={{ color:'rgba(255,255,255,0.45)', fontSize:12, margin:'0 0 8px', textAlign:'center' }}>
          탭한 위치에 텍스트가 삽입됩니다
        </p>
        <input
          autoFocus
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onConfirm(val)}
          placeholder="텍스트 입력..."
          style={{
            width:'100%', padding:'11px 14px', borderRadius:11,
            border:`2px solid ${color}`, background:'#2a2a2a',
            color:'#fff', fontSize:16, outline:'none', boxSizing:'border-box',
          }}
        />
        <div style={{ display:'flex', gap:8, marginTop:10 }}>
          <button onClick={onCancel} style={sheetBtn(false)}>취소</button>
          <button onClick={() => onConfirm(val)} style={sheetBtn(true)}>확인</button>
        </div>
      </div>
    </div>
  )
}

const bs = {
  background:'none', border:'none', color:'rgba(255,255,255,0.85)',
  fontSize:13, cursor:'pointer', padding:'5px 4px', fontWeight:600,
}

const sheetBtn = primary => ({
  flex: primary ? 2 : 1, padding:'10px', borderRadius:11, cursor:'pointer',
  border: primary ? 'none' : '1px solid rgba(255,255,255,0.18)',
  background: primary ? '#2563eb' : 'transparent',
  color:'#fff', fontSize:14, fontWeight:700,
})
