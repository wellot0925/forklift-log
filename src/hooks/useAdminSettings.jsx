import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'

const Ctx = createContext(null)
const DEFAULT_PASSWORD = '0925'
const settingsRef = doc(db, 'settings', 'admin')

export function AdminSettingsProvider({ children }) {
  const [password, setPassword] = useState(null)
  const [loading, setLoading] = useState(true)
  const seeded = useRef(false)

  useEffect(() => {
    const unsub = onSnapshot(settingsRef, snap => {
      if (snap.exists()) {
        setPassword(snap.data().password ?? DEFAULT_PASSWORD)
      } else {
        setPassword(DEFAULT_PASSWORD)
        // 모든 기기가 최초 1회 같은 기본값으로 시드 — 동시 실행돼도 결과는 동일해 안전
        if (!seeded.current) {
          seeded.current = true
          setDoc(settingsRef, { password: DEFAULT_PASSWORD })
            .catch(err => console.error('Admin settings seed error:', err))
        }
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
