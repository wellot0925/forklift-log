import { useState } from 'react'
import { useRecords } from '../hooks/useRecords.jsx'
import { useTheme } from '../hooks/useTheme.jsx'
import { useToast } from '../hooks/useToast.jsx'
import { saveRecords, getRecords } from '../utils/storage.js'

export default function SettingsPage() {
  const { records, remove } = useRecords()
  const { theme, toggle, isDark } = useTheme()
  const { toast } = useToast()
  const [confirmClear, setConfirmClear] = useState(false)

  const handleClearAll = () => {
    records.forEach(r => remove(r.id))
    setConfirmClear(false)
    toast('모든 기록이 삭제되었습니다.', 'info')
  }

  const handleExport = () => {
    try {
      const data = JSON.stringify(records, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = Object.assign(document.createElement('a'), {
        href: url,
        download: `forklift-log-${new Date().toISOString().slice(0,10)}.json`,
      })
      a.click()
      URL.revokeObjectURL(url)
      toast(`${records.length}건 내보내기 완료`, 'success')
    } catch {
      toast('내보내기에 실패했습니다.', 'error')
    }
  }

  const handleImport = e => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target.result)
        if (!Array.isArray(data)) throw new Error()
        // import via storage directly so we avoid duplicates
        const existing = getRecords()
          const existingIds = new Set(existing.map(r => r.id))
          const newItems = data.filter(r => !existingIds.has(r.id))
          saveRecords([...newItems, ...existing])
          window.location.reload()
      } catch {
        toast('파일 형식이 올바르지 않습니다.', 'error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="settings-page page-main">
      {/* Simple header (no back btn — main tab) */}
      <div className="home-header" style={{ paddingBottom: 4 }}>
        <h1 className="home-title">설정</h1>
      </div>

      <div className="settings-content">

        {/* Display */}
        <p className="settings-group-title">화면</p>
        <div className="settings-group">
          <div className="settings-item" onClick={toggle}>
            <div className="settings-item-icon icon-purple"><MoonIcon /></div>
            <div className="settings-item-content">
              <div className="settings-item-title">다크 모드</div>
              <div className="settings-item-subtitle">{isDark ? '어두운 화면' : '밝은 화면'}</div>
            </div>
            <div className="settings-item-right">
              <div className={`toggle${isDark ? ' on' : ''}`}>
                <div className="toggle-thumb" />
              </div>
            </div>
          </div>
        </div>

        {/* Data */}
        <p className="settings-group-title">데이터</p>
        <div className="settings-group">
          <div className="settings-item" onClick={handleExport}>
            <div className="settings-item-icon icon-blue"><DownloadIcon /></div>
            <div className="settings-item-content">
              <div className="settings-item-title">데이터 내보내기</div>
              <div className="settings-item-subtitle">JSON 파일로 저장 ({records.length}건)</div>
            </div>
            <div className="settings-item-right"><ChevronIcon /></div>
          </div>

          <label className="settings-item" htmlFor="import-file" style={{ cursor: 'pointer' }}>
            <div className="settings-item-icon icon-green"><UploadIcon /></div>
            <div className="settings-item-content">
              <div className="settings-item-title">데이터 가져오기</div>
              <div className="settings-item-subtitle">JSON 파일에서 불러오기</div>
            </div>
            <div className="settings-item-right"><ChevronIcon /></div>
            <input id="import-file" type="file" accept=".json" onChange={handleImport}
              style={{ display: 'none' }} />
          </label>

          <div className="settings-item" onClick={() => setConfirmClear(true)}>
            <div className="settings-item-icon icon-red"><TrashIcon /></div>
            <div className="settings-item-content">
              <div className="settings-item-title" style={{ color: 'var(--danger)' }}>전체 기록 삭제</div>
              <div className="settings-item-subtitle">모든 정비 기록을 삭제합니다</div>
            </div>
            <div className="settings-item-right"><ChevronIcon /></div>
          </div>
        </div>

        {/* Info */}
        <p className="settings-group-title">앱 정보</p>
        <div className="settings-group">
          <div className="settings-item" style={{ cursor: 'default' }}>
            <div className="settings-item-icon icon-orange"><InfoIcon /></div>
            <div className="settings-item-content">
              <div className="settings-item-title">지게차 작업일지</div>
              <div className="settings-item-subtitle">두산 지게차 정비 기록 관리</div>
            </div>
            <div className="settings-item-right">
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>v1.0.0</span>
            </div>
          </div>
          <div className="settings-item" style={{ cursor: 'default' }}>
            <div className="settings-item-icon icon-gray"><StorageIcon /></div>
            <div className="settings-item-content">
              <div className="settings-item-title">저장 방식</div>
              <div className="settings-item-subtitle">로컬 저장소 (오프라인 지원)</div>
            </div>
          </div>
        </div>

        <p className="app-version">용인중공업 • 2025</p>
      </div>

      {/* Confirm delete all */}
      {confirmClear && (
        <div className="confirm-overlay" onClick={() => setConfirmClear(false)}>
          <div className="confirm-sheet" onClick={e => e.stopPropagation()}>
            <p className="confirm-title">전체 삭제</p>
            <p className="confirm-subtitle">
              {records.length}건의 기록을 모두 삭제합니다.<br/>
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmClear(false)}>취소</button>
              <button className="btn btn-danger" onClick={handleClearAll}>
                <TrashSmIcon /> 전체 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const ico = (d, extra='') => (
  <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
    width={18} height={18} color="white">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    {extra && <path strokeLinecap="round" strokeLinejoin="round" d={extra} />}
  </svg>
)

function MoonIcon()     { return ico("M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z") }
function DownloadIcon() { return ico("M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4") }
function UploadIcon()   { return ico("M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12") }
function TrashIcon()    { return ico("M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16") }
function TrashSmIcon()  {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={18} height={18}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
  </svg>
}
function InfoIcon()     { return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={18} height={18} color="white"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 16v-4m0-4h.01"/></svg> }
function StorageIcon()  { return ico("M5 12H3a9 9 0 0018 0h-2M5 12a7 7 0 0014 0M5 12a7 7 0 0114 0") }
function ChevronIcon()  {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={16} height={16}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6"/>
  </svg>
}
