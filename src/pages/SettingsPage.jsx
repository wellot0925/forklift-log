import { useState } from 'react'
import { useRecords } from '../hooks/useRecords.jsx'
import { useTheme } from '../hooks/useTheme.jsx'
import { useToast } from '../hooks/useToast.jsx'
import { getAuthor, saveAuthor } from '../utils/storage.js'
import { useAdminSettings } from '../hooks/useAdminSettings.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import { useUsers } from '../hooks/useUsers.jsx'
import { printAllRecords } from '../utils/pdf.js'
import Disclaimer from '../components/Disclaimer.jsx'
import Spinner from '../components/Spinner.jsx'

const miniBtn = {
  padding: '6px 12px', borderRadius: 8, border: 'none',
  fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
}

export default function SettingsPage() {
  const { records } = useRecords()
  const { toggle, isDark } = useTheme()
  const { toast } = useToast()
  const { password: adminPassword, changePassword } = useAdminSettings()
  const { profile, logout } = useAuth()
  const { isAdmin, pendingUsers, approvedUsers, approve, reject, promote } = useUsers()
  const [authorName, setAuthorName] = useState(getAuthor)
  const [printing, setPrinting] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [newPw2, setNewPw2] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [userActionId, setUserActionId] = useState(null)

  const handleApprove = async uid => {
    setUserActionId(uid)
    try { await approve(uid); toast('가입을 승인했습니다.', 'success') }
    catch (err) { console.error('Approve error:', err); toast('승인에 실패했습니다.', 'error') }
    finally { setUserActionId(null) }
  }
  const handleReject = async uid => {
    setUserActionId(uid)
    try { await reject(uid); toast('가입을 거절했습니다.', 'info') }
    catch (err) { console.error('Reject error:', err); toast('거절에 실패했습니다.', 'error') }
    finally { setUserActionId(null) }
  }
  const handlePromote = async uid => {
    setUserActionId(uid)
    try { await promote(uid); toast('관리자로 지정했습니다.', 'success') }
    catch (err) { console.error('Promote error:', err); toast('관리자 지정에 실패했습니다.', 'error') }
    finally { setUserActionId(null) }
  }

  const handlePwChange = async () => {
    if (curPw !== adminPassword) { setPwErr('현재 비밀번호가 틀렸습니다.'); return }
    if (newPw.length < 4) { setPwErr('새 비밀번호는 4자리 이상이어야 합니다.'); return }
    if (newPw !== newPw2) { setPwErr('새 비밀번호가 일치하지 않습니다.'); return }
    setPwSaving(true)
    try {
      await changePassword(newPw)
      toast('비밀번호가 변경되었습니다.', 'success')
      setPwOpen(false); setCurPw(''); setNewPw(''); setNewPw2(''); setPwErr('')
    } catch (err) {
      console.error('Admin password change error:', err)
      setPwErr('비밀번호 변경에 실패했습니다. 네트워크를 확인해주세요.')
    } finally {
      setPwSaving(false)
    }
  }

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

        {/* 관리자 */}
        <p className="settings-group-title">관리자</p>
        <div className="settings-group">
          <div
            className="settings-item"
            style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'stretch', gap: 0 }}
            onClick={() => { setPwOpen(o => !o); setPwErr('') }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="settings-item-icon icon-red"><LockIcon /></div>
              <div className="settings-item-content">
                <div className="settings-item-title">관리자 비밀번호 변경</div>
                <div className="settings-item-subtitle">삭제 기능 잠금 비밀번호</div>
              </div>
              <div className="settings-item-right">
                <ChevronIcon style={{ transform: pwOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
              </div>
            </div>
            {pwOpen && (
              <div style={{ marginTop: 14, marginLeft: 50, display: 'flex', flexDirection: 'column', gap: 8 }}
                onClick={e => e.stopPropagation()}>
                <input
                  type="password" placeholder="현재 비밀번호"
                  value={curPw} autoFocus
                  onChange={e => { setCurPw(e.target.value); setPwErr('') }}
                  className="form-input" style={{ margin: 0 }}
                />
                <input
                  type="password" placeholder="새 비밀번호"
                  value={newPw}
                  onChange={e => { setNewPw(e.target.value); setPwErr('') }}
                  className="form-input" style={{ margin: 0 }}
                />
                <input
                  type="password" placeholder="새 비밀번호 확인"
                  value={newPw2}
                  onChange={e => { setNewPw2(e.target.value); setPwErr('') }}
                  onKeyDown={e => e.key === 'Enter' && handlePwChange()}
                  className="form-input" style={{ margin: 0 }}
                />
                {pwErr && <p style={{ margin: 0, fontSize: 12, color: 'var(--danger)' }}>{pwErr}</p>}
                <button
                  onClick={handlePwChange}
                  disabled={pwSaving}
                  className="btn-cta" style={{ marginTop: 4, opacity: pwSaving ? 0.6 : 1 }}
                >
                  {pwSaving ? <Spinner size="sm" white /> : '비밀번호 변경'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 승인 대기 (관리자 전용) */}
        {isAdmin && (
          <>
            <p className="settings-group-title">
              승인 대기{pendingUsers.length > 0 ? ` (${pendingUsers.length})` : ''}
            </p>
            <div className="settings-group">
              {pendingUsers.length === 0 ? (
                <div className="settings-item" style={{ cursor: 'default' }}>
                  <div className="settings-item-content">
                    <div className="settings-item-subtitle">대기 중인 가입 신청이 없습니다.</div>
                  </div>
                </div>
              ) : pendingUsers.map(u => (
                <div key={u.id} className="settings-item" style={{ cursor: 'default' }}>
                  <div className="settings-item-icon icon-purple"><PersonIcon /></div>
                  <div className="settings-item-content">
                    <div className="settings-item-title">{u.name}</div>
                    <div className="settings-item-subtitle">@{u.username}</div>
                  </div>
                  <div className="settings-item-right" style={{ gap: 6 }}>
                    <button
                      style={{ ...miniBtn, background: 'var(--success)', color: '#fff', opacity: userActionId === u.id ? 0.6 : 1 }}
                      disabled={userActionId === u.id}
                      onClick={() => handleApprove(u.id)}
                    >승인</button>
                    <button
                      style={{ ...miniBtn, background: 'var(--danger-dim)', color: 'var(--danger)', opacity: userActionId === u.id ? 0.6 : 1 }}
                      disabled={userActionId === u.id}
                      onClick={() => handleReject(u.id)}
                    >거절</button>
                  </div>
                </div>
              ))}
            </div>

            <p className="settings-group-title">승인된 사용자</p>
            <div className="settings-group">
              {approvedUsers.length === 0 ? (
                <div className="settings-item" style={{ cursor: 'default' }}>
                  <div className="settings-item-content">
                    <div className="settings-item-subtitle">승인된 사용자가 없습니다.</div>
                  </div>
                </div>
              ) : approvedUsers.map(u => (
                <div key={u.id} className="settings-item" style={{ cursor: 'default' }}>
                  <div className={`settings-item-icon ${u.role === 'admin' ? 'icon-red' : 'icon-blue'}`}><PersonIcon /></div>
                  <div className="settings-item-content">
                    <div className="settings-item-title">
                      {u.name}
                      {u.role === 'admin' && (
                        <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, color: 'var(--danger)' }}>관리자</span>
                      )}
                    </div>
                    <div className="settings-item-subtitle">@{u.username}</div>
                  </div>
                  {u.role !== 'admin' && (
                    <div className="settings-item-right">
                      <button
                        style={{ ...miniBtn, background: 'var(--bg-input)', color: 'var(--text-primary)', opacity: userActionId === u.id ? 0.6 : 1 }}
                        disabled={userActionId === u.id}
                        onClick={() => handlePromote(u.id)}
                      >관리자로 지정</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

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

        {/* 계정 */}
        <p className="settings-group-title">계정</p>
        <div className="settings-group">
          <div className="settings-item" style={{ cursor: 'default' }}>
            <div className="settings-item-icon icon-gray"><PersonIcon /></div>
            <div className="settings-item-content">
              <div className="settings-item-title">{profile?.name}</div>
              <div className="settings-item-subtitle">@{profile?.username}{isAdmin ? ' · 관리자' : ''}</div>
            </div>
          </div>
          <div className="settings-item" onClick={logout}>
            <div className="settings-item-icon icon-red"><LogoutIcon /></div>
            <div className="settings-item-content">
              <div className="settings-item-title">로그아웃</div>
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
function LockIcon()     { return ico("M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z") }
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
function LogoutIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={18} height={18} color="white">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 5v1a3 3 0 01-3 3H6a3 3 0 01-3-3V6a3 3 0 013-3h4a3 3 0 013 3v1"/>
  </svg>
}
