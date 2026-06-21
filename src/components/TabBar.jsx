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
  { path: '/',         label: '홈',    icon: <HomeIcon /> },
  { path: '/write',    label: '기록',  icon: <WriteIcon />, fab: true },
  { path: '/tips',     label: '정비팁', icon: <TipIcon /> },
  { path: '/settings', label: '설정',  icon: <SettingsIcon /> },
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
            zIndex: 999, background: 'var(--surface)', borderRadius: 16,
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
        {TABS.map(tab => {
          const active = tab.path === '/' ? pathname === '/' : pathname.startsWith(tab.path)

          if (tab.fab) {
            return (
              <button
                key={tab.path}
                className="tab-item"
                style={{ position: 'relative', zIndex: menuOpen ? 1000 : undefined }}
                onClick={() => setMenuOpen(v => !v)}
                aria-label={tab.label}
              >
                <span className="tab-write-btn">{tab.icon}</span>
                <span className="tab-label" style={{ color: active ? 'var(--primary)' : undefined }}>
                  {tab.label}
                </span>
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
function WriteIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14"/>
  </svg>
}
function TipIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
  </svg>
}
function SettingsIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
}
