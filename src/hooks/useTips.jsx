import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc,
  serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase.js'

const Ctx = createContext(null)
const COL = 'tips'

async function uploadPhoto(dataUrl, path) {
  const storageRef = ref(storage, path)
  await uploadString(storageRef, dataUrl, 'data_url')
  return getDownloadURL(storageRef)
}

async function processPhotos(photos, tipId) {
  const results = []
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i]
    if (p.startsWith('data:')) {
      const url = await uploadPhoto(p, `photos/tips/${tipId}/${i}_${Date.now()}`)
      results.push(url)
    } else {
      results.push(p)
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
    photos: photoUrls,
    photoUrls,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  }
}

export function TipsProvider({ children }) {
  const [tips, setTips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, COL), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snapshot => {
      setTips(snapshot.docs.map(fromFirestore))
      setLoading(false)
    }, err => {
      console.error('Firestore tips error:', err)
      setLoading(false)
    })
    return unsub
  }, [])

  const add = useCallback(async (data) => {
    const docRef = doc(collection(db, COL))
    const photoUrls = await processPhotos(data.photos ?? [], docRef.id)
    await setDoc(docRef, {
      title:   data.title?.trim()   ?? '',
      content: data.content?.trim() ?? '',
      photoUrls,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return { id: docRef.id }
  }, [])

  const update = useCallback(async (id, data) => {
    const docRef = doc(db, COL, id)
    const photoUrls = await processPhotos(data.photos ?? [], id)
    await updateDoc(docRef, {
      title:   data.title?.trim()   ?? '',
      content: data.content?.trim() ?? '',
      photoUrls,
      updatedAt: serverTimestamp(),
    })
    return { id }
  }, [])

  const remove = useCallback((id) => {
    deleteDoc(doc(db, COL, id))
  }, [])

  return (
    <Ctx.Provider value={{ tips, loading, add, update, remove }}>
      {children}
    </Ctx.Provider>
  )
}

export const useTips = () => useContext(Ctx)
