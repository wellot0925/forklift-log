export default function UpdateBanner() {
  return (
    <div
      onClick={() => window.location.reload()}
      role="button"
      style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, zIndex: 9999,
        height: 'var(--update-banner-h)', boxSizing: 'border-box',
        background: 'var(--primary)', color: '#fff',
        padding: '0 16px', fontSize: 14, fontWeight: 600,
        textAlign: 'center', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}
    >
      <RefreshIcon />
      새 버전이 있습니다 — 탭해서 새로고침
    </div>
  )
}

function RefreshIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={16} height={16}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}
