import { useNavigate } from 'react-router-dom'
import Highlight from '../utils/highlight.jsx'

export default function TipListCard({ tip, query = '' }) {
  const nav = useNavigate()
  const date = new Date(tip.createdAt)
  const dateStr = `${date.getFullYear()}.${pad(date.getMonth()+1)}.${pad(date.getDate())}`
  const preview = tip.content?.slice(0, 100) ?? ''

  return (
    <div className="record-card-wrapper" onClick={() => nav(`/tip/${tip.id}`)} style={{ cursor: 'pointer' }}>
      <div className="record-card">
        <div className="record-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 15, lineHeight: 1 }}>💡</span>
            <span className="model-badge" style={{ background: 'rgba(234,179,8,0.15)', color: '#92400e' }}>
              정비팁
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            {tip.createdBy && (
              <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>{tip.createdBy}</span>
            )}
            <span className="record-date">{dateStr}</span>
          </div>
        </div>
        {tip.title && (
          <div className="record-symptoms">
            <Highlight text={tip.title} query={query} />
          </div>
        )}
        {preview && (
          <div className="record-solution-preview">
            <Highlight text={preview} query={query} />{tip.content?.length > 100 ? '…' : ''}
          </div>
        )}
        <div className="record-card-footer" style={{ justifyContent: 'flex-end' }}>
          <span className="record-arrow"><ChevronRight /></span>
        </div>
      </div>
    </div>
  )
}

const pad = n => String(n).padStart(2, '0')

function ChevronRight() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={16} height={16}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    </svg>
  )
}
