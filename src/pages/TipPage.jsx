import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTips } from '../hooks/useTips.jsx'
import { useLightbox } from '../hooks/useLightbox.jsx'
import { printTip } from '../utils/pdf.js'
import Spinner from '../components/Spinner.jsx'
import Disclaimer from '../components/Disclaimer.jsx'

export default function TipPage() {
  const { tips, loading } = useTips()
  const { open: openLightbox } = useLightbox()
  const nav = useNavigate()

  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return tips
    const q = query.toLowerCase()
    return tips.filter(t =>
      t.title?.toLowerCase().includes(q) ||
      t.content?.toLowerCase().includes(q)
    )
  }, [query, tips])

  const handlePrint = (tip, e) => {
    e.stopPropagation()
    printTip(tip)
  }

  const fmt = iso => {
    const d = new Date(iso)
    return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}`
  }

  return (
    <div className="page-main" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 헤더 */}
      <div className="home-header">
        <div>
          <h1 className="home-title">정비팁</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>모델 무관 정비 노하우 메모</p>
        </div>
        <button
          style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-dim)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => nav('/tip/write')} aria-label="팁 작성"
        >
          <PlusIcon />
        </button>
      </div>

      {/* 검색 */}
      <div style={{ padding: '0 16px 12px' }}>
        <div className="home-search-bar">
          <SearchIcon />
          <input
            className="home-search-input"
            type="search" placeholder="팁 검색..."
            value={query} onChange={e => setQuery(e.target.value)}
          />
          {query && <button className="search-clear" onClick={() => setQuery('')}><XIcon /></button>}
        </div>
      </div>

      {/* 목록 */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 16px' }}>
        {loading ? (
          <div className="page-loader"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <LightBulbIcon />
            <p className="empty-title" style={{ marginTop: 16 }}>
              {query ? '검색 결과 없음' : '정비팁이 없어요'}
            </p>
            <p className="empty-subtitle">
              {query ? '다른 키워드로 검색해보세요.' : '유용한 정비 노하우를\n기록해두세요!'}
            </p>
            {!query && (
              <button className="empty-cta" onClick={() => nav('/tip/write')}>
                <PlusIcon /> 첫 팁 작성하기
              </button>
            )}
          </div>
        ) : (
          <div style={{ paddingBottom: 8 }}>
            {filtered.map(tip => (
              <div key={tip.id} className="tip-card" style={{ cursor: 'pointer' }} onClick={() => nav(`/tip/${tip.id}`)}>
                <div className="tip-card-header">
                  <span className="tip-date">{fmt(tip.createdAt)}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="tip-pdf-btn" onClick={e => handlePrint(tip, e)} title="PDF 저장">
                      <PrintIcon />
                    </button>
                  </div>
                </div>
                {tip.title && <div className="tip-title">{tip.title}</div>}
                {tip.content && <div className="tip-content">{tip.content}</div>}
                {tip.photos?.length > 0 && (
                  <div className="photo-grid" style={{ marginTop: 10 }}>
                    {tip.photos.map((src, i) => (
                      <div key={i} className="photo-grid-item" onClick={e => { e.stopPropagation(); openLightbox(tip.photos, i) }}>
                        <img src={src} alt={`사진 ${i+1}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <Disclaimer />
      </div>
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
function PrintIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={16} height={16}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
  </svg>
}
function LightBulbIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" width={72} height={72} style={{ color: 'var(--border)', opacity: 0.7 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
  </svg>
}
