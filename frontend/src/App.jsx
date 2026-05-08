import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import GamePage from './pages/GamePage'
import ArchivePage from './pages/ArchivePage'
import TutorialPage from './pages/TutorialPage'

function HomeRoute() {
  if (!localStorage.getItem('wordchipper_visited')) {
    return <Navigate to="/tutorial" replace />
  }
  return <GamePage />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/play/:date" element={<GamePage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/tutorial" element={<TutorialPage />} />
      </Routes>
    </BrowserRouter>
  )
}
