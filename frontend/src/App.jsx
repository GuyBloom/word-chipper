import { BrowserRouter, Routes, Route } from 'react-router-dom'
import GamePage from './pages/GamePage'
import ArchivePage from './pages/ArchivePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GamePage />} />
        <Route path="/play/:date" element={<GamePage />} />
        <Route path="/archive" element={<ArchivePage />} />
      </Routes>
    </BrowserRouter>
  )
}
