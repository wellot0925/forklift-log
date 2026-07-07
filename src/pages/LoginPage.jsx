import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { getSavedUsername, saveUsername, clearSavedUsername } from '../utils/storage.js'
import Spinner from '../components/Spinner.jsx'

export default function LoginPage({ onSwitchToSignup }) {
  const { login } = useAuth()
  const [username, setUsername] = useState(getSavedUsername)
  const [password, setPassword] = useState('')
  const [rememberUsername, setRememberUsername] = useState(() => Boolean(getSavedUsername()))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('아이디와 비밀번호를 입력해주세요.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(username, password)
      if (rememberUsername) saveUsername(username.trim().toLowerCase())
      else clearSavedUsername()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <img src="/bobcat-icon.png.webp" alt="Bobcat 아이콘" className="auth-brand-icon" />
        <h1 className="auth-brand-title">나만의 정비수첩</h1>
        <p className="auth-brand-subtitle">용인중공업</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="form-section">
          <label className="form-label" htmlFor="login-username">아이디</label>
          <input
            id="login-username" className="form-input" type="text"
            autoComplete="username" placeholder="아이디 입력"
            value={username} onChange={e => { setUsername(e.target.value); setError('') }}
          />
        </div>
        <div className="form-section">
          <label className="form-label" htmlFor="login-password">비밀번호</label>
          <input
            id="login-password" className="form-input" type="password"
            autoComplete="current-password" placeholder="비밀번호 입력"
            value={password} onChange={e => { setPassword(e.target.value); setError('') }}
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, cursor: 'pointer' }}>
          <input
            type="checkbox" checked={rememberUsername}
            onChange={e => setRememberUsername(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          아이디 저장
        </label>
        {error && <p className="field-error" style={{ textAlign: 'center', marginBottom: 8 }}>{error}</p>}
        <button type="submit" className="btn-cta" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? <Spinner size="sm" white /> : '로그인'}
        </button>
      </form>

      <button type="button" className="auth-switch-link" onClick={onSwitchToSignup}>
        계정이 없으신가요? <span>회원가입</span>
      </button>
    </div>
  )
}
