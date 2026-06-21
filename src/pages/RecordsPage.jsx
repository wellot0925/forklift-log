import { useRef, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecords } from '../hooks/useRecords.jsx'
import { useToast } from '../hooks/useToast.jsx'
import { useViewedModels } from '../hooks/useViewedModels.jsx'
import RecordCard from '../components/RecordCard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Spinner from '../components/Spinner.jsx'
import Disclaimer from '../components/Disclaimer.jsx'

const PULL_THRESHOLD = 64

export default function RecordsPage() {
  const nav = useNavigate()
  const { records, loading, remove, refresh } = useRecords()
  const { toast } = useToast()
  const { track } = useViewedModels()

  const [query, setQuery] = useState('')

  const scrollRef = useRef(null)
  const startYRef = useRef(0)
  const [pullDist, setPullDist] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const onTouchStart = e => {
    if (scrollRef.current?.scrollTop === 0) startYRef.current = e.touches[0].clientY
  }
  const onTouchMove = useCallback(e => {
    if (scrollRef.current?.scrollTop > 0) return
    const dy = e.touches[0].clientY - startYRef.current
    if (dy > 0) setPullDist(Math.min(dy * 0.55, 90))
  }, [])
  const onTouchEnd = useCallback(() => {
    if (pullDist >= PULL_THRESHOLD) {
      setRefreshing(true); setPullDist(0)
      refresh(); setTimeout(() => setRefreshing(false), 800)
    } else setPullDist(0)
  }, [pullDist, refresh])

  const handleDelete = useCallback(id => {
    remove(id); toast('기록이 삭제되었습니다.', 'info')
  }, [remove, toast])

  const isSearching = query.trim().length > 0

  const filtered = useMemo(() => {
    if (!isSearching) return records
    const q = query.toLowerCase()
    return records.filter(r =>
      r.model?.toLowerCase().includes(q) ||
      r.symptoms?.toLowerCase().includes(q) ||
      r.cause?.toLowerCase().includes(q) ||
      r.solution?.toLowerCase().includes(q)
    )
  }, [query, records, isSearching])

  return (
    <div className="page-main" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sticky header + search */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg)' }}>
        <div className="home-header">
          <div>
            <h1 className="home-title">작업일지</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              총 {records.length}건
            </p>
          </div>
          <button
            style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-dim)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => nav('/write')} aria-label="작업일지 작성"
          >
            <PlusIcon />
          </button>
        </div>

        <div style={{ padding: '0 16px 12px' }}>
          <div className="home-search-bar">
            <SearchIcon />
            <input
              className="home-search-input"
              type="search" inputMode="search"
              placeholder="모델, 증상, 원인, 조치 검색..."
              value={query} onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button className="search-clear" onClick={() => setQuery('')} aria-label="지우기">
                <XIcon />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      >
        {!isSearching && (
          <div
            className={`pull-indicator${pullDist >= PULL_THRESHOLD ? ' ready' : ''}`}
            style={{ height: refreshing ? 52 : pullDist, transition: pullDist === 0 ? 'height 0.3s ease' : 'none' }}
          >
            {(pullDist > 10 || refreshing) && <Spinner size="sm" />}
          </div>
        )}

        {loading ? (
          <div className="page-loader"><Spinner size="lg" /></div>
        ) : (
          <>
            {isSearching && (
              <p className="search-meta">{filtered.length}건의 결과</p>
            )}
            {filtered.length === 0 ? (
              <EmptyState type={isSearching ? 'search' : 'home'} />
            ) : (
              <div className="records-list">
                {filtered.map(r => (
                  <div key={r.id} onClick={() => track(r.model)} style={{ display: 'contents' }}>
                    <RecordCard record={r} onDelete={handleDelete} query={isSearching ? query : ''} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        <Disclaimer />
      </div>
    </div>
  )
}

function PlusIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" width={20} height={20}>
    <path strokeLinecap="round" d="M12 5v14M5 12h14"/>
  </svg>
}
function SearchIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={17} height={17}>
    <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
  </svg>
}
function XIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" width={12} height={12}>
    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
  </svg>
}
