import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRecords } from '../hooks/useRecords.jsx'
import { useToast } from '../hooks/useToast.jsx'
import Header from '../components/Header.jsx'
import Spinner from '../components/Spinner.jsx'

export default function DetailPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { records, remove, loading } = useRecords()
  const { toast } = useToast()

  const [lightbox, setLightbox] = useState(null) // photo index
  const [confirmDelete, setConfirmDelete] = useState(false)

  const record = records.find(r => r.id === id)

  useEffect(() => {
    if (!loading && !record) nav('/', { replace: true })
  }, [loading, record, nav])

  if (loading) {
    return (
      <div className="detail-page page-sub">
        <Header title="상세 보기" showBack showHome />
        <div className="page-loader"><Spinner size="lg" /></div>
      </div>
    )
  }

  if (!record) return null

  const created = new Date(record.createdAt)
  const updated = new Date(record.updatedAt)
  const dateStr  = fmt(created)
  const timeStr  = fmtTime(created)
  const changedStr = record.updatedAt !== record.createdAt ? `수정 ${fmt(updated)}` : null

  const handleDelete = () => {
    remove(id)
    toast('기록이 삭제되었습니다.', 'info')
    nav('/', { replace: true })
  }

  return (
    <div className="detail-page page-sub">
      <Header
        title="상세 보기"
        showBack
        showHome
        actions={[{
          label: '수정',
          icon: <EditIcon />,
          onClick: () => nav(`/write/${id}`)
        }]}
      />

      <div className="detail-content">
        {/* Model & date */}
        <div className="detail-model-row">
          <span className="detail-model-name">{record.model}</span>
          <div className="detail-meta">
            <span>{dateStr} {timeStr}</span>
            {changedStr && <span style={{ color: 'var(--text-placeholder)' }}>{changedStr}</span>}
          </div>
        </div>

        {/* Symptoms */}
        <Section icon={<AlertIcon />} label="증상" text={record.symptoms} />

        {/* Cause */}
        {record.cause && <Section icon={<SearchIcon />} label="원인" text={record.cause} />}

        {/* Solution */}
        {record.solution && (
          <Section icon={<CheckIcon />} label="해결방법" text={record.solution}
            highlight />
        )}

        {/* Photos */}
        {record.photos?.length > 0 && (
          <div className="detail-photos">
            <div className="detail-section-label">
              <CameraIcon /> 사진 {record.photos.length}장
            </div>
            <div className="photo-grid">
              {record.photos.map((src, i) => (
                <div key={i} className="photo-grid-item" onClick={() => setLightbox(i)}>
                  <img src={src} alt={`사진 ${i+1}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="detail-actions">
          <button className="btn btn-secondary" onClick={() => nav(`/write/${id}`)}>
            <EditIcon /> 수정하기
          </button>
          <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
            <TrashIcon /> 삭제
          </button>
        </div>

        <div style={{ height: 32 }} />
      </div>

      {/* Photo lightbox */}
      {lightbox !== null && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img
            src={record.photos[lightbox]}
            alt="확대 보기"
            onClick={e => e.stopPropagation()}
          />
          <button className="lightbox-close" onClick={() => setLightbox(null)}>
            <CloseIcon />
          </button>
          {/* prev / next */}
          {record.photos.length > 1 && (
            <div style={{
              position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 16,
            }}>
              {record.photos.map((_, i) => (
                <div key={i} onClick={e => { e.stopPropagation(); setLightbox(i) }} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: i === lightbox ? 'white' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete confirm sheet */}
      {confirmDelete && (
        <div className="confirm-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="confirm-sheet" onClick={e => e.stopPropagation()}>
            <p className="confirm-title">기록 삭제</p>
            <p className="confirm-subtitle">
              <strong>{record.model}</strong> 기록을 삭제하시겠어요?<br/>
              삭제한 기록은 복구할 수 없습니다.
            </p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>
                취소
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                <TrashIcon /> 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ icon, label, text, highlight }) {
  return (
    <div className="detail-section" style={highlight ? { borderLeft: '3px solid var(--primary)' } : undefined}>
      <div className="detail-section-label">{icon} {label}</div>
      <div className="detail-section-text">{text}</div>
    </div>
  )
}

const pad = n => String(n).padStart(2, '0')
const fmt = d => `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}`
const fmtTime = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`

function AlertIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={14} height={14}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
}
function SearchIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={14} height={14}>
    <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
  </svg>
}
function CheckIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" width={14} height={14}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
  </svg>
}
function CameraIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={14} height={14}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/>
  </svg>
}
function EditIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={18} height={18}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
  </svg>
}
function TrashIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={18} height={18}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
  </svg>
}
function CloseIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" width={20} height={20} color="white">
    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
  </svg>
}
