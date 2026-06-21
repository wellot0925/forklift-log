import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTips } from '../hooks/useTips.jsx'
import { useToast } from '../hooks/useToast.jsx'
import { useLightbox } from '../hooks/useLightbox.jsx'
import { printTip } from '../utils/pdf.js'
import Header from '../components/Header.jsx'
import Spinner from '../components/Spinner.jsx'
import Disclaimer from '../components/Disclaimer.jsx'

export default function TipDetailPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { tips, loading, remove } = useTips()
  const { toast } = useToast()
  const { open: openLightbox } = useLightbox()

  const [printing, setPrinting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const tip = tips.find(t => t.id === id)

  useEffect(() => {
    if (!loading && !tip) nav('/tips', { replace: true })
  }, [loading, tip, nav])

  if (loading) return (
    <div className="detail-page page-sub">
      <Header title="정비팁 상세" showBack />
      <div className="page-loader"><Spinner size="lg" /></div>
    </div>
  )

  if (!tip) return null

  const handlePrint = () => {
    setPrinting(true)
    try { printTip(tip) } finally { setTimeout(() => setPrinting(false), 1000) }
  }

  const handleDelete = () => {
    remove(id)
    nav('/tips', { replace: true })
    toast('팁이 삭제되었습니다.', 'info')
  }

  const created = new Date(tip.createdAt)
  const dateStr = `${created.getFullYear()}.${pad(created.getMonth()+1)}.${pad(created.getDate())}`

  return (
    <div className="detail-page page-sub">
      <Header title="정비팁 상세" showBack />

      <div className="detail-content">
        {/* 날짜 + 작성자 */}
        <div className="detail-model-row">
          <span className="detail-model-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 22 }}>💡</span> 정비팁
          </span>
          <div className="detail-meta">
            {tip.createdBy && (
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{tip.createdBy}</span>
            )}
            <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{dateStr}</span>
          </div>
        </div>

        {/* 제목 */}
        {tip.title && (
          <div className="detail-section">
            <div className="detail-section-label"><TitleIcon /> 제목</div>
            <div className="detail-section-text" style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.5 }}>
              {tip.title}
            </div>
          </div>
        )}

        {/* 내용 */}
        {tip.content && (
          <div className="detail-section" style={{ borderLeft: '3px solid var(--primary)' }}>
            <div className="detail-section-label"><NoteIcon /> 내용</div>
            <div className="detail-section-text" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
              {tip.content}
            </div>
          </div>
        )}

        {/* 사진 */}
        {tip.photos?.length > 0 && (
          <div className="detail-photos">
            <div className="detail-section-label">
              <CameraIcon /> 사진 {tip.photos.length}장
            </div>
            <div className="photo-grid">
              {tip.photos.map((src, i) => (
                <div key={i} className="photo-grid-item" onClick={() => openLightbox(tip.photos, i)}>
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
          <button className="btn btn-secondary" onClick={() => nav(`/tip/write/${id}`)}>
            <EditIcon /> 수정하기
          </button>
        </div>

        {/* 삭제 */}
        <div style={{ padding: '8px 0 0' }}>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <TrashIcon /> 팁 삭제
            </button>
          ) : (
            <div style={{ background: 'var(--danger-dim)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--danger)', fontWeight: 600, textAlign: 'center' }}>
                정말 삭제할까요? 되돌릴 수 없습니다.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setConfirmDelete(false)}
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

const pad = n => String(n).padStart(2, '0')

function TitleIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={14} height={14}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16"/>
  </svg>
}
function NoteIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={14} height={14}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
  </svg>
}
function CameraIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={14} height={14}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
}
function PrintIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={18} height={18}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
  </svg>
}
function EditIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={18} height={18}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
  </svg>
}
function TrashIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={16} height={16}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
  </svg>
}
