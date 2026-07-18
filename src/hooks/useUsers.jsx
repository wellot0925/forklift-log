import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from './useAuth.jsx'

const Ctx = createContext(null)

// 관리자(role: admin)일 때만 전체 사용자 목록을 구독한다.
// 일반 사용자는 어차피 Firestore 규칙상 다른 사용자 문서를 읽을 수 없음.
export function UsersProvider({ children }) {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAdmin) { setUsers([]); return }
    setLoading(true)
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snapshot => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, err => {
      console.error('Firestore users list error:', err)
      setLoading(false)
    })
    return unsub
  }, [isAdmin])

  const approve = useCallback(uid => updateDoc(doc(db, 'users', uid), { status: 'approved' }), [])
  const reject  = useCallback(uid => updateDoc(doc(db, 'users', uid), { status: 'rejected' }), [])
  const promote = useCallback(uid => updateDoc(doc(db, 'users', uid), { role: 'admin' }), [])
  const demote  = useCallback(uid => updateDoc(doc(db, 'users', uid), { role: 'user' }), [])
  // 승인 취소: 완전히 차단하는 rejected 대신 pending으로 되돌려 승인대기 목록에서 다시 검토
  // 가능하게 함. role이 admin인 사람을 승인 취소할 때 관리자 권한이 대기 상태로 남지
  // 않도록 role도 함께 user로 초기화한다.
  const revoke  = useCallback(uid => updateDoc(doc(db, 'users', uid), { status: 'pending', role: 'user' }), [])

  const pendingUsers  = users.filter(u => u.status === 'pending')
  const approvedUsers = users.filter(u => u.status === 'approved')

  return (
    <Ctx.Provider value={{ isAdmin, loading, pendingUsers, approvedUsers, approve, reject, promote, demote, revoke }}>
      {children}
    </Ctx.Provider>
  )
}

export const useUsers = () => useContext(Ctx)
