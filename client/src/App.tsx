import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Home from './pages/Home'
import Commits from './pages/Commits'
import PRs from './pages/PRs' // added
// ...existing code...

export default function App() {
  return (
    <Routes>
      {/* ...existing code... */}
      <Route path="/" element={<Dashboard />} />
      <Route path="/home" element={<Home />} />
      <Route path="/commits" element={<Commits />} />
      <Route path="/prs" element={<PRs />} /> {/* added */}
      <Route path="*" element={<Navigate to="/" replace />} />
      {/* ...existing code... */}
    </Routes>
  )
}