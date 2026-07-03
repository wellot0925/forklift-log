import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDoc,
  serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { processPhotos, deletePhotos, deletePhotoFolder } from '../utils/photoUpload.js'

const Ctx = createContext(null)
const COL = 'records'

function fromFirestore(d) {
  const data = d.data()
  const photoUrls = data.photoUrls ?? []
  return {
    ...data,
    id: d.id,
    photos: photoUrls, // UI 호환용 alias
    photoUrls,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  }
}

export function RecordsProvider({ children }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, COL), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snapshot => {
      setRecords(snapshot.docs.map(fromFirestore))
      setLoading(false)
    }, err => {
      console.error('Firestore records error:', err)
      setLoading(false)
    })
    return unsub
  }, [])

  const add = useCallback(async (data) => {
    const docRef = doc(collection(db, COL))
    const photoUrls = await processPhotos(data.photos ?? [], `photos/records/${docRef.id}`)
    await setDoc(docRef, {
      model:      data.model?.trim()    ?? '',
      symptoms:   data.symptoms?.trim() ?? '',
      cause:      data.cause?.trim()    ?? '',
      solution:   data.solution?.trim() ?? '',
      unresolved: data.unresolved ?? false,
      author:     data.author?.trim()   ?? '',
      modifiedBy: null,
      photoUrls,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return { id: docRef.id }
  }, [])

  // 수정: author 필드는 건드리지 않고 modifiedBy만 업데이트
  const update = useCallback(async (id, data) => {
    const docRef = doc(db, COL, id)
    const prevSnap = await getDoc(docRef)
    const prevPhotoUrls = prevSnap.exists() ? (prevSnap.data().photoUrls ?? []) : []
    const photoUrls = await processPhotos(data.photos ?? [], `photos/records/${id}`)
    await updateDoc(docRef, {
      model:      data.model?.trim()    ?? '',
      symptoms:   data.symptoms?.trim() ?? '',
      cause:      data.cause?.trim()    ?? '',
      solution:   data.solution?.trim() ?? '',
      unresolved: data.unresolved ?? false,
      modifiedBy: data.author?.trim()   || null,
      photoUrls,
      updatedAt: serverTimestamp(),
    })
    const removed = prevPhotoUrls.filter(u => !photoUrls.includes(u))
    if (removed.length) await deletePhotos(removed)
    return { id }
  }, [])

  const remove = useCallback(async (id) => {
    await deleteDoc(doc(db, COL, id))
    await deletePhotoFolder(`photos/records/${id}`)
  }, [])

  const refresh = useCallback(() => {}, []) // onSnapshot이 자동 갱신
  const models = [...new Set(records.map(r => r.model).filter(Boolean))]

  return (
    <Ctx.Provider value={{ records, loading, add, update, remove, refresh, models }}>
      {children}
    </Ctx.Provider>
  )
}

export const useRecords = () => useContext(Ctx)
