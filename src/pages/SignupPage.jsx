import { useState } from 'react'
import { useAuth, isUsernameTaken, isEmailTaken } from '../hooks/useAuth.jsx'
import { useToast } from '../hooks/useToast.jsx'
import Spinner from '../components/Spinner.jsx'

// 로그인 로직이 "@"가 포함된 입력을 이메일로 취급하므로, 아이디에 "@" 등 특수문자가
// 들어가면 그 계정은 아이디로 영원히 로그인할 수 없게 된다 — 영문 소문자/숫자만 허용.
const USERNAME_REGEX = /^[a-z0-9]{3,20}$/

export default function SignupPage({ onSwitchToLogin }) {
  const { signup } = useAuth()
  const { toast } = useToast()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  // null | 'checking' | 'available' | 'taken'
  const [usernameCheck, setUsernameCheck] = useState(null)
  const [emailCheck, setEmailCheck] = useState(null)

  const passwordMismatch = passwordConfirm.length > 0 && password !== passwordConfirm
  const usernameFormatInvalid = username.length > 0 && !USERNAME_REGEX.test(username.trim().toLowerCase())

  const handleUsernameBlur = async () => {
    const u = username.trim().toLowerCase()
    if (!USERNAME_REGEX.test(u)) return
    setUsernameCheck('checking')
    try {
      const taken = await isUsernameTaken(u)
      setUsernameCheck(taken ? 'taken' : 'available')
    } catch (err) {
      console.error('Username availability check failed:', err)
      setUsernameCheck(null)
    }
  }

  const handleEmailBlur = async () => {
    const e = email.trim().toLowerCase()
    if (!e.includes('@')) return
    setEmailCheck('checking')
    try {
      const taken = await isEmailTaken(e)
      setEmailCheck(taken ? 'taken' : 'available')
    } catch (err) {
      console.error('Email availability check failed:', err)
      setEmailCheck(null)
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!USERNAME_REGEX.test(username.trim().toLowerCase())) {
      setError('아이디는 영문 소문자와 숫자만 사용할 수 있습니다 (3~20자).')
      return
    }
    if (usernameCheck === 'taken') { setError('이미 사용 중인 아이디입니다.'); return }
    if (!email.trim().includes('@')) { setError('올바른 이메일을 입력해주세요.'); return }
    if (emailCheck === 'taken') { setError('이미 사용 중인 이메일입니다.'); return }
    if (password.length < 6) { setError('비밀번호는 6자 이상 입력해주세요.'); return }
    if (password !== passwordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return }
    if (!name.trim()) { setError('이름을 입력해주세요.'); return }

    setLoading(true)
    setError('')
    try {
      await signup(username, password, name, email)
      // 가입 성공 시 자동 로그인됨 — App의 인증 게이트가 승인대기 화면으로 자연스럽게 전환
    } catch (err) {
      // signup() 도중 Auth 계정이 생기는 순간 화면이 로딩 화면으로 전환되며 이 페이지가
      // 언마운트될 수 있어, 로컬 에러 표시만으론 못 볼 수 있으므로 토스트로도 함께 알림
      setError(err.message)
      toast(err.message, 'error')
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <img src="/bobcat-icon.png.webp" alt="Bobcat 아이콘" className="auth-brand-icon" />
        <h1 className="auth-brand-title">회원가입</h1>
        <p className="auth-brand-subtitle">용인중공업 나만의 정비수첩</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="form-section">
          <label className="form-label" htmlFor="signup-username">아이디</label>
          <input
            id="signup-username" className="form-input" type="text"
            autoComplete="username" placeholder="영문 소문자, 숫자 3~20자"
            value={username}
            onChange={e => { setUsername(e.target.value); setUsernameCheck(null); setError('') }}
            onBlur={handleUsernameBlur}
          />
          {usernameFormatInvalid ? (
            <p className="field-error">영문 소문자와 숫자만 사용할 수 있습니다 (3~20자).</p>
          ) : (
            <>
              {usernameCheck === 'checking' && (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 5 }}>확인 중...</p>
              )}
              {usernameCheck === 'taken' && (
                <p className="field-error">이미 사용 중인 아이디입니다.</p>
              )}
              {usernameCheck === 'available' && (
                <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 5, fontWeight: 600 }}>사용 가능한 아이디입니다.</p>
              )}
            </>
          )}
        </div>
        <div className="form-section">
          <label className="form-label" htmlFor="signup-email">이메일</label>
          <input
            id="signup-email" className="form-input" type="email"
            autoComplete="email" placeholder="비밀번호 찾기에 사용됩니다" required
            value={email}
            onChange={e => { setEmail(e.target.value); setEmailCheck(null); setError('') }}
            onBlur={handleEmailBlur}
          />
          {emailCheck === 'checking' && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 5 }}>확인 중...</p>
          )}
          {emailCheck === 'taken' && (
            <p className="field-error">이미 사용 중인 이메일입니다.</p>
          )}
          {emailCheck === 'available' && (
            <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 5, fontWeight: 600 }}>사용 가능한 이메일입니다.</p>
          )}
        </div>
        <div className="form-section">
          <label className="form-label" htmlFor="signup-password">비밀번호</label>
          <input
            id="signup-password" className="form-input" type="password"
            autoComplete="new-password" placeholder="6자 이상"
            value={password} onChange={e => { setPassword(e.target.value); setError('') }}
          />
        </div>
        <div className="form-section">
          <label className="form-label" htmlFor="signup-password-confirm">비밀번호 확인</label>
          <input
            id="signup-password-confirm" className="form-input" type="password"
            autoComplete="new-password" placeholder="비밀번호 다시 입력"
            value={passwordConfirm} onChange={e => { setPasswordConfirm(e.target.value); setError('') }}
          />
          {passwordMismatch && <p className="field-error">비밀번호가 일치하지 않습니다.</p>}
        </div>
        <div className="form-section">
          <label className="form-label" htmlFor="signup-name">이름</label>
          <input
            id="signup-name" className="form-input" type="text"
            autoComplete="name" placeholder="이름 또는 닉네임"
            value={name} onChange={e => { setName(e.target.value); setError('') }}
          />
        </div>
        {error && <p className="field-error" style={{ textAlign: 'center', marginBottom: 8 }}>{error}</p>}
        <button type="submit" className="btn-cta" disabled={loading || passwordMismatch || usernameFormatInvalid || usernameCheck === 'taken' || emailCheck === 'taken'} style={{ marginTop: 4 }}>
          {loading ? <Spinner size="sm" white /> : '가입하기'}
        </button>
      </form>

      <button type="button" className="auth-switch-link" onClick={onSwitchToLogin}>
        이미 계정이 있으신가요? <span>로그인</span>
      </button>
    </div>
  )
}
