import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  const org  = JSON.parse(localStorage.getItem('org'))
  const user = JSON.parse(localStorage.getItem('user'))

  // decode role from token
  const token = localStorage.getItem('token')
  let role = 'member'
  if (token) {
    try {
      role = JSON.parse(atob(token.split('.')[1])).role
    } catch {}
  }

  const navItems = [
    { label: '🏠  Dashboard', path: '/dashboard' },
    { label: '📊  Analytics', path: '/analytics' },
    { label: '👥  Members', path: '/members', roles: ['owner', 'admin'] },
    { label: '💳  Billing', path: '/billing', roles: ['owner'] },
    { label: '⚙️  Settings', path: '/settings', roles: ['owner'] },
  ].filter(item => !item.roles || item.roles.includes(role))

  return (
    <div style={{
      width: 200, background: 'var(--bg-sidebar)', color: 'var(--text-sidebar)',
      display: 'flex', flexDirection: 'column', padding: '24px 0',
      minHeight: '100vh', flexShrink: 0
    }}>
      {/* Org name */}
      <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #313244' }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{org?.name}</div>
        <div style={{ fontSize: 11, color: '#a6adc8', marginTop: 4 }}>
          {org?.plan} plan
        </div>
      </div>

      {/* User info */}
      <div style={{
        padding: '12px 20px 12px',
        borderBottom: '1px solid #313244',
        display: 'flex', alignItems: 'center', gap: 10
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--accent)', color: '#1e1e2e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 13, flexShrink: 0
        }}>
          {user?.name?.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500 }}>{user?.name}</div>
          <div style={{ fontSize: 10, color: '#a6adc8' }}>{role}</div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, marginTop: 8 }}>
        {navItems.map(item => (
          <div
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              padding: '10px 20px', cursor: 'pointer', fontSize: 13,
              color: location.pathname === item.path ? 'var(--accent)' : 'var(--text-sidebar)',
              background: location.pathname === item.path ? 'rgba(137,180,250,0.1)' : 'transparent',
              borderLeft: location.pathname === item.path ? '3px solid var(--accent)' : '3px solid transparent',
            }}
          >
            {item.label}
          </div>
        ))}
      </nav>

      {/* Dark/Light toggle */}
      <div
        onClick={toggleTheme}
        style={{
          padding: '10px 20px', cursor: 'pointer', fontSize: 13,
          color: 'var(--text-sidebar)', borderTop: '1px solid #313244',
          display: 'flex', alignItems: 'center', gap: 8
        }}
      >
        {theme === 'light' ? '🌙  Dark mode' : '☀️  Light mode'}
      </div>

      {/* Logout */}
      <div
        onClick={() => { localStorage.clear(); navigate('/login') }}
        style={{ padding: '12px 20px', cursor: 'pointer', fontSize: 13, color: 'var(--danger)' }}
      >
        🚪  Logout
      </div>
    </div>
  )
}