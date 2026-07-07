import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, updateProfile, deleteUser,
} from 'firebase/auth'
import {
  doc, setDoc, onSnapshot, serverTimestamp,
  collection, query, where, limit, getDocs,
} from 'firebase/firestore'
import { auth, db } from '../firebase.js'

const Ctx = createContext(null)

// Firebase Auth는 이메일 형식만 받으므로, 아이디를 내부용 가짜 이메일로 변환해서 사용
const EMAIL_DOMAIN = 'forklift-log.internal'
const toEmail = username => `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`

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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u)
      setAuthLoading(false)
      if (!u) setProfile(null)
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!user) return
    setProfileLoading(true)
    const unsub = onSnapshot(doc(db, 'users', user.uid), snap => {
      setProfile(snap.exists() ? snap.data() : null)
      setProfileLoading(false)
    }, err => {
      console.error('Firestore user profile error:', err)
      setProfileLoading(false)
    })
    return unsub
  }, [user])

  const signup = useCallback(async (username, password, name) => {
    const normalizedUsername = username.trim().toLowerCase()

    // 1) Firestore users 컬렉션 기준 아이디 중복 사전 체크
    let taken
    try {
      taken = await isUsernameTaken(normalizedUsername)
    } catch (err) {
      console.error('Username availability check failed:', err)
      throw new Error('아이디 확인 중 오류가 발생했습니다. 네트워크를 확인해주세요.')
    }
    if (taken) throw new Error('이미 사용 중인 아이디입니다.')

    // 2) Auth 계정 생성
    let cred
    try {
      cred = await createUserWithEmailAndPassword(auth, toEmail(normalizedUsername), password)
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        // Firestore엔 없는데 Auth에만 존재 — 이전 가입 실패로 남은 유령 계정일 가능성이 높음
        throw new Error('이 아이디는 시스템에 등록 이력이 있어 사용할 수 없습니다. 관리자에게 문의해주세요.')
      }
      throw new Error(authErrorMessage(err))
    }

    // 3) 프로필 저장 — 실패하면 방금 만든 Auth 계정을 롤백해서 유령 계정이 남지 않게 함
    try {
      await updateProfile(cred.user, { displayName: name.trim() })
      await setDoc(doc(db, 'users', cred.user.uid), {
        username: normalizedUsername,
        name: name.trim(),
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

  const login = useCallback(async (username, password) => {
    try {
      await signInWithEmailAndPassword(auth, toEmail(username), password)
    } catch (err) {
      throw new Error(authErrorMessage(err))
    }
  }, [])

  const logout = useCallback(() => signOut(auth), [])

  const loading = authLoading || (Boolean(user) && profileLoading && !profile)

  return (
    <Ctx.Provider value={{ user, profile, loading, signup, login, logout }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
