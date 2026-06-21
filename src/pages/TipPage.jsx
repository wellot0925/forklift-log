import { useState, useMemo } from 'react'
import { useTips } from '../hooks/useTips.jsx'
import { useToast } from '../hooks/useToast.jsx'
import { useLightbox } from '../hooks/useLightbox.jsx'
import { compressImage } from '../utils/storage.js'
import { printTip } from '../utils/pdf.js'
import Spinner from '../components/Spinner.jsx'
import Disclaimer from '../components/Disclaimer.jsx'

const MAX_PHOTOS = 5

export default function TipPage() {
  const { tips, loading, add } = useTips()
  const { toast } = useToast()
  const { open: openLightbox } = useLightbox()

  const [query, setQuery] = useState('')
  const [writeOpen, setWriteOpen] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', photos: [] })
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    if (!query.trim()) return tips
    const q = query.toLowerCase()
    return tips.filter(t =>
      t.title?.toLowerCase().includes(q) ||
      t.content?.toLowerCase().includes(q)
    )
  }, [query, tips])

  const handleSave = async () => {
    if (!form.title.trim() && !form.content.trim()) {
      toast('제목이나 내용을 입력해주세요.', 'error'); return
    }
    setSaving(true)
    try {
      await add(form)
      toast('팁이 저장되었습니다!', 'success')
      setForm({ title: '', content: '', photos: [] })
      setWriteOpen(false)
    } catch {
      toast('저장에 실패했습니다.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoAdd = async e => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const toAdd = files.slice(0, MAX_PHOTOS - form.photos.length)
    try {
      const compressed = await Promise.all(toAdd.map(f => compressImage(f)))
      setForm(f => ({ ...f, photos: [...f.photos, ...compressed] }))
    } catch { toast('사진 추가에 실패했습니다.', 'error') }
    e.target.value = ''
  }

  const handlePrint = (tip, e) => {
    e.stopPropagation()
    printTip(tip)
  }

  const fmt = iso => {
    const d = new Date(iso)
    return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}`
  }

  return (
    <div className="page-main" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* 헤더 */}
      <div className="home-header">
        <div>
          <h1 className="home-title">정비팁</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>모델 무관 정비 노하우 메모</p>
        </div>
        <button
          style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-dim)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setWriteOpen(true)} aria-label="팁 추가"
        >
          <PlusIcon />
        </button>
      </div>

      {/* 검색 */}
      <div style={{ padding: '0 16px 12px' }}>
        <div className="home-search-bar">
          <SearchIcon />
          <input
            className="home-search-input"
            type="search" placeholder="팁 검색..."
            value={query} onChange={e => setQuery(e.target.value)}
          />
          {query && <button className="search-clear" onClick={() => setQuery('')}><XIcon /></button>}
        </div>
      </div>

      {/* 목록 */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 16px' }}>
        {loading ? (
          <div className="page-loader"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <LightBulbIcon />
            <p className="empty-title" style={{ marginTop: 16 }}>
              {query ? '검색 결과 없음' : '정비팁이 없어요'}
            </p>
            <p className="empty-subtitle">
              {query ? '다른 키워드로 검색해보세요.' : '유용한 정비 노하우를\n기록해두세요!'}
            </p>
            {!query && (
              <button className="empty-cta" onClick={() => setWriteOpen(true)}>
                <PlusIcon /> 첫 팁 작성하기
              </button>
            )}
          </div>
        ) : (
          <div style={{ paddingBottom: 8 }}>
            {filtered.map(tip => (
              <div key={tip.id} className="tip-card">
                <div className="tip-card-header">
                  <span className="tip-date">{fmt(tip.createdAt)}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="tip-pdf-btn" onClick={e => handlePrint(tip, e)} title="PDF 저장">
                      <PrintIcon />
                    </button>
                  </div>
                </div>
                {tip.title && <div className="tip-title">{tip.title}</div>}
                {tip.content && <div className="tip-content">{tip.content}</div>}
                {tip.photos?.length > 0 && (
                  <div className="photo-grid" style={{ marginTop: 10 }}>
                    {tip.photos.map((src, i) => (
                      <div key={i} className="photo-grid-item" onClick={() => openLightbox(tip.photos, i)}>
                        <img src={src} alt={`사진 ${i+1}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <Disclaimer />
      </div>

      {/* 작성 모달 */}
      {writeOpen && (
        <div className="modal-overlay" onClick={() => setWriteOpen(false)}>
          <div className="tip-write-modal" onClick={e => e.stopPropagation()}>
            <div className="model-modal-header">
              <span className="model-modal-title">팁 작성</span>
              <button className="header-btn" onClick={() => setWriteOpen(false)}><CloseIcon /></button>
            </div>
            <div style={{ padding: '0 16px', overflowY: 'auto', flex: 1 }}>
              <input
                className="form-input" style={{ marginBottom: 10 }}
                placeholder="제목 (선택)"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
              <textarea
                className="form-textarea"
                placeholder="정비 노하우, 주의사항, 팁을 자유롭게 기록하세요..."
                rows={5}
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              />
              {/* 사진 (최대 5장) */}
              <div style={{ marginTop: 12 }}>
                <div className="photo-row">
                  {form.photos.map((src, i) => (
                    <div key={i} className="photo-thumb-wrap">
                      <img src={src} alt="" className="photo-thumb" />
                      <button type="button" className="photo-remove"
                        onClick={() => setForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))}>✕</button>
                    </div>
                  ))}
                  {form.photos.length < MAX_PHOTOS && (<>
                    <label className="photo-add-label" htmlFor="tip-photo-camera">
                      <CameraIcon /><span>카메라</span>
                      <input id="tip-photo-camera" type="file"
                        accept="image/*" capture="environment"
                        onChange={handlePhotoAdd} style={{ display: 'none' }} />
                    </label>
                    <label className="photo-add-label" htmlFor="tip-photo-gallery">
                      <GalleryIcon /><span>갤러리</span>
                      <input id="tip-photo-gallery" type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
                        multiple onChange={handlePhotoAdd} style={{ display: 'none' }} />
                    </label>
                  </>)}
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 16px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid var(--divider)' }}>
              <button className="btn-cta" onClick={handleSave} disabled={saving}>
                {saving ? <><Spinner size="sm" white />저장 중...</> : '✓  작성완료'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

const pad = n => String(n).padStart(2, '0')

function PlusIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" width={20} height={20}>
    <path strokeLinecap="round" d="M12 5v14M5 12h14"/>
  </svg>
}
function SearchIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={17} height={17}>
    <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
  </svg>
}
function XIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" width={12} height={12}>
    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
  </svg>
}
function CloseIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" width={20} height={20} color="white">
    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
  </svg>
}
function TrashIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={16} height={16}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
  </svg>
}
function PrintIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={16} height={16}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
  </svg>
}
function CameraIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" width={24} height={24}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
}
function GalleryIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" width={24} height={24}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21"/>
  </svg>
}
function LightBulbIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" width={72} height={72} style={{ color: 'var(--border)', opacity: 0.7 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
  </svg>
}
