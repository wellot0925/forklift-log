import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { useToast } from '../hooks/useToast.jsx'
import Spinner from '../components/Spinner.jsx'

export default function MyInfoPage() {
  const nav = useNavigate()
  const { profile, changeName, registerRecoveryEmail, hasRecoveryEmail } = useAuth()
  const { toast } = useToast()

  const [name, setName] = useState(profile?.name ?? '')
  const [nameErr, setNameErr] = useState('')
  const [nameSaving, setNameSaving] = useState(false)

  const [emailCurPw, setEmailCurPw] = useState('')
  const [emailNew, setEmailNew] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailSent, setEmailSent] = useState('')

  const handleNameChange = async () => {
    if (!name.trim()) { setNameErr('이름을 입력해주세요.'); return }
    if (name.trim() === profile?.name) { setNameErr('현재 이름과 동일합니다.'); return }
    setNameSaving(true)
    try {
      await changeName(name)
      toast('이름이 변경되었습니다.', 'success')
      setNameErr('')
    } catch (err) {
      setNameErr(err.message)
    } finally {
      setNameSaving(false)
    }
  }

  const handleEmailChange = async () => {
    if (!emailNew.trim()) { setEmailErr('이메일을 입력해주세요.'); return }
    setEmailSaving(true)
    try {
      await registerRecoveryEmail(emailCurPw, emailNew.trim())
      setEmailSent(emailNew.trim())
      toast('인증 메일을 보냈습니다.', 'success')
    } catch (err) {
      setEmailErr(err.message)
    } finally {
      setEmailSaving(false)
    }
  }

  return (
    <div className="settings-page page-main">
      <div className="home-header" style={{ paddingBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button" onClick={() => nav('/settings')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
            aria-label="뒤로가기"
          >
            <ChevronLeftIcon />
          </button>
          <h1 className="home-title">내 정보 수정</h1>
        </div>
      </div>

      <div className="settings-content">
        {/* 현재 정보 */}
        <p className="settings-group-title">계정 정보</p>
        <div className="settings-group">
          <div className="settings-item" style={{ cursor: 'default' }}>
            <div className="settings-item-content">
              <div className="settings-item-title">아이디</div>
              <div className="settings-item-subtitle">@{profile?.username} (변경 불가)</div>
            </div>
          </div>
          <div className="settings-item" style={{ cursor: 'default' }}>
            <div className="settings-item-content">
              <div className="settings-item-title">현재 이메일</div>
              <div className="settings-item-subtitle">
                {hasRecoveryEmail ? profile.email : '등록된 이메일이 없습니다'}
              </div>
            </div>
          </div>
        </div>

        {/* 이름 변경 */}
        <p className="settings-group-title">이름 변경</p>
        <div className="settings-group">
          <div className="settings-item" style={{ cursor: 'default', flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <input
              type="text" placeholder="이름"
              value={name}
              onChange={e => { setName(e.target.value); setNameErr('') }}
              onKeyDown={e => e.key === 'Enter' && handleNameChange()}
              className="form-input" style={{ margin: 0 }}
            />
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
              정비일지 작성자명(닉네임)은 설정 화면에서 별도로 관리됩니다.
            </p>
            {nameErr && <p style={{ margin: 0, fontSize: 12, color: 'var(--danger)' }}>{nameErr}</p>}
            <button
              onClick={handleNameChange}
              disabled={nameSaving}
              className="btn-cta" style={{ marginTop: 4, opacity: nameSaving ? 0.6 : 1 }}
            >
              {nameSaving ? <Spinner size="sm" white /> : '이름 변경'}
            </button>
          </div>
        </div>

        {/* 이메일 변경 */}
        <p className="settings-group-title">이메일 변경</p>
        <div className="settings-group">
          <div className="settings-item" style={{ cursor: 'default', flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            {emailSent ? (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {emailSent}로 인증 메일을 보냈습니다. 메일함에서 링크를 확인해야 실제로 반영됩니다.
              </p>
            ) : (
              <>
                <input
                  type="password" placeholder="현재 비밀번호"
                  value={emailCurPw}
                  onChange={e => { setEmailCurPw(e.target.value); setEmailErr('') }}
                  className="form-input" style={{ margin: 0 }}
                />
                <input
                  type="email" placeholder="새 이메일"
                  value={emailNew}
                  onChange={e => { setEmailNew(e.target.value); setEmailErr('') }}
                  onKeyDown={e => e.key === 'Enter' && handleEmailChange()}
                  className="form-input" style={{ margin: 0 }}
                />
                {emailErr && <p style={{ margin: 0, fontSize: 12, color: 'var(--danger)' }}>{emailErr}</p>}
                <button
                  onClick={handleEmailChange}
                  disabled={emailSaving}
                  className="btn-cta" style={{ marginTop: 4, opacity: emailSaving ? 0.6 : 1 }}
                >
                  {emailSaving ? <Spinner size="sm" white /> : '인증 메일 보내기'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ChevronLeftIcon() {
  return <svg fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" width={22} height={22}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
  </svg>
}
