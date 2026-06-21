import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRecords } from '../hooks/useRecords.jsx'
import { useToast } from '../hooks/useToast.jsx'
import { compressImage, getAuthor, saveAuthor, getCustomModels, addCustomModel } from '../utils/storage.js'
import { MODEL_CATEGORIES } from '../data/models.js'
import Header from '../components/Header.jsx'
import Spinner from '../components/Spinner.jsx'
import Disclaimer from '../components/Disclaimer.jsx'

const MAX_PHOTOS = 5

export default function WritePage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const nav = useNavigate()
  const { add, update, records } = useRecords()
  const { toast } = useToast()

  const [form, setForm] = useState({
    model: '', symptoms: '', cause: '', solution: '',
    photos: [], unresolved: false,
    author: getAuthor(),
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [modelOpen, setModelOpen] = useState(false)
  const [modelSearch, setModelSearch] = useState('')
  const [customModels, setCustomModels] = useState(getCustomModels)
  const formRef = useRef(null)

  useEffect(() => {
    if (isEdit) {
      const r = records.find(x => x.id === id)
      if (r) setForm({
        model: r.model, symptoms: r.symptoms,
        cause: r.cause ?? '', solution: r.solution,
        photos: r.photos ?? [], unresolved: r.unresolved ?? false,
        author: getAuthor(), // 수정자는 현재 기기 닉네임
      })
    }
  }, [isEdit, id, records])

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.model.trim())    e.model    = '모델명을 선택해주세요'
    if (!form.symptoms.trim()) e.symptoms = '증상을 입력해주세요'
    if (!form.unresolved && !form.solution.trim()) e.solution = '해결방법을 입력하거나 미해결로 표시해주세요'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validate()) {
      formRef.current?.querySelector('[data-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSaving(true)
    if (form.author.trim()) saveAuthor(form.author)
    try {
      if (isEdit) {
        await update(id, form)
        toast('기록이 수정되었습니다.', 'success')
        nav(`/detail/${id}`, { replace: true })
      } else {
        const r = await add(form)
        toast('기록이 저장되었습니다! 🔧', 'success')
        nav(`/detail/${r.id}`, { replace: true })
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
    } catch {
      toast('사진 추가에 실패했습니다.', 'error')
    }
    e.target.value = ''
  }

  const removePhoto = idx => setForm(f => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }))

  /* 커스텀 모델 포함 카테고리 병합 */
  const mergedCategories = useMemo(() => {
    const result = MODEL_CATEGORIES.map(cat => ({ ...cat, models: [...cat.models] }))
    customModels.forEach(({ model, categoryId }) => {
      const cat = result.find(c => c.id === categoryId)
      if (cat && !cat.models.includes(model)) cat.models.unshift(model)
    })
    return result
  }, [customModels])

  const filteredCategories = mergedCategories.map(cat => ({
    ...cat,
    models: modelSearch.trim()
      ? cat.models.filter(m => m.toLowerCase().includes(modelSearch.toLowerCase()))
      : cat.models,
  })).filter(cat => cat.models.length > 0)

  const allFilteredModels = filteredCategories.flatMap(c => c.models)
  const exactMatch = allFilteredModels.some(m => m.toLowerCase() === modelSearch.trim().toLowerCase())
  const canDirectAdd = modelSearch.trim() && !exactMatch

  const pickModel = model => { set('model', model); setModelOpen(false); setModelSearch('') }

  const handleDirectAdd = () => {
    const m = modelSearch.trim()
    if (!m) return
    addCustomModel(m)
    setCustomModels(getCustomModels())
    pickModel(m)
  }

  const handleModelSearchKeyDown = e => {
    if (e.key === 'Enter') {
      if (canDirectAdd) handleDirectAdd()
      else if (allFilteredModels.length === 1) pickModel(allFilteredModels[0])
    }
  }

  return (
    <div className="write-page page-sub">
      <Header
        title={isEdit ? '기록 수정' : '새 작업 기록'}
        showBack={isEdit}
        showHome={isEdit}
      />

      <div className="write-scroll" ref={formRef}>
        <form id="write-form" onSubmit={handleSubmit} noValidate>

          {/* 닉네임 */}
          <div className="form-section">
            <label className="form-label" htmlFor="f-author">
              닉네임
            </label>
            <input
              id="f-author"
              className="form-input"
              type="text"
              placeholder="이름 또는 닉네임 입력"
              value={form.author}
              onChange={e => set('author', e.target.value)}
            />
          </div>

          {/* 모델명 선택 */}
          <div className="form-section">
            <label className="form-label form-required">모델명</label>
            <button
              type="button"
              className={`model-picker-trigger${errors.model ? ' error' : ''}`}
              onClick={() => setModelOpen(true)}
              data-error={errors.model || undefined}
            >
              {form.model
                ? <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{form.model}</span>
                : <span style={{ color: 'var(--text-placeholder)' }}>모델을 선택하세요</span>
              }
              <ChevronIcon />
            </button>
            {errors.model && <p className="field-error">{errors.model}</p>}
          </div>

          {/* 증상 */}
          <div className="form-section">
            <label className="form-label form-required" htmlFor="f-symptoms">증상</label>
            <textarea
              id="f-symptoms"
              className="form-textarea"
              placeholder={`어떤 증상이 발생했나요?\n예: 포크 상승 속도 느림, 엔진 과열 경고등 점등`}
              rows={3}
              value={form.symptoms}
              onChange={e => set('symptoms', e.target.value)}
              data-error={errors.symptoms || undefined}
            />
            {errors.symptoms && <p className="field-error">{errors.symptoms}</p>}
          </div>

          {/* 원인 */}
          <div className="form-section">
            <label className="form-label" htmlFor="f-cause">원인</label>
            <textarea
              id="f-cause"
              className="form-textarea"
              placeholder={`증상의 원인은 무엇인가요?\n예: 유압 오일 누유, 써모스탯 불량`}
              rows={3}
              value={form.cause}
              onChange={e => set('cause', e.target.value)}
            />
          </div>

          {/* 해결방법 */}
          <div className="form-section">
            <label className="form-label form-required" htmlFor="f-solution">해결방법</label>
            <textarea
              id="f-solution"
              className="form-textarea"
              placeholder={`어떻게 해결했나요?\n교체 부품, 작업 내용, 주의사항 등`}
              rows={3}
              value={form.solution}
              onChange={e => set('solution', e.target.value)}
              disabled={form.unresolved}
              data-error={errors.solution || undefined}
              style={form.unresolved ? { opacity: 0.4 } : undefined}
            />
            {errors.solution && <p className="field-error">{errors.solution}</p>}
          </div>

          {/* 미해결 체크박스 */}
          <div className="form-section">
            <label className="unresolved-row">
              <div className={`unresolved-check${form.unresolved ? ' checked' : ''}`}>
                {form.unresolved && <CheckIcon />}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: form.unresolved ? 'var(--danger)' : 'var(--text-primary)' }}>
                  미해결
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  원인·해결방법을 아직 모르는 경우 체크
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.unresolved}
                onChange={e => set('unresolved', e.target.checked)}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* 사진 (최대 5장) */}
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
                <label className="photo-add-label" htmlFor="photo-camera">
                  <CameraIcon />
                  <span>카메라</span>
                  <input id="photo-camera" type="file"
                    accept="image/*" capture="environment"
                    onChange={handlePhotoAdd} style={{ display: 'none' }} />
                </label>
                <label className="photo-add-label" htmlFor="photo-gallery">
                  <GalleryIcon />
                  <span>갤러리</span>
                  <input id="photo-gallery" type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
                    multiple onChange={handlePhotoAdd} style={{ display: 'none' }} />
                </label>
              </>)}
            </div>
          </div>

          <div style={{ height: 12 }} />
          <Disclaimer />
        </form>
      </div>

      <div className="write-footer">
        <button type="submit" form="write-form" className="btn-cta" disabled={saving}>
          {saving
            ? <><Spinner size="sm" white />{form.photos.some(p => p.startsWith('data:')) ? '사진 업로드 중...' : '저장 중...'}</>
            : isEdit ? '✓  수정 완료' : '✓  작성완료'
          }
        </button>
      </div>

      {/* 모델 선택 모달 */}
      {modelOpen && (
        <div className="modal-overlay" onClick={() => { setModelOpen(false); setModelSearch('') }}>
          <div className="model-modal" onClick={e => e.stopPropagation()}>
            <div className="model-modal-header">
              <span className="model-modal-title">모델 선택</span>
              <button className="header-btn" onClick={() => { setModelOpen(false); setModelSearch('') }}>
                <CloseIcon />
              </button>
            </div>
            <div className="model-modal-search">
              <SearchIcon />
              <input
                className="home-search-input"
                type="search"
                placeholder="검색 또는 직접 입력 후 엔터"
                value={modelSearch}
                onChange={e => setModelSearch(e.target.value)}
                onKeyDown={handleModelSearchKeyDown}
                autoFocus
              />
            </div>
            {canDirectAdd && (
              <button className="direct-add-btn" onClick={handleDirectAdd}>
                <PlusSmIcon />
                &ldquo;{modelSearch.trim()}&rdquo; 직접 추가
              </button>
            )}
            <div className="model-modal-body">
              {filteredCategories.map(cat => (
                <div key={cat.id}>
                  <div className="model-cat-header" style={{ '--cat-color': cat.color }}>
                    {cat.label}
                  </div>
                  <div className="model-cat-grid">
                    {cat.models.map(m => (
                      <button
                        key={m}
                        className={`model-grid-btn${form.model === m ? ' selected' : ''}`}
                        style={form.model === m ? { '--cat-color': cat.color } : undefined}
                        onClick={() => pickModel(m)}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {filteredCategories.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 16px' }}>
                  검색 결과 없음
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlusSmIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" width={14} height={14}>
    <path strokeLinecap="round" d="M12 5v14M5 12h14"/>
  </svg>
}
function ChevronIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={18} height={18}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6"/>
  </svg>
}
function CheckIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" width={14} height={14}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
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
function SearchIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={17} height={17}>
    <circle cx="11" cy="11" r="8"/>
    <path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
  </svg>
}
function CloseIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" width={20} height={20}>
    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
  </svg>
}
