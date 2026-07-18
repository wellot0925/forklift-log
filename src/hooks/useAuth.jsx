import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, updateProfile, deleteUser,
  EmailAuthProvider, reauthenticateWithCredential, updatePassword, verifyBeforeUpdateEmail,
} from 'firebase/auth'
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp,
  collection, query, where, limit, getDocs,
} from 'firebase/firestore'
import { auth, db } from '../firebase.js'

const Ctx = createContext(null)

// Firebase Auth는 이메일 형식만 받으므로, 아이디를 내부용 가짜 이메일로 변환해서 사용
export const EMAIL_DOMAIN = 'forklift-log.internal'
const toEmail = username => `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`
const isFakeEmail = email => !email || email.endsWith(`@${EMAIL_DOMAIN}`)

function authErrorMessage(err) {
  switch (err.code) {
    case 'auth/email-already-in-use': return '이미 사용 중인 아이디입니다.'
    case 'auth/invalid-email':
    case 'auth/missing-password': return '아이디와 비밀번호를 확인해주세요.'
    case 'auth/weak-password': return '비밀번호는 6자 이상이어야 합니다.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return '아이디 또는 비밀번호가 올바르지 않습니다.'
    case 'auth/too-many-requests': return '너무 많이 시도했습니다. 잠시 후 다시 시도해주세요.'
    default: return '오류가 발생했습니다. 네트워크를 확인해주세요.'
  }
}

// Firestore users 컬렉션 기준 아이디 중복 여부 확인 (회원가입 전 사전 체크, SignupPage 실시간 체크에서도 재사용)
export async function isUsernameTaken(username) {
  const q = query(collection(db, 'users'), where('username', '==', username), limit(1))
  const snap = await getDocs(q)
  return !snap.empty
}

