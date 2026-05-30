import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import axios from 'axios'

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const fileInputRef = useRef()

  const org  = JSON.parse(localStorage.getItem('org'))
  const user = JSON.parse(localStorage.getItem('user'))
 

  // decode role from token
  const token = localStorage.getItem('token')

  const [avatarUrl, setAvatarUrl] = useState(null)
  const [uploading, setUploading] = useState(false)


  let role = 'member'
  if (token) {
    try {
      role = JSON.parse(atob(token.split('.')[1])).role
    } catch {}
  }



  // fetch avatar on load
  useEffect(() => {
    axios.get('http://localhost:5000/api/upload/avatar', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (res.data.avatarUrl)
        setAvatarUrl(`http://localhost:5000${res.data.avatarUrl}`)
    }).catch(() => {})
  }, [])

  // handle file pick
  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const res = await axios.post(
        'http://localhost:5000/api/upload/avatar',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      setAvatarUrl(`http://localhost:5000${res.data.avatarUrl}`)
    } catch (err) {
      alert('Upload failed. Max size is 2MB.')
    } finally {
      setUploading(false)
    }
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

       {/* User avatar + name */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid #313244',
      }}>
        {/* Avatar — click to upload */}
        <div
          onClick={() => fileInputRef.current.click()}
          style={{ position: 'relative', width: 48, height: 48, cursor: 'pointer', marginBottom: 8 }}
          title="Click to change photo"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="avatar"
              style={{
                width: 48, height: 48, borderRadius: '50%',
                objectFit: 'cover', border: '2px solid var(--accent)'
              }}
            />
          ) : (
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--accent)', color: '#1e1e2e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 16, border: '2px solid var(--accent)'
            }}>
              {user?.name?.slice(0, 2).toUpperCase()}
            </div>
          )}

          {/* Camera icon overlay */}
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 18, height: 18, borderRadius: '50%',
            background: '#313244', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 10
          }}>
            📷
          </div>
        </div>

         {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div style={{ fontSize: 13, fontWeight: 500 }}>
          {uploading ? 'Uploading...' : user?.name}
        </div>
        <div style={{ fontSize: 11, color: '#a6adc8', marginTop: 2 }}>
          {role}
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