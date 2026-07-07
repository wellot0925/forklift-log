import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ThemeProvider } from './hooks/useTheme.jsx'
import { RecordsProvider } from './hooks/useRecords.jsx'
import { TipsProvider } from './hooks/useTips.jsx'
import { AdminSettingsProvider } from './hooks/useAdminSettings.jsx'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import { UsersProvider } from './hooks/useUsers.jsx'
import { ToastProvider } from './hooks/useToast.jsx'
import { LightboxProvider } from './hooks/useLightbox.jsx'
import { useAppUpdate } from './hooks/useAppUpdate.jsx'
import TabBar from './components/TabBar.jsx'
import UpdateBanner from './components/UpdateBanner.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import PendingApprovalPage from './pages/PendingApprovalPage.jsx'
import Spinner from './components/Spinner.jsx'
import HomePage from './pages/HomePage.jsx'
import RecordsPage from './pages/RecordsPage.jsx'
import WritePage from './pages/WritePage.jsx'
import DetailPage from './pages/DetailPage.jsx'
import TipPage from './pages/TipPage.jsx'
import TipDetailPage from './pages/TipDetailPage.jsx'
import TipWritePage from './pages/TipWritePage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import BulletinPage from './pages/BulletinPage.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function FullScreenLoader() {
  return (
    <div className="auth-page">
      <Spinner size="lg" />
    </div>
  )
}

// 로그인 여부/승인 상태에 따라 로그인·회원가입·승인대기 화면 또는 실제 앱을 보여줌.
// 홈화면/탭바가 뒤에서 잠깐이라도 스치듯 보이지 않도록, 승인된 사용자만 children(AppRoutes)에 도달한다.
function AuthGate({ children }) {
  const { user, profile, loading } = useAuth()
  const [authView, setAuthView] = useState('login')

  if (loading) return <FullScreenLoader />

  if (!user) {
    return authView === 'login'
      ? <LoginPage onSwitchToSignup={() => setAuthView('signup')} />
      : <SignupPage onSwitchToLogin={() => setAuthView('login')} />
  }

  if (!profile) return <FullScreenLoader />
  if (profile.status === 'pending') return <PendingApprovalPage />
  if (profile.status === 'rejected') return <PendingApprovalPage rejected />

  return children
}

function AppRoutes() {
  const location = useLocation()
  const updateAvailable = useAppUpdate()

  return (
    <div className={`app-wrapper${updateAvailable ? ' has-update-banner' : ''}`}>
      {updateAvailable && <UpdateBanner />}
      <ScrollToTop />
      <main className="main-content with-tabbar">
        <Routes location={location}>
          <Route path="/"           element={<HomePage />} />
          <Route path="/records"    element={<RecordsPage />} />
          <Route path="/write"      element={<WritePage />} />
          <Route path="/write/:id"  element={<WritePage />} />
          <Route path="/detail/:id" element={<DetailPage />} />
          <Route path="/tips"         element={<TipPage />} />
          <Route path="/tip/write"  element={<TipWritePage />} />
          <Route path="/tip/write/:id" element={<TipWritePage />} />
          <Route path="/tip/:id"    element={<TipDetailPage />} />
          <Route path="/bulletins"  element={<BulletinPage />} />
          <Route path="/settings"   element={<SettingsPage />} />
        </Routes>
      </main>
      <TabBar />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <LightboxProvider>
            {/* Firestore 규칙상 승인된 사용자만 읽을 수 있는 데이터라, 게이트를 통과한 뒤에만 구독 시작 */}
            <AuthGate>
              <RecordsProvider>
                <TipsProvider>
                  <AdminSettingsProvider>
                    <UsersProvider>
                      <BrowserRouter>
                        <AppRoutes />
                      </BrowserRouter>
                    </UsersProvider>
                  </AdminSettingsProvider>
                </TipsProvider>
              </RecordsProvider>
            </AuthGate>
          </LightboxProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
