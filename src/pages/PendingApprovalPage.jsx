import { useAuth } from '../hooks/useAuth.jsx'

export default function PendingApprovalPage({ rejected = false }) {
  const { profile, logout } = useAuth()

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-status-icon" style={rejected ? { background: 'var(--danger-dim)' } : undefined}>
          {rejected ? <XIcon /> : <ClockIcon />}
        </div>
        <h1 className="auth-brand-title">
          {rejected ? '가입이 거절되었습니다' : '관리자 승인 대기 중입니다'}
        </h1>
        <p className="auth-brand-subtitle">
          {profile?.name ? `${profile.name}님, ` : ''}
          {rejected
            ? '가입 승인이 거절되었습니다. 관리자에게 문의해주세요.'
            : '관리자가 승인하면 이용하실 수 있습니다. 잠시만 기다려주세요.'}
        </p>
      </div>

      <button type="button" className="auth-switch-link" onClick={logout}>
        로그아웃
      </button>
    </div>
  )
}

function ClockIcon() {
  return <svg fill="none" stroke="var(--primary)" strokeWidth={1.8} viewBox="0 0 24 24" width={32} height={32}>
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
  </svg>
}
function XIcon() {
  return <svg fill="none" stroke="var(--danger)" strokeWidth={1.8} viewBox="0 0 24 24" width={32} height={32}>
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9.5l5 5m0-5l-5 5" />
  </svg>
}
