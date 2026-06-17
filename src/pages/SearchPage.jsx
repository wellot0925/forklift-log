import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecords } from '../hooks/useRecords.jsx'
import { useToast } from '../hooks/useToast.jsx'
import RecordCard from '../components/RecordCard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Spinner from '../components/Spinner.jsx'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const { records, loading, remove, models } = useRecords()
  const { toast } = useToast()
  const inputRef = useRef(null)

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return records.filter(r =>
      r.model?.toLowerCase().includes(q) ||
      r.symptoms?.toLowerCase().includes(q) ||
      r.cause?.toLowerCase().includes(q) ||
      r.solution?.toLowerCase().includes(q)
    )
  }, [query, records])

  const handleDelete = id => {
    remove(id)
    toast('기록이 삭제되었습니다.', 'info')
  }

  const handleModelChip = model => {
    setQuery(model)
    inputRef.current?.focus()
  }

  return (
    <div className="page-main" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Search bar */}
      <div className="search-header">
        <div className="search-bar">
          <SearchIcon />
          <input
            ref={inputRef}
            className="search-input"
            type="search"
            inputMode="search"
            placeholder="모델명, 증상, 원인 검색..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery('')} aria-label="지우기">
              <XIcon />
            </button>
          )}
        </div>
      </div>

      {/* Model quick chips */}
      {!query && models.length > 0 && (
        <>
          <p className="search-meta">최근 모델</p>
          <div className="model-suggestions" style={{ padding: '0 16px 8px' }}>
            {models.slice(0, 8).map(m => (
              <button key={m} className="model-tag" onClick={() => handleModelChip(m)}>
                {m}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 16px' }}>
        {loading ? (
          <div className="page-loader"><Spinner size="lg" /></div>
        ) : !query ? (
          <div className="empty-state" style={{ paddingTop: 40 }}>
            <SearchBigIcon />
            <p className="empty-title" style={{ marginTop: 16 }}>기록 검색</p>
            <p className="empty-subtitle">모델명이나 증상을 입력하면<br/>관련 정비 기록을 찾아드려요.</p>
          </div>
        ) : results.length === 0 ? (
          <EmptyState type="search" />
        ) : (
          <>
            <p className="search-meta">{results.length}건의 결과</p>
            <div style={{ paddingBottom: 16 }}>
              {results.map(r => (
                <RecordCard key={r.id} record={r} onDelete={handleDelete} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
      width={18} height={18}>
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
    </svg>
  )
}
function XIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
      width={12} height={12}>
      <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
function SearchBigIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"
      width={72} height={72} style={{ color: 'var(--border)', opacity: 0.7 }}>
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
    </svg>
  )
}
