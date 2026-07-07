import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, updateProfile,
} from 'firebase/auth'
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
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
    try {
      const cred = await createUserWithEmailAndPassword(auth, toEmail(username), password)
      await updateProfile(cred.user, { displayName: name.trim() })
      await setDoc(doc(db, 'users', cred.user.uid), {
        username: username.trim().toLowerCase(),
        name: name.trim(),
        status: 'pending',
        role: 'user',
        createdAt: serverTimestamp(),
      })
    } catch (err) {
      throw new Error(authErrorMessage(err))
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
