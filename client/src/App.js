import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Members  from './pages/Members'
import Billing  from './pages/Billing'
import Settings  from './pages/Settings'
import ProtectedRoute from './components/ProtectedRoute'



export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>} />

          <Route path="/members" element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <Members />
          </ProtectedRoute>
        } />

        <Route path="/billing" element={
           <ProtectedRoute allowedRoles={['owner']}>
             <Billing />
          </ProtectedRoute>
             }
          />
         
         <Route path="/settings" element={
          <ProtectedRoute allowedRoles={['owner']}><Settings /></ProtectedRoute>   
        } />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}