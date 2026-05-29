import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

export default function Settings() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')
  const org  = JSON.parse(localStorage.getItem('org'))

  const [data, setData]   = useState(null)
  const [orgName, setOrgName]  = useState('')
  const [userName, setUserName]  = useState('')
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass]  = useState('')
  const [messages, setMessages] = useState({})
  const [errors, setErrors]   = useState({})
  const [loading, setLoading]  = useState({})

  // fetch current settings
  useEffect(() => {
    axios.get('http://localhost:5000/api/settings', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setData(res.data)
      setOrgName(res.data.org.name)
      setUserName(res.data.user.name)
    })
  }, [])

  const setMsg = (key, msg) => setMessages(p => ({ ...p, [key]: msg }))
  const setErr = (key, err) => setErrors(p => ({ ...p, [key]: err }))
  const setLoad = (key, val) => setLoading(p => ({ ...p, [key]: val }))

  // update org name
  const handleOrgUpdate = async (e) => {
    e.preventDefault()
    setMsg('org', ''); setErr('org', '')
    setLoad('org', true)
    try {
      const res = await axios.put(
        'http://localhost:5000/api/settings/org',
        { name: orgName },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMsg('org', res.data.message)
      // update localStorage so sidebar shows new name
      const updatedOrg = { ...org, name: res.data.org.name, slug: res.data.org.slug }
      localStorage.setItem('org', JSON.stringify(updatedOrg))
    } catch (err) {
      setErr('org', err.response?.data?.error || 'Could not update')
    } finally {
      setLoad('org', false)
    }
  }

  // update profile name
  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setMsg('profile', ''); setErr('profile', '')
    setLoad('profile', true)
    try {
      const res = await axios.put(
        'http://localhost:5000/api/settings/profile',
        { name: userName },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMsg('profile', res.data.message)
      const updatedUser = { ...JSON.parse(localStorage.getItem('user')), name: res.data.user.name }
      localStorage.setItem('user', JSON.stringify(updatedUser))
    } catch (err) {
      setErr('profile', err.response?.data?.error || 'Could not update')
    } finally {
      setLoad('profile', false)
    }
  }

  // change password
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setMsg('password', ''); setErr('password', '')
    setLoad('password', true)
    try {
      const res = await axios.put(
        'http://localhost:5000/api/settings/password',
        { currentPassword: currentPass, newPassword: newPass },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMsg('password', res.data.message)
      setCurrentPass('')
      setNewPass('')
    } catch (err) {
      setErr('password', err.response?.data?.error || 'Could not change password')
    } finally {
      setLoad('password', false)
    }
  }

  // delete org
  const handleDeleteOrg = async () => {
    if (!window.confirm('Are you sure? This will permanently delete your organization and cannot be undone!')) return
    if (!window.confirm('Last warning! Are you 100% sure?')) return
    try {
      await axios.delete('http://localhost:5000/api/settings/org', {
        headers: { Authorization: `Bearer ${token}` }
      })
      localStorage.clear()
      navigate('/register')
    } catch (err) {
      alert('Could not delete organization')
    }
  }

  const sectionStyle = {
    background: '#fff', borderRadius: 10, padding: 24,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20
  }
  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 6,
    border: '1px solid #ddd', fontSize: 13, marginBottom: 10,
    boxSizing: 'border-box'
  }
  const btnStyle = {
    padding: '8px 20px', borderRadius: 6, border: 'none',
    background: '#89b4fa', color: '#1e1e2e',
    fontWeight: 600, fontSize: 13, cursor: 'pointer'
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: 200, background: '#1e1e2e', color: '#cdd6f4',
        display: 'flex', flexDirection: 'column', padding: '24px 0'
      }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #313244' }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{org?.name}</div>
          <div style={{ fontSize: 11, color: '#a6adc8', marginTop: 4 }}>{org?.plan} plan</div>
        </div>
        <nav style={{ flex: 1, marginTop: 12 }}>
          {[
            { label: '🏠  Dashboard', path: '/dashboard' },
            { label: '👥  Members', path: '/members'   },
            { label: '💳  Billing', path: '/billing'   },
            { label: '⚙️  Settings', path: '/settings'  },
          ].map(item => (
            <div key={item.path} onClick={() => navigate(item.path)} style={{
              padding: '10px 20px', cursor: 'pointer', fontSize: 13,
              background: location.pathname === item.path ? '#313244' : 'transparent',
              borderLeft: location.pathname === item.path ? '3px solid #89b4fa' : '3px solid transparent',
            }}>
              {item.label}
            </div>
          ))}
        </nav>
        <div onClick={() => { localStorage.clear(); navigate('/login') }}
          style={{ padding: '12px 20px', cursor: 'pointer', fontSize: 13, color: '#f38ba8' }}>
          🚪  Logout
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, background: '#f8f9fa', padding: 32, maxWidth: 600 }}>
        <h2 style={{ margin: '0 0 4px' }}>Settings</h2>
        <p style={{ margin: '0 0 24px', color: '#666', fontSize: 14 }}>
          Manage your organization and account
        </p>

        {/* ── Organization name ── */}
        <div style={sectionStyle}>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>🏢 Organization name</div>
          {messages.org && <p style={{ color: 'green',  fontSize: 13, margin: '0 0 8px' }}>✅ {messages.org}</p>}
          {errors.org   && <p style={{ color: 'red',    fontSize: 13, margin: '0 0 8px' }}>❌ {errors.org}</p>}
          <form onSubmit={handleOrgUpdate}>
            <input
              style={inputStyle}
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="Organization name"
              required
            />
            <button type="submit" style={btnStyle} disabled={loading.org}>
              {loading.org ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* ── Profile name ── */}
        <div style={sectionStyle}>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>👤 Your profile</div>
          {messages.profile && <p style={{ color: 'green', fontSize: 13, margin: '0 0 8px' }}>✅ {messages.profile}</p>}
          {errors.profile   && <p style={{ color: 'red', fontSize: 13, margin: '0 0 8px' }}>❌ {errors.profile}</p>}
          <form onSubmit={handleProfileUpdate}>
            <input
              style={inputStyle}
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="Your name"
              required
            />
            <input
              style={{ ...inputStyle, background: '#f9f9f9', color: '#888' }}
              value={data?.user?.email || ''}
              disabled
              placeholder="Email (cannot be changed)"
            />
            <button type="submit" style={btnStyle} disabled={loading.profile}>
              {loading.profile ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* ── Change password ── */}
        <div style={sectionStyle}>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>🔒 Change password</div>
          {messages.password && <p style={{ color: 'green', fontSize: 13, margin: '0 0 8px' }}>✅ {messages.password}</p>}
          {errors.password   && <p style={{ color: 'red',   fontSize: 13, margin: '0 0 8px' }}>❌ {errors.password}</p>}
          <form onSubmit={handlePasswordChange}>
            <input
              style={inputStyle} type="password"
              value={currentPass}
              onChange={e => setCurrentPass(e.target.value)}
              placeholder="Current password" required
            />
            <input
              style={inputStyle} type="password"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder="New password (min 8 characters)" required
            />
            <button type="submit" style={btnStyle} disabled={loading.password}>
              {loading.password ? 'Changing...' : 'Change password'}
            </button>
          </form>
        </div>

        {/* ── Account info ── */}
        <div style={sectionStyle}>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>ℹ️ Account info</div>
          <div style={{ fontSize: 13, color: '#555', lineHeight: 2 }}>
            <div>🏢 Org slug: <strong>/{data?.org?.slug}</strong></div>
            <div>📅 Org created: <strong>{data?.org?.created_at ? new Date(data.org.created_at).toLocaleDateString() : '...'}</strong></div>
            <div>📅 Member since: <strong>{data?.user?.created_at ? new Date(data.user.created_at).toLocaleDateString() : '...'}</strong></div>
            <div>💳 Current plan: <strong>{data?.org?.plan}</strong></div>
          </div>
        </div>

        {/* ── Danger zone ── */}
        <div style={{ ...sectionStyle, border: '1px solid #fca5a5' }}>
          <div style={{ fontWeight: 600, color: '#b91c1c', marginBottom: 6 }}>
            ⚠️ Danger zone
          </div>
          <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px' }}>
            Permanently delete your organization and all its data. This cannot be undone.
          </p>
          <button onClick={handleDeleteOrg} style={{
            padding: '8px 18px', borderRadius: 6, fontSize: 13,
            border: '1px solid #fca5a5', background: 'transparent',
            color: '#b91c1c', cursor: 'pointer'
          }}>
            Delete organization
          </button>
        </div>

      </div>
    </div>
  )
}