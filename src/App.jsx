import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import BoardPage from './pages/BoardPage'
import SettingsPage from './pages/SettingsPage'
import { bindAudioUnlock } from './utils/flipSound'
import './App.css'

function App() {
  useEffect(() => bindAudioUnlock(), [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BoardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
