import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { ThemeProvider } from './hooks/useTheme.jsx'
import { RecordsProvider } from './hooks/useRecords.jsx'
import { TipsProvider } from './hooks/useTips.jsx'
import { ToastProvider } from './hooks/useToast.jsx'
import { LightboxProvider } from './hooks/useLightbox.jsx'
import TabBar from './components/TabBar.jsx'
import HomePage from './pages/HomePage.jsx'
import WritePage from './pages/WritePage.jsx'
import DetailPage from './pages/DetailPage.jsx'
import TipPage from './pages/TipPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function AppRoutes() {
  const location = useLocation()
  const isSubPage = /^\/(detail\/|write)/.test(location.pathname)

  return (
    <div className="app-wrapper">
      <ScrollToTop />
      <main className={`main-content${isSubPage ? '' : ' with-tabbar'}`}>
        <Routes location={location} key={location.pathname}>
          <Route path="/"           element={<HomePage />} />
          <Route path="/write"      element={<WritePage />} />
          <Route path="/write/:id"  element={<WritePage />} />
          <Route path="/detail/:id" element={<DetailPage />} />
          <Route path="/tips"       element={<TipPage />} />
          <Route path="/settings"   element={<SettingsPage />} />
        </Routes>
      </main>
      {!isSubPage && <TabBar />}
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <RecordsProvider>
        <TipsProvider>
          <ToastProvider>
            <LightboxProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </LightboxProvider>
          </ToastProvider>
        </TipsProvider>
      </RecordsProvider>
    </ThemeProvider>
  )
}
