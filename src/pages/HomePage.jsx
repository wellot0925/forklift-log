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

export default function HomePage() {
  const nav = useNavigate()
  const { records, loading, remove, refresh } = useRecords()
  const { toast } = useToast()
  const { viewed, track } = useViewedModels()

  const [query, setQuery] = useState('')

  /* pull-to-refresh */
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

  /* ── Derived data ── */
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

  const lastRecord = records[0] ?? null

  const top3Symptoms = useMemo(() => {
    const freq = {}
    records.forEach(r => {
      if (!r.symptoms) return
      const key = r.symptoms.slice(0, 30).trim()
      freq[key] = (freq[key] ?? 0) + 1
    })
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([text, count]) => ({ text, count }))
  }, [records])

  const unresolved = useMemo(() =>
    records.filter(r => r.unresolved || (!r.cause && !r.solution)),
    [records]
  )

  const uniqueModels = new Set(records.map(r => r.model)).size
  const fmt = iso => {
    const d = new Date(iso)
    return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}`
  }

  return (
    <div className="page-main" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Header */}
      <div className="home-header">
        <div>
          <h1 className="home-title">나만의 정비지침서</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>두산 지게차 정비 기록</p>
        </div>
        <button
          style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-dim)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => nav('/write')} aria-label="새 기록 작성"
        >
          <PlusIcon />
        </button>
      </div>

      {/* Search bar */}
      <div style={{ padding: '0 16px 12px' }}>
        <div className="home-search-bar">
          <SearchIcon />
          <input
            className="home-search-input"
            type="search" inputMode="search"
            placeholder="모델명, 증상, 원인, 해결방법 검색..."
            value={query} onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery('')} aria-label="지우기">
              <XIcon />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable area */}
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
        ) : isSearching ? (
          /* ─── Search results ─── */
          <>
            {filtered.length > 0
              ? <>
                  <p className="search-meta">{filtered.length}건의 결과</p>
                  <div className="records-list">
                    {filtered.map(r => <RecordCard key={r.id} record={r} onDelete={handleDelete} />)}
                  </div>
                </>
              : <EmptyState type="search" />
            }
          </>
        ) : records.length === 0 ? (
          <EmptyState type="home" />
        ) : (
          /* ─── Dashboard ─── */
          <>
            {/* Stats */}
            <div className="stats-strip">
              <div className="stat-card">
                <div className="stat-value">{records.length}</div>
                <div className="stat-label">전체 기록</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{uniqueModels}</div>
                <div className="stat-label">모델 수</div>
              </div>
              <div className="stat-card" style={unresolved.length > 0 ? { borderTop: '2px solid var(--danger)' } : undefined}>
                <div className="stat-value" style={unresolved.length > 0 ? { color: 'var(--danger)' } : undefined}>
                  {unresolved.length}
                </div>
                <div className="stat-label">미해결</div>
              </div>
            </div>

            {/* 최근 작업 */}
            {lastRecord && (
              <Section title="최근 작업">
                <div
                  className="dashboard-recent"
                  onClick={() => { track(lastRecord.model); nav(`/detail/${lastRecord.id}`) }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="model-badge"><ForkliftIcon />{lastRecord.model}</div>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fmt(lastRecord.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', marginTop: 8, lineHeight: 1.4 }}>
                    {lastRecord.symptoms}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    탭하여 상세 보기 →
                  </div>
                </div>
              </Section>
            )}

            {/* 미해결 항목 */}
            {unresolved.length > 0 && (
              <Section title={`미해결 항목 ${unresolved.length}건`} titleColor="var(--danger)">
                {unresolved.map(r => (
                  <div key={r.id}
                    className="dashboard-unresolved-item"
                    onClick={() => { track(r.model); nav(`/detail/${r.id}`) }}
                  >
                    <span className="model-badge" style={{ background: 'var(--danger-dim)', color: 'var(--danger)' }}>
                      <ForkliftIcon />{r.model}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.symptoms}
                    </span>
                  </div>
                ))}
              </Section>
            )}

            {/* 자주 고장나는 증상 TOP3 */}
            {top3Symptoms.length > 0 && (
              <Section title="자주 고장나는 증상 TOP3">
                {top3Symptoms.map(({ text, count }, i) => (
                  <div key={i} className="dashboard-top-item">
                    <span className="top-rank">{i + 1}</span>
                    <span className="top-symptom">{text}</span>
                    <span className="top-count">{count}건</span>
                  </div>
                ))}
              </Section>
            )}

            {/* 최근 본 모델 */}
            {viewed.length > 0 && (
              <Section title="최근 본 모델">
                <div className="model-suggestions" style={{ flexWrap: 'wrap' }}>
                  {viewed.map(m => (
                    <button key={m} className="model-tag"
                      onClick={() => setQuery(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {/* 전체 기록 목록 */}
            <Section title="전체 기록">
              <div style={{ margin: '0 -16px' }}>
                {records.map(r => (
                  <div key={r.id} onClick={() => track(r.model)} style={{ display: 'contents' }}>
                    <RecordCard record={r} onDelete={handleDelete} />
                  </div>
                ))}
              </div>
            </Section>
            <div style={{ height: 8 }} />
          </>
        )}
        <Disclaimer />
      </div>
    </div>
  )
}

function Section({ title, titleColor, children }) {
  return (
    <div style={{ padding: '0 16px', marginBottom: 20 }}>
      <p className="section-home-title" style={titleColor ? { color: titleColor } : undefined}>{title}</p>
      {children}
    </div>
  )
}

const pad = n => String(n).padStart(2, '0')

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
function ForkliftIcon() {
  return <svg fill="currentColor" viewBox="0 0 16 16" width={11} height={11}>
    <rect x="0" y="8" width="9" height="2" rx="1"/>
    <rect x="0" y="11" width="9" height="2" rx="1"/>
    <rect x="7" y="2" width="2" height="12" rx="1"/>
    <rect x="9" y="5" width="6" height="8" rx="2"/>
    <circle cx="11" cy="14" r="2"/>
  </svg>
}
