import { initializeApp } from 'firebase/app'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth, browserLocalPersistence } from 'firebase/auth'

// Firebase 콘솔(console.firebase.google.com)에서 프로젝트 생성 후
// 웹 앱 추가 → 앱 등록 → 아래 값들을 .env 파일에 입력하세요.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

// 오프라인 지원: 인터넷 없어도 작동하고 연결 시 자동 동기화
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

export const storage = getStorage(app)

// 기기에 로그인 상태를 유지 (앱을 다시 열어도 재로그인 불필요)
export const auth = getAuth(app)
auth.setPersistence(browserLocalPersistence)
