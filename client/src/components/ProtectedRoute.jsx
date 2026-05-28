import { Navigate } from 'react-router-dom'

// helper: decode JWT without a library
function parseToken(token) {
  try {
    const base64 = token.split('.')[1]
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token')

  //  Not logged in → go to login
  if (!token) return <Navigate to="/login" />

  //  Decode the token to get the role
  const decoded = parseToken(token)
  if (!decoded) return <Navigate to="/login" />

  const role = decoded.role   // 'owner', 'admin', or 'member'

  //  Role not allowed → go to dashboard with error
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard?error=unauthorized" />
  }

  //  All good → show the page
  return children
}