import { useState } from 'react'
import { useAuth, isUsernameTaken } from '../hooks/useAuth.jsx'
import { useToast } from '../hooks/useToast.jsx'
import Spinner from '../components/Spinner.jsx'

export default function SignupPage({ onSwitchToLogin }) {
  const { signup } = useAuth()
  const { toast } = useToast()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  // null | 'checking' | 'available' | 'taken'
  const [usernameCheck, setUsernameCheck] = useState(null)

  const passwordMismatch = passwordConfirm.length > 0 && password !== passwordConfirm

  const handleUsernameBlur = async () => {
    const u = username.trim().toLowerCase()
    if (u.length < 3) return
    setUsernameCheck('checking')
    try {
      const taken = await isUsernameTaken(u)
      setUsernameCheck(taken ? 'taken' : 'available')
    } catch (err) {
      console.error('Username availability check failed:', err)
      setUsernameCheck(null)
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (username.trim().length < 3) { setError('아이디는 3자 이상 입력해주세요.'); return }
    if (usernameCheck === 'taken') { setError('이미 사용 중인 아이디입니다.'); return }
    if (password.length < 6) { setError('비밀번호는 6자 이상 입력해주세요.'); return }
    if (password !== passwordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return }
    if (!name.trim()) { setError('이름을 입력해주세요.'); return }

    setLoading(true)
    setError('')
    try {
      await signup(username, password, name)
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
            autoComplete="username" placeholder="3자 이상"
            value={username}
            onChange={e => { setUsername(e.target.value); setUsernameCheck(null); setError('') }}
            onBlur={handleUsernameBlur}
          />
          {usernameCheck === 'checking' && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 5 }}>확인 중...</p>
          )}
          {usernameCheck === 'taken' && (
            <p className="field-error">이미 사용 중인 아이디입니다.</p>
          )}
          {usernameCheck === 'available' && (
            <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 5, fontWeight: 600 }}>사용 가능한 아이디입니다.</p>
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
        <button type="submit" className="btn-cta" disabled={loading || passwordMismatch || usernameCheck === 'taken'} style={{ marginTop: 4 }}>
          {loading ? <Spinner size="sm" white /> : '가입하기'}
        </button>
      </form>

      <button type="button" className="auth-switch-link" onClick={onSwitchToLogin}>
        이미 계정이 있으신가요? <span>로그인</span>
      </button>
    </div>
  )
}
