import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { ThemeProvider } from './hooks/useTheme.jsx'
import { RecordsProvider } from './hooks/useRecords.jsx'
import { TipsProvider } from './hooks/useTips.jsx'
import { AdminSettingsProvider } from './hooks/useAdminSettings.jsx'
import { ToastProvider } from './hooks/useToast.jsx'
import { LightboxProvider } from './hooks/useLightbox.jsx'
import { useAppUpdate } from './hooks/useAppUpdate.jsx'
import TabBar from './components/TabBar.jsx'
import UpdateBanner from './components/UpdateBanner.jsx'
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
      <RecordsProvider>
        <TipsProvider>
          <AdminSettingsProvider>
            <ToastProvider>
              <LightboxProvider>
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </LightboxProvider>
            </ToastProvider>
          </AdminSettingsProvider>
        </TipsProvider>
      </RecordsProvider>
    </ThemeProvider>
  )
}
