import { ref, uploadString, getDownloadURL, listAll, deleteObject } from 'firebase/storage'
import { storage } from '../firebase.js'

async function uploadPhoto(dataUrl, path) {
  const storageRef = ref(storage, path)
  await uploadString(storageRef, dataUrl, 'data_url')
  return getDownloadURL(storageRef)
}

// base64 data URL → Firebase Storage URL로 변환. 기존 URL은 그대로 유지
export async function processPhotos(photos, basePath) {
  const results = []
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i]
    if (p.startsWith('data:')) {
      const url = await uploadPhoto(p, `${basePath}/${i}_${Date.now()}`)
      results.push(url)
    } else {
      results.push(p) // 이미 업로드된 URL은 그대로
    }
  }
  return results
}

export async function deletePhotos(urls) {
  await Promise.all(urls.map(async url => {
    try { await deleteObject(ref(storage, url)) }
    catch (err) { console.error('Storage photo delete error:', err) }
  }))
}

export async function deletePhotoFolder(basePath) {
  try {
    const { items } = await listAll(ref(storage, basePath))
    await Promise.all(items.map(item => deleteObject(item)))
  } catch (err) {
    console.error('Storage folder delete error:', err)
  }
}
