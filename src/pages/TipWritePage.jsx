import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTips } from '../hooks/useTips.jsx'
import { useToast } from '../hooks/useToast.jsx'
import { compressImage, getAuthor, saveAuthor } from '../utils/storage.js'
import Header from '../components/Header.jsx'
import Spinner from '../components/Spinner.jsx'
import Disclaimer from '../components/Disclaimer.jsx'

const MAX_PHOTOS = 5

export default function TipWritePage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const nav = useNavigate()
  const { tips, add, update } = useTips()
  const { toast } = useToast()

  const [form, setForm] = useState({ title: '', content: '', photos: [], author: getAuthor() })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEdit) {
      const t = tips.find(x => x.id === id)
      if (t) setForm({ title: t.title ?? '', content: t.content ?? '', photos: t.photos ?? [], author: getAuthor() })
    }
  }, [isEdit, id, tips])

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.title.trim() && !form.content.trim()) {
      toast('제목이나 내용을 입력해주세요.', 'error'); return
    }
    setSaving(true)
    if (form.author.trim()) saveAuthor(form.author)
    try {
      if (isEdit) {
        await update(id, form)
        toast('팁이 수정되었습니다.', 'success')
        nav(`/tip/${id}`, { replace: true })
      } else {
        const r = await add(form)
        toast('팁이 저장되었습니다! 💡', 'success')
        nav(`/tip/${r.id}`, { replace: true })
      }
    } catch {
      toast('저장에 실패했습니다. 네트워크를 확인해주세요.', 'error')
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

  const removePhoto = idx => setForm(f => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }))

  return (
    <div className="write-page page-sub">
      <Header title={isEdit ? '정비팁 수정' : '정비팁 작성'} showBack={isEdit} showHome={isEdit} />

      <div className="write-scroll">
        <form id="tip-write-form" onSubmit={handleSubmit} noValidate>

          {/* 닉네임 */}
          <div className="form-section">
            <label className="form-label" htmlFor="tf-author">닉네임</label>
            <input id="tf-author" className="form-input" type="text"
              placeholder="이름 또는 닉네임 입력"
              value={form.author} onChange={e => set('author', e.target.value)} />
          </div>

          {/* 제목 */}
          <div className="form-section">
            <label className="form-label" htmlFor="tf-title">제목</label>
            <input id="tf-title" className="form-input" type="text"
              placeholder="핵심 내용 한 줄 요약 (선택)"
              value={form.title} onChange={e => set('title', e.target.value)} />
          </div>

          {/* 내용 */}
          <div className="form-section">
            <label className="form-label" htmlFor="tf-content">내용</label>
            <textarea id="tf-content" className="form-textarea"
              placeholder={`정비 노하우, 수치, 순서, 주의사항을 자유롭게 기록하세요.`}
              rows={10}
              value={form.content} onChange={e => set('content', e.target.value)} />
          </div>

          {/* 사진 */}
          <div className="form-section">
            <label className="form-label">
              사진
              <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: 12, marginLeft: 6 }}>
                ({form.photos.length}/{MAX_PHOTOS})
              </span>
            </label>
            <div className="photo-row">
              {form.photos.map((src, i) => (
                <div key={i} className="photo-thumb-wrap">
                  <img src={src} alt={`사진 ${i+1}`} className="photo-thumb" />
                  <button type="button" className="photo-remove" onClick={() => removePhoto(i)}>✕</button>
                </div>
              ))}
              {form.photos.length < MAX_PHOTOS && (<>
                <label className="photo-add-label" htmlFor="tpw-gallery">
                  <GalleryIcon /><span>갤러리</span>
                  <input id="tpw-gallery" type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
                    multiple onChange={handlePhotoAdd} style={{ display: 'none' }} />
                </label>
                <label className="photo-add-label" htmlFor="tpw-camera">
                  <CameraIcon /><span>카메라</span>
                  <input id="tpw-camera" type="file" accept="image/*" capture="environment"
                    onChange={handlePhotoAdd} style={{ display: 'none' }} />
                </label>
              </>)}
            </div>
          </div>

          <div style={{ height: 12 }} />
          <Disclaimer />
        </form>
      </div>

      <div className="write-footer">
        <button type="submit" form="tip-write-form" className="btn-cta" disabled={saving}>
          {saving
            ? <><Spinner size="sm" white />{form.photos.some(p => p.startsWith('data:')) ? '사진 업로드 중...' : '저장 중...'}</>
            : isEdit ? '✓  수정 완료' : '✓  작성완료'
          }
        </button>
      </div>
    </div>
  )
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
