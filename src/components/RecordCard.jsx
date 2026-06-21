import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Highlight from '../utils/highlight.jsx'

const REVEAL_X  = -82   // px to show delete button
const DELETE_X  = -160  // px to trigger auto-delete

export default function RecordCard({ record, onDelete, showTypeTag, query = '' }) {
  const nav = useNavigate()
  const [offsetX, setOffsetX] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const startXRef = useRef(0)
  const draggingRef = useRef(false)
  const wrapperRef = useRef(null)

  /* ─── touch handlers ─── */
  const onTouchStart = e => {
    startXRef.current = e.touches[0].clientX
    draggingRef.current = false
  }

  const onTouchMove = useCallback(e => {
    const dx = e.touches[0].clientX - startXRef.current
    if (Math.abs(dx) > 5) draggingRef.current = true
    if (dx < 0) {
      setOffsetX(Math.max(dx, DELETE_X))
    } else if (offsetX < 0) {
      setOffsetX(Math.min(dx + offsetX, 0))
    }
  }, [offsetX])

  const onTouchEnd = useCallback(() => {
    if (offsetX < DELETE_X / 2) {
      // snap to reveal
      setOffsetX(REVEAL_X)
    } else {
      setOffsetX(0)
    }
  }, [offsetX])

  /* ─── click on card ─── */
  const onCardClick = () => {
    if (draggingRef.current) return
    if (offsetX !== 0) { setOffsetX(0); return }
    nav(`/detail/${record.id}`)
  }

  /* ─── delete ─── */
  const handleDelete = e => {
    e.stopPropagation()
    setDeleting(true)
    setTimeout(() => onDelete(record.id), 220)
  }

  const date = new Date(record.createdAt)
  const dateStr = `${date.getFullYear()}.${pad(date.getMonth()+1)}.${pad(date.getDate())}`

  return (
    <div
      ref={wrapperRef}
      className="record-card-wrapper"
      style={{ opacity: deleting ? 0 : 1, transition: deleting ? 'opacity 0.22s ease' : undefined }}
    >
      {/* Delete background revealed by swipe */}
      <div className="record-card-delete-bg">
        <button onClick={handleDelete} aria-label="삭제">
          <TrashIcon />
        </button>
      </div>

      {/* Swipeable card */}
      <div
        className="record-card"
        style={{ transform: `translateX(${offsetX}px)`, transition: draggingRef.current ? 'none' : 'transform 0.25s ease' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={onCardClick}
      >
        <div className="record-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {showTypeTag && <span style={{ fontSize: 15, lineHeight: 1 }}>🔧</span>}
            <span className="model-badge">
              <ForkliftSmall />
              {record.model}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            {record.author && (
              <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>{record.author}</span>
            )}
            <span className="record-date">{dateStr}</span>
          </div>
        </div>

        <div className="record-symptoms">
          <Highlight text={record.symptoms} query={query} />
        </div>

        {record.solution && (
          <div className="record-solution-preview">
            ✓ <Highlight text={record.solution} query={query} />
          </div>
        )}

        {(record.photos?.length > 0) && (
          <div className="record-card-footer">
            <span className="photo-count-badge">
              <CameraIcon />
              사진 {record.photos.length}장
            </span>
            <span className="record-arrow"><ChevronRight /></span>
          </div>
        )}
        {!record.photos?.length && (
          <div className="record-card-footer" style={{ justifyContent: 'flex-end' }}>
            <span className="record-arrow"><ChevronRight /></span>
          </div>
        )}
      </div>
    </div>
  )
}

const pad = n => String(n).padStart(2, '0')

function TrashIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
      width={22} height={22} color="white">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}
function CameraIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}
function ChevronRight() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
      width={16} height={16}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    </svg>
  )
}
function ForkliftSmall() {
  return (
    <svg fill="currentColor" viewBox="0 0 16 16" width={11} height={11}>
      <rect x="0" y="8" width="9" height="2" rx="1"/>
      <rect x="0" y="11" width="9" height="2" rx="1"/>
      <rect x="7" y="2" width="2" height="12" rx="1"/>
      <rect x="9" y="5" width="6" height="8" rx="2"/>
      <circle cx="11" cy="14" r="2"/>
    </svg>
  )
}