// Firestore users 컬렉션 기준 이메일 중복 여부 확인 (신규 가입은 실제 이메일로 Auth 계정을 만들므로 사전 체크 필요)
export async function isEmailTaken(email) {
  const q = query(collection(db, 'users'), where('email', '==', email), limit(1))
  const snap = await getDocs(q)
  return !snap.empty
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (u) {
        // verifyBeforeUpdateEmail은 인증 메일의 링크를 눌러야만 실제 이메일이 바뀐다.
        // reload()로 다른 기기/탭에서 그 사이 인증을 마쳤는지 최신 상태를 반영한다.
        await u.reload()
      }
      setUser(auth.currentUser)
      setAuthLoading(false)
      if (!auth.currentUser) setProfile(null)
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!user) return
    setProfileLoading(true)
    const unsub = onSnapshot(doc(db, 'users', user.uid), snap => {
      const data = snap.exists() ? snap.data() : null
      setProfile(data)
      setProfileLoading(false)
      // 자가치유: 인증 메일 링크 클릭으로 실제 Auth 이메일이 바뀌었는데
      // Firestore의 email 필드가 아직 그 값을 안 따라왔다면 동기화한다.
      if (data && !isFakeEmail(user.email) && data.email !== user.email) {
        updateDoc(doc(db, 'users', user.uid), { email: user.email })
          .catch(err => console.error('Email self-heal sync failed:', err))
      }
    }, err => {
      console.error('Firestore user profile error:', err)
      setProfileLoading(false)
    })
    return unsub
  }, [user])

  // 신규 가입은 처음부터 실제 이메일로 Auth 계정을 생성한다(가짜 이메일 미사용).
  // 가짜 이메일 방식(toEmail)은 이전에 가입한 기존 계정의 로그인 폴백 용도로만 남아있다.
  const signup = useCallback(async (username, password, name, email) => {
    const normalizedUsername = username.trim().toLowerCase()
    const normalizedEmail = email.trim().toLowerCase()

    // 1) Firestore users 컬렉션 기준 아이디/이메일 중복 사전 체크
    let usernameTaken, emailTaken
    try {
      [usernameTaken, emailTaken] = await Promise.all([
        isUsernameTaken(normalizedUsername),
        isEmailTaken(normalizedEmail),
      ])
    } catch (err) {
      console.error('Username/email availability check failed:', err)
      throw new Error('아이디/이메일 확인 중 오류가 발생했습니다. 네트워크를 확인해주세요.')
    }
    if (usernameTaken) throw new Error('이미 사용 중인 아이디입니다.')
    if (emailTaken) throw new Error('이미 사용 중인 이메일입니다.')

    // 2) Auth 계정 생성
    let cred
    try {
      cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password)
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('이미 사용 중인 이메일입니다.')
      }
      throw new Error(authErrorMessage(err))
    }

    // 3) 프로필 저장 — 실패하면 방금 만든 Auth 계정을 롤백해서 유령 계정이 남지 않게 함
    try {
      await updateProfile(cred.user, { displayName: name.trim() })
      await setDoc(doc(db, 'users', cred.user.uid), {
        username: normalizedUsername,
        name: name.trim(),
        email: normalizedEmail,
        status: 'pending',
        role: 'user',
        createdAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('Signup profile write failed, rolling back auth account:', err)
      try {
        await deleteUser(cred.user)
      } catch (rollbackErr) {
        console.error('Auth account rollback failed:', rollbackErr)
      }
      throw new Error('가입 처리 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }, [])

  const login = useCallback(async (identifier, password) => {
    const normalizedIdentifier = identifier.trim().toLowerCase()

    let email
    if (normalizedIdentifier.includes('@')) {
      // 입력값이 이메일 형식이면 아이디 조회 없이 그대로 로그인 시도한다.
      // Firestore의 email 필드가 실제 Auth 이메일과 어긋난 경우(자가치유 실패 등)의
      // 복구 경로이기도 하다 — 이메일을 알면 Firestore 상태와 무관하게 로그인할 수 있다.
      email = normalizedIdentifier
    } else {
      // 비밀번호 찾기용 실제 이메일을 등록+인증 완료한 계정은 Auth의 로그인 이메일 자체가
      // 가짜 도메인에서 실제 이메일로 바뀌어 있으므로, 고정 변환 대신 Firestore에서 조회한다.
      // 등록 이력이 없으면(대다수) 그대로 가짜 이메일로 폴백한다.
      email = toEmail(normalizedIdentifier)
      try {
        const q = query(collection(db, 'users'), where('username', '==', normalizedIdentifier), limit(1))
        const snap = await getDocs(q)
        if (!snap.empty) {
          const data = snap.docs[0].data()
          if (!isFakeEmail(data.email)) email = data.email
        }
      } catch (err) {
        console.error('Email lookup for login failed, falling back to pseudo-email:', err)
      }
    }

    let cred
    try {
      cred = await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      throw new Error(authErrorMessage(err))
    }

    // 거절됐던 사용자가 다시 로그인하면 재승인 요청이 가도록 자동으로 대기 상태로 되돌림
    let reRequested = false
    try {
      const snap = await getDoc(doc(db, 'users', cred.user.uid))
      if (snap.exists() && snap.data().status === 'rejected') {
        await updateDoc(doc(db, 'users', cred.user.uid), { status: 'pending' })
        reRequested = true
      }
    } catch (err) {
      console.error('Re-request approval on login failed:', err)
      // 로그인 자체는 이미 성공했으므로 여기서 실패해도 로그인 흐름은 막지 않음
    }
    return { reRequested }
  }, [])

  const logout = useCallback(() => signOut(auth), [])

  // 현재 비밀번호를 아는 상태에서 자유롭게 바꾸는 용도. Firebase는 민감한 Auth 작업 전
  // 최근 로그인(재인증)을 요구하므로 먼저 재인증한다.
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
    try {
      await reauthenticateWithCredential(auth.currentUser, cred)
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        throw new Error('현재 비밀번호가 일치하지 않습니다.')
      }
      throw new Error('인증에 실패했습니다. 다시 시도해주세요.')
    }
    try {
      await updatePassword(auth.currentUser, newPassword)
    } catch (err) {
      if (err.code === 'auth/weak-password') throw new Error('비밀번호는 6자 이상이어야 합니다.')
      throw new Error('비밀번호 변경에 실패했습니다.')
    }
  }, [])

  // 비밀번호 찾기용 실제 이메일 등록. updateEmail을 바로 쓰면 Firebase의 이메일 열거 방지
  // 정책 때문에 OPERATION_NOT_ALLOWED로 거부되므로, 인증 메일만 보내고 사용자가 그
  // 링크를 눌러야 실제로 이메일이 바뀌는 verifyBeforeUpdateEmail을 사용한다.
  // uid와 기존 Firestore 데이터는 그대로 유지된다(계정 삭제/재생성 불필요).
  const registerRecoveryEmail = useCallback(async (currentPassword, newEmail) => {
    const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
    try {
      await reauthenticateWithCredential(auth.currentUser, cred)
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        throw new Error('현재 비밀번호가 일치하지 않습니다.')
      }
      throw new Error('인증에 실패했습니다. 다시 시도해주세요.')
    }
    try {
      await verifyBeforeUpdateEmail(auth.currentUser, newEmail.trim())
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') throw new Error('이미 사용 중인 이메일입니다.')
      if (err.code === 'auth/invalid-email') throw new Error('올바른 이메일 형식이 아닙니다.')
      throw new Error('이메일 등록에 실패했습니다.')
    }
  }, [])

  const loading = authLoading || (Boolean(user) && profileLoading && !profile)
  const hasRecoveryEmail = Boolean(profile && !isFakeEmail(profile.email))

  return (
    <Ctx.Provider value={{
      user, profile, loading, signup, login, logout,
      changePassword, registerRecoveryEmail, hasRecoveryEmail,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
