import { useNavigate } from 'react-router-dom'

export default function Header({ title, showBack = false, showHome = false, actions = [] }) {
  const nav = useNavigate()

  return (
    <header className="header">
      {/* Left slot */}
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 44 }}>
        {showBack && (
          <button className="header-btn" onClick={() => nav(-1)} aria-label="뒤로가기">
            <BackIcon />
          </button>
        )}
      </div>

      <h1 className="header-title">{title}</h1>

      {/* Right slot */}
      <div className="header-right">
        {showHome && (
          <button className="header-btn" onClick={() => nav('/')} aria-label="홈으로">
            <HomeIcon />
          </button>
        )}
        {actions.map((a, i) => (
          <button key={i} className="header-btn" onClick={a.onClick} aria-label={a.label}>
            {a.icon}
          </button>
        ))}
        {!showHome && actions.length === 0 && <div style={{ width: 44 }} />}
      </div>
    </header>
  )
}

export function BackIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"
      width={24} height={24}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

export function HomeIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
      width={24} height={24}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
    </svg>
  )
}
