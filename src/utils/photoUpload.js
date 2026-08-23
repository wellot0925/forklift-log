import { ref, uploadString, getDownloadURL, listAll, deleteObject } from 'firebase/storage'
import { storage } from '../firebase.js'

async function uploadPhoto(dataUrl, path, retries = 1) {
  const storageRef = ref(storage, path)
  for (let attempt = 0; ; attempt++) {
    try {
      await uploadString(storageRef, dataUrl, 'data_url')
      return await getDownloadURL(storageRef)
    } catch (err) {
      if (attempt >= retries) throw err
    }
  }
}

// base64 data URL → Firebase Storage URL로 변환. 기존 URL은 그대로 유지
// Storage 업로드는 Firestore와 달리 오프라인 큐잉이 안 되므로, 개별 사진 업로드
// 실패가 전체 저장(텍스트 포함)을 막지 않도록 실패한 사진만 건너뛰고 failedCount로 알림
export async function processPhotos(photos, basePath) {
  const results = []
  let failedCount = 0
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i]
    if (p.startsWith('data:')) {
      try {
        const url = await uploadPhoto(p, `${basePath}/${i}_${Date.now()}`)
        results.push(url)
      } catch (err) {
        console.error('Photo upload failed:', err)
        failedCount++
      }
    } else {
      results.push(p) // 이미 업로드된 URL은 그대로
    }
  }
  return { photoUrls: results, failedCount }
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
