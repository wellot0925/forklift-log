import { useState, useMemo } from 'react'
import bulletins from '../data/bulletin.json'
import Header from '../components/Header.jsx'

const CATEGORIES = ['전체', ...Array.from(new Set(bulletins.map(b => b.category))).sort()]

const LINK_BASE = 'https://service.doosan-iv.com:9443/bcs/bulletin/detailView.do?board_no='

export default function BulletinPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('전체')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return bulletins.filter(b => {
      const catMatch = category === '전체' || b.category === category
      const searchMatch = !q || b.title.toLowerCase().includes(q) || (b.ref_no && b.ref_no.toLowerCase().includes(q))
      return catMatch && searchMatch
    })
  }, [search, category])

  return (
    <div className="page-sub" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header title="기술회보" />

      <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
        {/* 검색 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '0 12px', marginBottom: 10,
        }}>
          <SearchIcon />
          <input
            style={{
              flex: 1, border: 'none', background: 'transparent',
              padding: '11px 4px', fontSize: 14, color: 'var(--text-primary)',
              outline: 'none',
            }}
            placeholder="제목 또는 문서번호 검색"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-secondary)', display: 'flex' }}
            >
              <CloseIcon />
            </button>
          )}
        </div>

        {/* 카테고리 필터 */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                flexShrink: 0, padding: '5px 12px', borderRadius: 20,
                border: '1px solid',
                borderColor: category === cat ? 'var(--primary)' : 'var(--border)',
                background: category === cat ? 'var(--primary)' : 'var(--bg-card)',
                color: category === cat ? '#fff' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '8px 0 6px' }}>
          {filtered.length}건
        </p>
      </div>

      {/* 목록 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 80px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '60px 0', fontSize: 14 }}>
            검색 결과가 없습니다
          </div>
        ) : (
          filtered.map(b => (
            <BulletinItem key={b.board_no} item={b} />
          ))
        )}
      </div>
    </div>
  )
}

function BulletinItem({ item }) {
  const handleClick = () => {
    window.open(LINK_BASE + item.board_no, '_blank', 'noopener,noreferrer')
  }

  const dateStr = item.date ? item.date.slice(0, 10) : ''

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '12px 14px', marginBottom: 8,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '2px 7px',
          borderRadius: 6, background: 'var(--primary-dim, rgba(59,130,246,0.12))',
          color: 'var(--primary)', whiteSpace: 'nowrap',
        }}>
          {item.category}
        </span>
        {item.ref_no && (
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
            {item.ref_no}
          </span>
        )}
      </div>
      <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
        {item.title}
      </p>
      <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
        <span>{item.author}</span>
        <span>{dateStr}</span>
        <span style={{ marginLeft: 'auto' }}>조회 {item.views}</span>
      </div>
    </button>
  )
}

function SearchIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={17} height={17} style={{ flexShrink: 0, color: 'var(--text-secondary)' }}>
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" width={16} height={16}>
      <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
