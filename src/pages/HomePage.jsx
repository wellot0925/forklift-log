import { useRef, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecords } from '../hooks/useRecords.jsx'
import { useTips } from '../hooks/useTips.jsx'
import { useToast } from '../hooks/useToast.jsx'
import { useViewedModels } from '../hooks/useViewedModels.jsx'
import RecordCard from '../components/RecordCard.jsx'
import TipListCard from '../components/TipListCard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Spinner from '../components/Spinner.jsx'
import Disclaimer from '../components/Disclaimer.jsx'

const PULL_THRESHOLD = 64

export default function HomePage() {
  const nav = useNavigate()
  const { records, loading: recordsLoading, remove, refresh } = useRecords()
  const { tips, loading: tipsLoading } = useTips()
  const { toast } = useToast()
  const { viewed, track } = useViewedModels()

  const [query, setQuery] = useState('')
  const [addMenuOpen, setAddMenuOpen] = useState(false)

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

  const loading = recordsLoading || tipsLoading

  /* ── Merged & sorted data ── */
  const merged = useMemo(() => {
    const all = [
      ...records.map(r => ({ ...r, _type: 'record' })),
      ...tips.map(t => ({ ...t, _type: 'tip' })),
    ]
    return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [records, tips])

  /* ── Derived data ── */
  const isSearching = query.trim().length > 0

  const filtered = useMemo(() => {
    if (!isSearching) return merged
    const q = query.toLowerCase()
    return merged.filter(item =>
      item._type === 'record'
        ? (item.model?.toLowerCase().includes(q) ||
           item.symptoms?.toLowerCase().includes(q) ||
           item.cause?.toLowerCase().includes(q) ||
           item.solution?.toLowerCase().includes(q))
        : (item.title?.toLowerCase().includes(q) ||
           item.content?.toLowerCase().includes(q))
    )
  }, [query, merged, isSearching])

  const KEYWORDS = [
    '유압', '브레이크', '배터리', 'DPF', '엑슬',
    '인젝터', '베어링', '실린더', '마스트', '냉각수',
    '충전기', '미션', '타이어', '에어컨', '씰',
    '호스', '오일', '부싱', '리튬', '킹핀',
    '라디에이터', '워터펌프', '냉매', '스캔',
  ]

  const top5Keywords = useMemo(() => {
    return KEYWORDS.map(kw => {
      const kwLower = kw.toLowerCase()
      let count = 0
      records.forEach(r => {
        const text = `${r.symptoms ?? ''} ${r.cause ?? ''} ${r.solution ?? ''}`.toLowerCase()
        if (text.includes(kwLower)) count++
      })
      tips.forEach(t => {
        const text = `${t.title ?? ''} ${t.content ?? ''}`.toLowerCase()
        if (text.includes(kwLower)) count++
      })
      return { keyword: kw, count }
    })
      .filter(k => k.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, tips])

  const unresolved = useMemo(() =>
    records.filter(r => r.unresolved || (!r.cause && !r.solution)),
    [records]
  )

  const uniqueModels = new Set(records.map(r => r.model)).size
  const fmt = iso => {
    const d = new Date(iso)
    return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}`
  }

  const navToItem = item => {
    if (item._type === 'record') { track(item.model); nav(`/detail/${item.id}`) }
    else nav(`/tip/${item.id}`)
  }

  return (
    <div className="page-main" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Header */}
      <div className="home-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/bobcat-icon.png.webp" alt="Bobcat 아이콘"
            style={{ height: 44, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
          <div>
            <h1 className="home-title">나만의 정비수첩</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>용인중공업</p>
          </div>
        </div>
        <button
          style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-dim)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: addMenuOpen ? 1000 : undefined }}
          onClick={() => setAddMenuOpen(v => !v)} aria-label="기록 추가"
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
            placeholder="작업일지, 정비팁 통합 검색..."
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
                    {filtered.map(item =>
                      item._type === 'record'
                        ? <div key={item.id} onClick={() => track(item.model)} style={{ display: 'contents' }}>
                            <RecordCard record={item} onDelete={handleDelete} showTypeTag />
                          </div>
                        : <TipListCard key={item.id} tip={item} />
                    )}
                  </div>
                </>
              : <EmptyState type="search" />
            }
          </>
        ) : merged.length === 0 ? (
          <EmptyState type="home" />
        ) : (
          /* ─── Dashboard ─── */
          <>
            {/* Stats */}
            <div className="stats-strip">
              <div className="stat-card">
                <div className="stat-value">{records.length + tips.length}</div>
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
            {merged.length > 0 && (
              <Section title="최근 작업">
                {merged.slice(0, 3).map(item => (
                  <div key={item.id}
                    className="dashboard-unresolved-item"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navToItem(item)}
                  >
                    <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>
                      {item._type === 'record' ? '🔧' : '💡'}
                    </span>
                    {item._type === 'record' ? (
                      <span className="model-badge" style={{ flexShrink: 0 }}>
                        <ForkliftIcon />{item.model}
                      </span>
                    ) : (
                      <span className="model-badge" style={{ background: 'rgba(234,179,8,0.15)', color: '#92400e', flexShrink: 0 }}>
                        정비팁
                      </span>
                    )}
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item._type === 'record' ? item.symptoms : item.title}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0, marginLeft: 4 }}>
                      {fmt(item.createdAt)}
                    </span>
                  </div>
                ))}
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

            {/* 자주 언급되는 키워드 TOP5 */}
            {top5Keywords.length > 0 && (
              <Section title="자주 언급되는 키워드 TOP5">
                {top5Keywords.map(({ keyword, count }, i) => (
                  <div key={i} className="dashboard-top-item"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setQuery(keyword)}
                  >
                    <span className="top-rank">{i + 1}</span>
                    <span className="top-symptom">{keyword}</span>
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
                    <button key={m} className="model-tag" onClick={() => setQuery(m)}>
                      {m}
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {/* 전체 기록 */}
            <Section title="전체 기록">
              <div style={{ margin: '0 -16px' }}>
                {merged.map(item =>
                  item._type === 'record'
                    ? <div key={item.id} onClick={() => track(item.model)} style={{ display: 'contents' }}>
                        <RecordCard record={item} onDelete={handleDelete} showTypeTag />
                      </div>
                    : <TipListCard key={item.id} tip={item} />
                )}
              </div>
            </Section>
            <div style={{ height: 8 }} />
          </>
        )}
        <Disclaimer />
      </div>

      {/* + 버튼 팝업 메뉴 */}
      {addMenuOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 998 }}
            onClick={() => setAddMenuOpen(false)}
          />
          <div style={{
            position: 'fixed', top: 56, right: 12, zIndex: 999,
            background: 'var(--surface)', borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
            overflow: 'hidden', minWidth: 190,
          }}>
            <button
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '15px 18px', background: 'none', border: 'none', borderBottom: '1px solid var(--divider)', cursor: 'pointer', fontSize: 15, color: 'var(--text-primary)', fontWeight: 600, textAlign: 'left' }}
              onClick={() => { setAddMenuOpen(false); nav('/write') }}
            >
              <span>🔧</span> 작업일지 작성
            </button>
            <button
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '15px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: 'var(--text-primary)', fontWeight: 600, textAlign: 'left' }}
              onClick={() => { setAddMenuOpen(false); nav('/tip/write') }}
            >
              <span>💡</span> 정비팁 작성
            </button>
          </div>
        </>
      )}
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
