import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'

const Ctx = createContext(null)
const settingsRef = doc(db, 'settings', 'admin')
// 최초 1회 문서가 없을 때만 쓰이는 초기 비밀번호. 코드에 하드코딩하지 않고 .env(VITE_ADMIN_INITIAL_PASSWORD)로 관리.
// 값이 없으면 추측 가능한 기본값으로 자동 시드하지 않고 잠금 상태(null)로 안전하게 처리.
const INITIAL_PASSWORD = import.meta.env.VITE_ADMIN_INITIAL_PASSWORD || null

export function AdminSettingsProvider({ children }) {
  const [password, setPassword] = useState(null)
  const [loading, setLoading] = useState(true)
  const seeded = useRef(false)

  useEffect(() => {
    const unsub = onSnapshot(settingsRef, snap => {
      if (snap.exists()) {
        setPassword(snap.data().password ?? null)
      } else if (INITIAL_PASSWORD) {
        setPassword(INITIAL_PASSWORD)
        // 모든 기기가 최초 1회 같은 초기값으로 시드 — 동시 실행돼도 결과는 동일해 안전
        if (!seeded.current) {
          seeded.current = true
          setDoc(settingsRef, { password: INITIAL_PASSWORD })
            .catch(err => console.error('Admin settings seed error:', err))
        }
      } else {
        console.error('VITE_ADMIN_INITIAL_PASSWORD가 설정되지 않아 관리자 비밀번호를 초기화할 수 없습니다.')
        setPassword(null)
      }
      setLoading(false)
    }, err => {
      console.error('Firestore settings error:', err)
      setLoading(false)
    })
    return unsub
  }, [])

  const changePassword = useCallback(async (newPassword) => {
    await setDoc(settingsRef, { password: newPassword }, { merge: true })
  }, [])

  return (
    <Ctx.Provider value={{ password, loading, changePassword }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAdminSettings = () => useContext(Ctx)
