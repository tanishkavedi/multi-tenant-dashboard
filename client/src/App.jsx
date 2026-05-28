import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Register from './pages/Register'
import Login    from './pages/Login'

// placeholder until we build it
function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user'))
  return <h2>Welcome {user?.name}! Dashboard coming soon.</h2>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register"  element={<Register />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*"          element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}