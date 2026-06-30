import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRecords } from '../hooks/useRecords.jsx'
import { useToast } from '../hooks/useToast.jsx'
import { useLightbox } from '../hooks/useLightbox.jsx'
import { printRecord } from '../utils/pdf.js'
import { getAdminPassword } from '../utils/storage.js'
import Header from '../components/Header.jsx'
import Spinner from '../components/Spinner.jsx'
import Disclaimer from '../components/Disclaimer.jsx'

export default function DetailPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { records, loading, remove } = useRecords()
  const { toast } = useToast()
  const { open: openLightbox } = useLightbox()

  const [printing, setPrinting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [delPw, setDelPw] = useState('')
  const [delPwError, setDelPwError] = useState(false)

  const record = records.find(r => r.id === id)

  useEffect(() => {
    if (!loading && !record) nav('/', { replace: true })
  }, [loading, record, nav])

  const handleDelete = () => {
    if (delPw !== getAdminPassword()) {
      setDelPwError(true)
      return
    }
    remove(id)
    nav('/', { replace: true })
    toast('기록이 삭제되었습니다.', 'info')
  }

  if (loading) {
    return (
      <div className="detail-page page-sub">
        <Header title="상세 보기" showBack />
        <div className="page-loader"><Spinner size="lg" /></div>
      </div>
    )
  }

  if (!record) return null

  const created = new Date(record.createdAt)
  const updated = new Date(record.updatedAt)
  const dateStr    = fmt(created)
  const timeStr    = fmtTime(created)
  const hasEdited  = Boolean(record.modifiedBy)

  const handlePrint = () => {
    setPrinting(true)
    try { printRecord(record) } finally { setTimeout(() => setPrinting(false), 1000) }
  }

  return (
    <div className="detail-page page-sub">
      <Header title="상세 보기" showBack />

      <div className="detail-content">
        {/* 모델명 + 작성자/수정자 */}
        <div className="detail-model-row">
          <span className="detail-model-name">{record.model}</span>
          <div className="detail-meta">
            {/* 최초 작성자: 이름만 표시 */}
            {record.author && (
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{record.author}</span>
            )}
            {/* 수정자: 이름 + 수정 날짜 */}
            {hasEdited && (
              <span style={{ color: 'var(--text-placeholder)', fontSize: 11 }}>
                수정:&nbsp;
                {record.modifiedBy && (
                  <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{record.modifiedBy} </span>
                )}
                {fmt(updated)}
              </span>
            )}
          </div>
        </div>

        {/* 증상 */}
        <Section icon={<AlertIcon />} label="증상" text={record.symptoms} />

        {/* 원인 */}
        {record.cause && <Section icon={<SearchIcon />} label="원인" text={record.cause} />}

        {/* 해결방법 */}
        {record.solution && (
          <Section icon={<CheckIcon />} label="해결방법" text={record.solution} highlight />
        )}

        {/* 사진 */}
        {record.photos?.length > 0 && (
          <div className="detail-photos">
            <div className="detail-section-label">
              <CameraIcon /> 사진 {record.photos.length}장
            </div>
            <div className="photo-grid">
              {record.photos.map((src, i) => (
                <div key={i} className="photo-grid-item" onClick={() => openLightbox(record.photos, i)}>
                  <img src={src} alt={`사진 ${i+1}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="detail-actions">
          <button className="btn btn-outline" onClick={handlePrint} disabled={printing}>
            {printing ? <Spinner size="sm" /> : <PrintIcon />} PDF 저장
          </button>
          <button className="btn btn-secondary" onClick={() => nav(`/write/${id}`)}>
            <EditIcon /> 수정하기
          </button>
        </div>

        {/* 삭제 */}
        <div style={{ padding: '8px 0 0' }}>
          {!deleteOpen ? (
            <button
              onClick={() => setDeleteOpen(true)}
              style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <TrashIcon /> 기록 삭제
            </button>
          ) : (
            <div style={{ background: 'var(--danger-dim)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--danger)', fontWeight: 600, textAlign: 'center' }}>
                관리자 비밀번호를 입력하세요
              </p>
              <input
                type="password"
                placeholder="비밀번호"
                value={delPw}
                autoFocus
                onChange={e => { setDelPw(e.target.value); setDelPwError(false) }}
                onKeyDown={e => e.key === 'Enter' && handleDelete()}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${delPwError ? 'var(--danger)' : 'var(--border)'}`, background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
              />
              {delPwError && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--danger)', textAlign: 'center' }}>비밀번호가 틀렸습니다.</p>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  onClick={() => { setDeleteOpen(false); setDelPw(''); setDelPwError(false) }}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--danger)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  삭제
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ height: 24 }} />
        <Disclaimer />
      </div>
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
function PrintIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={18} height={18}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
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
