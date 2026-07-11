import { useState } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { auth, db } from '../firebase.js'
import { EMAIL_DOMAIN } from '../hooks/useAuth.jsx'
import Spinner from '../components/Spinner.jsx'

export default function ForgotPasswordPage({ onBack }) {
  const [username, setUsername] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sentToEmail, setSentToEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    if (!username.trim()) { setError('아이디를 입력해주세요.'); return }
    setError('')
    setSubmitting(true)
    try {
      const normalized = username.trim().toLowerCase()
      const snap = await getDocs(query(collection(db, 'users'), where('username', '==', normalized), limit(1)))
      if (snap.empty) {
        setError('등록되지 않은 아이디입니다.')
        return
      }
      const email = snap.docs[0].data().email
      if (!email || email.endsWith(`@${EMAIL_DOMAIN}`)) {
        setError('등록된 이메일이 없습니다. 관리자에게 문의해주세요.')
        return
      }
      await sendPasswordResetEmail(auth, email)
      setSentToEmail(email)
    } catch (err) {
      console.error('Password reset request failed:', err)
      setError('요청 처리에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <img src="/bobcat-icon.png.webp" alt="Bobcat 아이콘" className="auth-brand-icon" />
        <h1 className="auth-brand-title">비밀번호 재설정</h1>
        <p className="auth-brand-subtitle">
          {sentToEmail
            ? `${sentToEmail}로 재설정 메일을 보냈습니다. 메일함에서 링크를 눌러 새 비밀번호를 설정해주세요.`
            : '가입 시 등록한 아이디를 입력하면, 등록된 이메일로 재설정 링크를 보내드립니다.'}
        </p>
      </div>

      {!sentToEmail && (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-section">
            <label className="form-label" htmlFor="forgot-username">아이디</label>
            <input
              id="forgot-username" className="form-input" type="text"
              autoComplete="username" placeholder="아이디 입력"
              value={username} onChange={e => { setUsername(e.target.value); setError('') }}
            />
          </div>
          {error && <p className="field-error" style={{ textAlign: 'center', marginBottom: 8 }}>{error}</p>}
          <button type="submit" className="btn-cta" disabled={submitting} style={{ marginTop: 4 }}>
            {submitting ? <Spinner size="sm" white /> : '재설정 메일 보내기'}
          </button>
        </form>
      )}

      <button type="button" className="auth-switch-link" onClick={onBack}>
        로그인으로 돌아가기
      </button>
    </div>
  )
}
