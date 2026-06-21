import { useState } from 'react'
import { useRecords } from '../hooks/useRecords.jsx'
import { useTheme } from '../hooks/useTheme.jsx'
import { useToast } from '../hooks/useToast.jsx'
import { getAuthor, saveAuthor } from '../utils/storage.js'
import { printAllRecords } from '../utils/pdf.js'
import Disclaimer from '../components/Disclaimer.jsx'
import Spinner from '../components/Spinner.jsx'

export default function SettingsPage() {
  const { records } = useRecords()
  const { toggle, isDark } = useTheme()
  const { toast } = useToast()
  const [authorName, setAuthorName] = useState(getAuthor)
  const [printing, setPrinting] = useState(false)

  const handlePrintAll = () => {
    if (!records.length) { toast('저장된 기록이 없습니다.', 'info'); return }
    setPrinting(true)
    try { printAllRecords(records) } finally { setTimeout(() => setPrinting(false), 1000) }
  }

  return (
    <div className="settings-page page-main">
      <div className="home-header" style={{ paddingBottom: 4 }}>
        <h1 className="home-title">설정</h1>
      </div>

      <div className="settings-content">

        {/* 닉네임 */}
        <p className="settings-group-title">닉네임</p>
        <div className="settings-group">
          <div className="settings-item" style={{ cursor: 'default', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="settings-item-icon icon-purple"><PersonIcon /></div>
              <div className="settings-item-content">
                <div className="settings-item-title">닉네임</div>
                <div className="settings-item-subtitle">기록 작성 시 자동 입력됩니다</div>
              </div>
            </div>
            <input
              className="form-input"
              style={{ marginLeft: 50 }}
              placeholder="이름 또는 닉네임 입력"
              value={authorName}
              onChange={e => setAuthorName(e.target.value)}
              onBlur={() => saveAuthor(authorName)}
            />
          </div>
        </div>

        {/* 화면 */}
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

        {/* 백업 */}
        <p className="settings-group-title">백업</p>
        <div className="settings-group">
          <div className="settings-item" onClick={handlePrintAll} style={{ opacity: printing ? 0.6 : 1 }}>
            <div className="settings-item-icon icon-orange"><PrintIcon /></div>
            <div className="settings-item-content">
              <div className="settings-item-title">전체 백업 다운로드</div>
              <div className="settings-item-subtitle">작업일지 전체를 PDF로 저장 ({records.length}건)</div>
            </div>
            <div className="settings-item-right">
              {printing ? <Spinner size="sm" /> : <ChevronIcon />}
            </div>
          </div>
        </div>

        {/* 앱 정보 */}
        <p className="settings-group-title">앱 정보</p>
        <div className="settings-group">
          <div className="settings-item" style={{ cursor: 'default' }}>
            <div className="settings-item-icon icon-orange"><InfoIcon /></div>
            <div className="settings-item-content">
              <div className="settings-item-title">나만의 정비수첩</div>
              <div className="settings-item-subtitle">두산 지게차 정비 기록 관리</div>
            </div>
            <div className="settings-item-right">
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>v2.0.0</span>
            </div>
          </div>
          <div className="settings-item" style={{ cursor: 'default' }}>
            <div className="settings-item-icon icon-gray"><CloudIcon /></div>
            <div className="settings-item-content">
              <div className="settings-item-title">저장 방식</div>
              <div className="settings-item-subtitle">Firebase 실시간 동기화 (다기기 지원)</div>
            </div>
          </div>
        </div>

        <p className="app-version">용인중공업 • 2025</p>
        <Disclaimer />
      </div>

    </div>
  )
}

const ico = (d, extra='') => (
  <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={18} height={18} color="white">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    {extra && <path strokeLinecap="round" strokeLinejoin="round" d={extra} />}
  </svg>
)

function PersonIcon()   { return ico("M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z") }
function MoonIcon()     { return ico("M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z") }
function PrintIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={18} height={18} color="white">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
  </svg>
}
function InfoIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={18} height={18} color="white">
    <circle cx="12" cy="12" r="10"/>
    <path strokeLinecap="round" d="M12 16v-4m0-4h.01"/>
  </svg>
}
function CloudIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={18} height={18} color="white">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/>
  </svg>
}
function ChevronIcon()  {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={16} height={16}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6"/>
  </svg>
}
