import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import BoardPage from './pages/BoardPage'
import SettingsPage from './pages/SettingsPage'
import { bindAudioUnlock } from './utils/flipSound'
import './App.css'

const basename =
  import.meta.env.BASE_URL === '/'
    ? undefined
    : import.meta.env.BASE_URL.replace(/\/$/, '')

function App() {
  useEffect(() => bindAudioUnlock(), [])

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<BoardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
