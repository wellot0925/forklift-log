import { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useRecords } from '../hooks/useRecords.jsx'
import { useTips } from '../hooks/useTips.jsx'
import { useToast } from '../hooks/useToast.jsx'
import { useViewedModels } from '../hooks/useViewedModels.jsx'
import { useUsers } from '../hooks/useUsers.jsx'
import { getSearchHistory, addSearchHistory, removeSearchHistory } from '../utils/storage.js'
import RecordCard from '../components/RecordCard.jsx'
import TipListCard from '../components/TipListCard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Spinner from '../components/Spinner.jsx'
import Disclaimer from '../components/Disclaimer.jsx'
import bulletins from '../data/bulletin.json'

const BULLETIN_LINK = 'https://service.doosan-iv.com:9443/bcs/bulletin/detailView.do?board_no='

const SHORTCUTS = [
  { label: '기술회보',   nav: '/bulletins' },
  { label: '정비지침서', url: 'https://drive.google.com/drive/folders/1FYNl0ecmjRISZVuP2nBLrjoQDmUoBy7E?usp=drive_link' },
  { label: '챕터별정리', sublabel: '지침서', url: 'https://drive.google.com/drive/folders/1tuU5bm7_yiwL9G7-zKpA6KxUZoOL8Yfb?usp=drive_link' },
  { label: '부품목록',   url: 'https://drive.google.com/drive/folders/14in1UfkFOWpauZ4HgrJO0Jwf-jyvOAin?usp=drive_link' },
]

const PULL_THRESHOLD = 64

