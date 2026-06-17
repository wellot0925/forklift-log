import { useNavigate } from 'react-router-dom'

export default function EmptyState({ type = 'home' }) {
  const nav = useNavigate()

  if (type === 'search') {
    return (
      <div className="empty-state">
        <ForkliftIllustration />
        <p className="empty-title">검색 결과 없음</p>
        <p className="empty-subtitle">다른 키워드로 검색해보세요.<br/>모델명이나 증상을 입력해보세요.</p>
      </div>
    )
  }

  return (
    <div className="empty-state">
      <ForkliftIllustration />
      <p className="empty-title">아직 작업 기록이 없어요</p>
      <p className="empty-subtitle">지게차 정비 기록을 추가하면<br/>이곳에서 모아볼 수 있어요.</p>
      <button className="empty-cta" onClick={() => nav('/write')}>
        <PlusIcon />
        첫 기록 추가하기
      </button>
    </div>
  )
}

function PlusIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
      width={18} height={18}>
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  )
}

function ForkliftIllustration() {
  return (
    <svg className="empty-illustration" viewBox="0 0 200 160" fill="none"
      xmlns="http://www.w3.org/2000/svg">
      {/* Ground */}
      <rect x="10" y="138" width="180" height="4" rx="2" fill="currentColor" opacity="0.1"/>

      {/* Body */}
      <rect x="80" y="70" width="90" height="60" rx="10"
        fill="var(--primary)" opacity="0.15"/>
      <rect x="80" y="70" width="90" height="60" rx="10"
        stroke="var(--primary)" strokeWidth="2" opacity="0.4"/>

      {/* Cabin */}
      <rect x="130" y="48" width="36" height="26" rx="6"
        fill="var(--primary)" opacity="0.25"/>
      <rect x="135" y="53" width="26" height="16" rx="4"
        fill="var(--primary)" opacity="0.2"/>

      {/* Counterweight */}
      <rect x="152" y="98" width="22" height="28" rx="6"
        fill="var(--primary)" opacity="0.3"/>

      {/* Mast */}
      <rect x="70" y="20" width="14" height="110" rx="5"
        fill="var(--primary)" opacity="0.3"/>
      <rect x="75" y="20" width="4" height="110" rx="2"
        fill="var(--primary)" opacity="0.2"/>

      {/* Fork arms */}
      <rect x="22" y="95" width="52" height="9" rx="4"
        fill="var(--primary)" opacity="0.6"/>
      <rect x="22" y="110" width="52" height="9" rx="4"
        fill="var(--primary)" opacity="0.6"/>

      {/* Fork tips */}
      <rect x="14" y="95" width="12" height="9" rx="2"
        fill="var(--primary)" opacity="0.4"/>
      <rect x="14" y="110" width="12" height="9" rx="2"
        fill="var(--primary)" opacity="0.4"/>

      {/* Rear wheel */}
      <circle cx="150" cy="138" r="14" fill="var(--primary)" opacity="0.3"/>
      <circle cx="150" cy="138" r="8"  fill="var(--bg)"/>
      <circle cx="150" cy="138" r="4"  fill="var(--primary)" opacity="0.4"/>

      {/* Front wheel */}
      <circle cx="102" cy="138" r="14" fill="var(--primary)" opacity="0.3"/>
      <circle cx="102" cy="138" r="8"  fill="var(--bg)"/>
      <circle cx="102" cy="138" r="4"  fill="var(--primary)" opacity="0.4"/>

      {/* Exhaust puff */}
      <circle cx="172" cy="36" r="5" fill="currentColor" opacity="0.07"/>
      <circle cx="178" cy="28" r="4" fill="currentColor" opacity="0.05"/>
      <circle cx="184" cy="22" r="3" fill="currentColor" opacity="0.04"/>

      {/* Clipboard / checklist overlay */}
      <rect x="86" y="30" width="36" height="44" rx="4"
        fill="var(--bg-card)" stroke="var(--border)" strokeWidth="1.5"/>
      <rect x="96" y="26" width="16" height="8" rx="4"
        fill="var(--bg-card)" stroke="var(--border)" strokeWidth="1.5"/>
      <line x1="92" y1="44" x2="116" y2="44" stroke="var(--border)" strokeWidth="1.5"/>
      <line x1="92" y1="52" x2="116" y2="52" stroke="var(--border)" strokeWidth="1.5"/>
      <line x1="92" y1="60" x2="108" y2="60" stroke="var(--border)" strokeWidth="1.5"/>
      <circle cx="90" cy="44" r="2" fill="var(--primary)" opacity="0.6"/>
      <circle cx="90" cy="52" r="2" fill="var(--primary)" opacity="0.4"/>
      <circle cx="90" cy="60" r="2" fill="var(--border)" opacity="0.8"/>
    </svg>
  )
}
