import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const menuBtnStyle = {
  display: 'flex', alignItems: 'center', gap: 10,
  width: '100%', padding: '15px 18px',
  background: 'none', border: 'none',
  borderBottom: '1px solid var(--divider)',
  cursor: 'pointer', fontSize: 15,
  color: 'var(--text-primary)', fontWeight: 600, textAlign: 'left',
}

const TABS = [
  { path: '/',        label: '홈',      icon: <HomeIcon /> },
  { path: '/records', label: '작업일지', icon: <WorkLogIcon /> },
  { path: null,       label: '추가',    icon: <PlusIcon />, fab: true },
  { path: '/tips',    label: '정비팁',  icon: <TipIcon /> },
]

export default function TabBar() {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      {menuOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 998 }}
            onClick={() => setMenuOpen(false)}
          />
          <div style={{
            position: 'fixed', bottom: 76, left: '50%', transform: 'translateX(-50%)',
            zIndex: 999, background: 'var(--bg-card)', borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
            overflow: 'hidden', minWidth: 200,
          }}>
            <button
              style={menuBtnStyle}
              onClick={() => { setMenuOpen(false); nav('/write') }}
            >
              <span>🔧</span> 작업일지 작성
            </button>
            <button
              style={{ ...menuBtnStyle, borderBottom: 'none' }}
              onClick={() => { setMenuOpen(false); nav('/tip/write') }}
            >
              <span>💡</span> 정비팁 작성
            </button>
          </div>
        </>
      )}

      <nav className="tab-bar">
        {TABS.map((tab, i) => {
          const active = tab.path === '/'
            ? pathname === '/'
            : tab.path ? pathname === tab.path || pathname.startsWith(tab.path + '/') : false

          if (tab.fab) {
            return (
              <button
                key={i}
                className="tab-item"
                style={{ position: 'relative', zIndex: menuOpen ? 1000 : undefined }}
                onClick={() => setMenuOpen(v => !v)}
                aria-label="추가"
              >
                <span className="tab-write-btn">{tab.icon}</span>
                <span className="tab-label">추가</span>
              </button>
            )
          }

          return (
            <button
              key={tab.path}
              className={`tab-item${active ? ' active' : ''}`}
              onClick={() => { setMenuOpen(false); nav(tab.path) }}
              aria-label={tab.label}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}

function HomeIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10"/>
  </svg>
}
function WorkLogIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
  </svg>
}
function PlusIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
    <path strokeLinecap="round" d="M12 5v14M5 12h14"/>
  </svg>
}
function TipIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
  </svg>
}