export default function HomePage() {
  const nav = useNavigate()
  const { records, loading: recordsLoading, remove, refresh } = useRecords()
  const { tips, loading: tipsLoading } = useTips()
  const { toast } = useToast()
  const { viewed, track } = useViewedModels()
  const { isAdmin, pendingUsers } = useUsers()

  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const setQuery = useCallback(v => setSearchParams(v ? { q: v } : {}, { replace: true }), [setSearchParams])

  const [searchFocused, setSearchFocused] = useState(false)
  const [searchHistory, setSearchHistory] = useState(() => getSearchHistory('home'))

  const saveAndRefreshHistory = useCallback(q => {
    if (q.trim().length >= 2) {
      addSearchHistory('home', q.trim())
      setSearchHistory(getSearchHistory('home'))
    }
  }, [])

  const removeHistoryItem = useCallback(h => {
    removeSearchHistory('home', h)
    setSearchHistory(getSearchHistory('home'))
  }, [])

  /* pull-to-refresh */
  const scrollRef = useRef(null)
  const startYRef = useRef(0)

  // 이미 홈 화면일 때 하단 탭바의 "홈"을 다시 누르면 스크롤을 맨 위로 (TabBar.jsx에서 발생시키는 이벤트)
  useEffect(() => {
    const handler = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    window.addEventListener('home-scroll-top', handler)
    return () => window.removeEventListener('home-scroll-top', handler)
  }, [])
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

  const filteredBulletins = useMemo(() => {
    if (!isSearching) return []
    const q = query.toLowerCase()
    return bulletins.filter(b =>
      b.title.toLowerCase().includes(q) ||
      (b.ref_no && b.ref_no.toLowerCase().includes(q)) ||
      b.category.toLowerCase().includes(q)
    ).slice(0, 30)
  }, [query, isSearching])

  const KEYWORDS = [
    '유압', '브레이크', '배터리', 'DPF', '엑슬',
    '인젝터', '베어링', '실린더', '마스트', '냉각수',
    '충전기', '미션', '타이어', '에어컨', '씰',
    '호스', '오일', '부싱', '리튬', '킹핀',
    '라디에이터', '워터펌프', '냉매', '스캔',
  ]

  const top3Keywords = useMemo(() => {
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
      .slice(0, 3)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, tips])

  const tipIndexRef = useRef(Math.floor(Math.random() * 10000))
  const todayTips = useMemo(() => {
    if (tips.length === 0) return []
    if (tips.length === 1) return [tips[0]]
    const i1 = tipIndexRef.current % tips.length
    const i2 = (tipIndexRef.current + 1) % tips.length
    return [tips[i1], tips[i2]]
  }, [tips])

  const unresolved = useMemo(() =>
    records.filter(r => r.unresolved === true),
    [records]
  )

  const fmt = iso => {
    const d = new Date(iso)
    return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}`
  }

  const navToItem = item => {
    if (item._type === 'record') { track(item.model); nav(`/detail/${item.id}`) }
    else nav(`/tip/${item.id}`)
  }

  return (
    <div className="page-main" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sticky Header + Search */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg)' }}>
        <div className="home-header">
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            onClick={() => { setQuery(''); scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }) }}
          >
            <img src="/bobcat-icon.png.webp" alt="Bobcat 아이콘"
              style={{ height: 44, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
            <div>
              <h1 className="home-title">나만의 정비수첩</h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>용인중공업</p>
            </div>
          </div>
          <button
            onClick={() => window.open('https://forklift-rental-manager.vercel.app', '_blank', 'noopener,noreferrer')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
              padding: '10px 16px', borderRadius: 999,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <img src="/rental-manager-icon.svg" alt="" style={{ height: 22, width: 22, flexShrink: 0 }} />
            임대차관리 <ExternalLinkIcon />
          </button>
        </div>

        <div style={{ padding: '0 16px 12px', position: 'relative' }}>
          <div className="home-search-bar">
            <SearchIcon />
            <input
              className="home-search-input"
              type="search" inputMode="search"
              placeholder="작업일지, 정비팁, 기술회보 통합 검색..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              onKeyDown={e => { if (e.key === 'Enter') saveAndRefreshHistory(query) }}
            />
            {query && (
              <button className="search-clear" onClick={() => setQuery('')} aria-label="지우기">
                <XIcon />
              </button>
            )}
          </div>
          {searchFocused && !query && searchHistory.length > 0 && (
            <div style={{
              position: 'absolute', left: 16, right: 16, top: '100%', zIndex: 200,
              background: 'var(--surface)', border: '1px solid var(--divider)',
              borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden'
            }}>
              {searchHistory.map((h, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: i < searchHistory.length - 1 ? '1px solid var(--divider)' : 'none', cursor: 'pointer' }}
                  onMouseDown={e => { e.preventDefault(); setQuery(h); setSearchFocused(false) }}
                >
                  <ClockIcon />
                  <span style={{ flex: 1, marginLeft: 8, fontSize: 14, color: 'var(--text-primary)' }}>{h}</span>
                  <button
                    onMouseDown={e => { e.preventDefault(); e.stopPropagation(); removeHistoryItem(h) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px 6px', fontSize: 18, lineHeight: 1 }}
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {isAdmin && pendingUsers.length > 0 && (
          <div
            onClick={() => nav('/settings', { state: { scrollToPending: true } })}
            style={{
              margin: '0 16px 12px', padding: '14px 16px', borderRadius: 14,
              background: 'var(--danger-dim)', border: '1px solid var(--danger)',
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            }}
          >
            <BellIcon />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>
              승인 대기 중인 회원이 {pendingUsers.length}명 있습니다
            </span>
            <ChevronRightSmallIcon />
          </div>
        )}
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
            {filtered.length + filteredBulletins.length > 0
              ? <>
                  <p className="search-meta">{filtered.length + filteredBulletins.length}건의 결과</p>
                  {filtered.length > 0 && (
                    <div className="records-list">
                      {filtered.map(item =>
                        item._type === 'record'
                          ? <div key={item.id} onClick={() => track(item.model)} style={{ display: 'contents' }}>
                              <RecordCard record={item} onDelete={handleDelete} showTypeTag query={query} />
                            </div>
                          : <TipListCard key={item.id} tip={item} query={query} />
                      )}
                    </div>
                  )}
                  {filteredBulletins.length > 0 && (
                    <div style={{ padding: '0 16px' }}>
                      {filtered.length > 0 && (
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 8px', fontWeight: 600 }}>기술회보</p>
                      )}
                      {filteredBulletins.map(b => (
                        <button
                          key={b.board_no}
                          onClick={() => window.open(BULLETIN_LINK + b.board_no, '_blank', 'noopener,noreferrer')}
                          style={{
                            display: 'block', width: '100%', textAlign: 'left',
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                            borderRadius: 12, padding: '10px 14px', marginBottom: 8, cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: '#eab308', color: '#422006', whiteSpace: 'nowrap' }}>
                              {b.category}
                            </span>
                            {b.ref_no && <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{b.ref_no}</span>}
                          </div>
                          <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{b.title}</p>
                          <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
                            <span>{b.author}</span>
                            <span>{b.date.slice(0, 10)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              : <EmptyState type="search" />
            }
          </>
        ) : (
          /* ─── Dashboard ─── */
          <>
            {/* 단축 버튼 */}
            <ShortcutGrid nav={nav} />

            {merged.length === 0 ? <EmptyState type="home" /> : <>

            {/* 최근 작업 */}
            {merged.length > 0 && (
              <Section title="최근 작업">
                {merged.slice(0, 2).map(item => (
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

            {/* 오늘의 추천팁 */}
            {todayTips.length > 0 && (
              <Section title="오늘의 추천팁">
                {todayTips.map(tip => (
                  <div key={tip.id}
                    className="dashboard-unresolved-item"
                    style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start', gap: 6, padding: '12px 14px' }}
                    onClick={() => nav(`/tip/${tip.id}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                      <span style={{ fontSize: 15 }}>💡</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tip.title}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }}>
                        {fmt(tip.createdAt)}
                      </span>
                    </div>
                    {tip.content && (
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, paddingLeft: 23, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {tip.content}
                      </p>
                    )}
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

            {/* 자주 언급되는 키워드 TOP3 */}
            {top3Keywords.length > 0 && (
              <Section title="자주 언급되는 키워드 TOP3">
                {top3Keywords.map(({ keyword, count }, i) => (
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

            {/* 전체 기록 */}
            <Section
              title="전체 기록"
              action={
                <button
                  onClick={() => nav('/records')}
                  style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, padding: '2px 0' }}
                >
                  전체보기
                </button>
              }
            >
              <div style={{ margin: '0 -16px' }}>
                {merged.slice(0, 4).map(item =>
                  item._type === 'record'
                    ? <div key={item.id} onClick={() => track(item.model)} style={{ display: 'contents' }}>
                        <RecordCard record={item} onDelete={handleDelete} showTypeTag />
                      </div>
                    : <TipListCard key={item.id} tip={item} />
                )}
              </div>
            </Section>
            <div style={{ height: 8 }} />
            </>}
          </>
        )}
        <Disclaimer />
      </div>

    </div>
  )
}

