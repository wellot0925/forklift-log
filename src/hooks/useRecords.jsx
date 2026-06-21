import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc,
  serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase.js'

const Ctx = createContext(null)
const COL = 'records'

async function uploadPhoto(dataUrl, path) {
  const storageRef = ref(storage, path)
  await uploadString(storageRef, dataUrl, 'data_url')
  return getDownloadURL(storageRef)
}

// base64 data URL → Firebase Storage URL に変換。既存 URL はそのまま保持
async function processPhotos(photos, recordId) {
  const results = []
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i]
    if (p.startsWith('data:')) {
      const url = await uploadPhoto(p, `photos/records/${recordId}/${i}_${Date.now()}`)
      results.push(url)
    } else {
      results.push(p) // 이미 업로드된 URL은 그대로
    }
  }
  return results
}

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
    const photoUrls = await processPhotos(data.photos ?? [], docRef.id)
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
    const photoUrls = await processPhotos(data.photos ?? [], id)
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
    return { id }
  }, [])

  const remove = useCallback((id) => {
    deleteDoc(doc(db, COL, id))
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
