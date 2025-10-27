import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import BrandAnalytics from './pages/BrandAnalytics'
import PlatformAnalytics from './pages/PlatformAnalytics'
import UserAnalytics from './pages/UserAnalytics'
import ProgramAnalytics from './pages/ProgramAnalytics'
import UserDetailAnalytics from './pages/UserDetailAnalytics'
import DuelLogo from './assets/duel_logo.svg'

type View = 'brands' | 'platforms' | 'users' | 'programs'

function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentView, setCurrentView] = useState<View>('users')

  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/users')
    }
  }, [location.pathname, navigate])

  const handleViewChange = (view: View) => {
    setCurrentView(view)
    navigate(`/${view}`)
  }

  useEffect(() => {
    const path = location.pathname.split('/')[1] as View
    if (['brands', 'platforms', 'users', 'programs'].includes(path)) {
      setCurrentView(path)
    }
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1 flex items-center gap-3">
          <img src={DuelLogo} alt="Duel" className="h-8 w-auto" />
        </div>
        <div className="flex-none gap-2">
          <div className="tabs tabs-boxed">
            <a
              className={`tab ${currentView === 'users' ? 'tab-active' : ''}`}
              onClick={() => handleViewChange('users')}
            >
              Top Advocates
            </a>
            <a
              className={`tab ${currentView === 'programs' ? 'tab-active' : ''}`}
              onClick={() => handleViewChange('programs')}
            >
              Programs
            </a>
            <a
              className={`tab ${currentView === 'brands' ? 'tab-active' : ''}`}
              onClick={() => handleViewChange('brands')}
            >
              Brands
            </a>
            <a
              className={`tab ${currentView === 'platforms' ? 'tab-active' : ''}`}
              onClick={() => handleViewChange('platforms')}
            >
              Platforms
            </a>
          </div>
        </div>
      </div>
      <Routes>
        <Route path="/users" element={<UserAnalytics />} />
        <Route path="/users/:userId" element={<UserDetailAnalytics />} />
        <Route path="/programs" element={<ProgramAnalytics />} />
        <Route path="/brands" element={<BrandAnalytics />} />
        <Route path="/platforms" element={<PlatformAnalytics />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  )
}

export default App
