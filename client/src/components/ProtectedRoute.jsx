import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token')
  const user  = JSON.parse(localStorage.getItem('user'))
  const org   = JSON.parse(localStorage.getItem('org'))

  // Not logged in at all → go to login
  if (!token || !user) {
    return <Navigate to="/login" />
  }

  // Role not allowed → go to dashboard with a message
  if (allowedRoles && !allowedRoles.includes(org?.role)) {
    return <Navigate to="/dashboard?error=unauthorized" />
  }

  // All good → show the page
  return children
}