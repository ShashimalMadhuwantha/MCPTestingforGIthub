import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Home from './pages/Home'
import Commits from './pages/Commits' // added

export default function App() {
  return (
    <Routes>
      {/* ...existing code... */}
      <Route path="/" element={<Dashboard />} />
      <Route path="/home" element={<Home />} />
      <Route path="/commits" element={<Commits />} /> {/* added */}
      <Route path="*" element={<Navigate to="/" replace />} />
      {/* ...existing code... */}
    </Routes>
  )
}