function ShortcutGrid({ nav }) {
  const handle = s => {
    if (s.nav) nav(s.nav)
    else if (s.url) window.open(s.url, '_blank', 'noopener,noreferrer')
  }
  return (
    <div style={{ padding: '8px 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {SHORTCUTS.map(s => (
        <button
          key={s.label}
          onClick={() => handle(s)}
          disabled={!s.nav && !s.url}
          style={{
            padding: '16px 12px', background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 14,
            textAlign: 'center', cursor: (s.nav || s.url) ? 'pointer' : 'default',
            opacity: (s.nav || s.url) ? 1 : 0.45,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
            {s.label}
          </span>
          {s.sublabel && (
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2, display: 'block' }}>{s.sublabel}</span>
          )}
          {!s.nav && !s.url && (
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3, display: 'block' }}>준비중</span>
          )}
        </button>
      ))}
    </div>
  )
}

function Section({ title, titleColor, action, children }) {
  return (
    <div style={{ padding: '0 16px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p className="section-home-title" style={{ marginBottom: 0, ...(titleColor ? { color: titleColor } : {}) }}>{title}</p>
        {action}
      </div>
      {children}
    </div>
  )
}

const pad = n => String(n).padStart(2, '0')

function GearIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" width={20} height={20}>
    <circle cx="12" cy="12" r="3"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
}
function SearchIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={17} height={17}>
    <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
  </svg>
}
function ClockIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={14} height={14} style={{ flexShrink: 0, color: 'var(--text-secondary)' }}>
    <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/>
  </svg>
}
function XIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" width={12} height={12}>
    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
  </svg>
}
function ExternalLinkIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={13} height={13} style={{ flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
  </svg>
}
function BellIcon() {
  return <svg fill="none" stroke="var(--danger)" strokeWidth={2} viewBox="0 0 24 24" width={20} height={20} style={{ flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
  </svg>
}
function ChevronRightSmallIcon() {
  return <svg fill="none" stroke="var(--danger)" strokeWidth={2.2} viewBox="0 0 24 24" width={16} height={16} style={{ flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
  </svg>
}
function ChevronLeftIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" width={20} height={20}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
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
