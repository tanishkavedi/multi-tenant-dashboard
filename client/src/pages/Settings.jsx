import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Sidebar from '../components/Sidebar'

export default function Settings() {
  const navigate = useNavigate()
  const token    = localStorage.getItem('token')

  const [data,  setData]   = useState(null)
  const [orgName,  setOrgName] = useState('')
  const [userName, setUserName]  = useState('')
  const [currentPass, setCurrentPass] = useState('')
  const [newPass,  setNewPass]  = useState('')
  const [messages,  setMessages]  = useState({})
  const [errors,   setErrors]  = useState({})
  const [loading,  setLoading]  = useState({})

  useEffect(() => {
    axios.get('http://localhost:5000/api/settings', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setData(res.data)
      setOrgName(res.data.org.name)
      setUserName(res.data.user.name)
    }).catch(err => console.error(err))
  }, [])

  const setMsg  = (key, msg) => setMessages(p => ({ ...p, [key]: msg }))
  const setErr  = (key, err) => setErrors(p => ({ ...p, [key]: err }))
  const setLoad = (key, val) => setLoading(p => ({ ...p, [key]: val }))

  const handleOrgUpdate = async (e) => {
    e.preventDefault()
    setMsg('org', ''); setErr('org', ''); setLoad('org', true)
    try {
      const res = await axios.put(
        'http://localhost:5000/api/settings/org',
        { name: orgName },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMsg('org', res.data.message)
      const updatedOrg = { ...JSON.parse(localStorage.getItem('org')), name: res.data.org.name }
      localStorage.setItem('org', JSON.stringify(updatedOrg))
    } catch (err) {
      setErr('org', err.response?.data?.error || 'Could not update')
    } finally {
      setLoad('org', false)
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setMsg('profile', ''); setErr('profile', ''); setLoad('profile', true)
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

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setMsg('password', ''); setErr('password', ''); setLoad('password', true)
    try {
      const res = await axios.put(
        'http://localhost:5000/api/settings/password',
        { currentPassword: currentPass, newPassword: newPass },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMsg('password', res.data.message)
      setCurrentPass(''); setNewPass('')
    } catch (err) {
      setErr('password', err.response?.data?.error || 'Could not change password')
    } finally {
      setLoad('password', false)
    }
  }

  const handleDeleteOrg = async () => {
    if (!window.confirm('Are you sure? This will permanently delete your organization!')) return
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
    background: 'var(--bg-card)', borderRadius: 10, padding: 24,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    border: '1px solid var(--border)', marginBottom: 20
  }
  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 6,
    border: '1px solid var(--border)', fontSize: 13,
    background: 'var(--bg-main)', color: 'var(--text-primary)',
    marginBottom: 10, boxSizing: 'border-box'
  }
  const btnStyle = {
    padding: '8px 20px', borderRadius: 6, border: 'none',
    background: 'var(--accent)', color: '#1e1e2e',
    fontWeight: 600, fontSize: 13, cursor: 'pointer'
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <Sidebar />

      <div style={{ flex: 1, background: 'var(--bg-main)', padding: 32, maxWidth: 700 }}>
        <h2 style={{ margin: '0 0 4px', color: 'var(--text-primary)' }}>Settings</h2>
        <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: 14 }}>
          Manage your organization and account
        </p>

        {/* Organization name */}
        <div style={sectionStyle}>
          <div style={{ fontWeight: 600, marginBottom: 14, color: 'var(--text-primary)' }}>
            🏢 Organization name
          </div>
          {messages.org && <p style={{ color: 'green',  fontSize: 13, margin: '0 0 8px' }}>✅ {messages.org}</p>}
          {errors.org   && <p style={{ color: 'red',    fontSize: 13, margin: '0 0 8px' }}>❌ {errors.org}</p>}
          <form onSubmit={handleOrgUpdate}>
            <input
              style={inputStyle} value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="Organization name" required
            />
            <button type="submit" style={btnStyle} disabled={loading.org}>
              {loading.org ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Profile */}
        <div style={sectionStyle}>
          <div style={{ fontWeight: 600, marginBottom: 14, color: 'var(--text-primary)' }}>
            👤 Your profile
          </div>
          {messages.profile && <p style={{ color: 'green', fontSize: 13, margin: '0 0 8px' }}>✅ {messages.profile}</p>}
          {errors.profile   && <p style={{ color: 'red',   fontSize: 13, margin: '0 0 8px' }}>❌ {errors.profile}</p>}
          <form onSubmit={handleProfileUpdate}>
            <input
              style={inputStyle} value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="Your name" required
            />
            <input
              style={{ ...inputStyle, opacity: 0.6 }}
              value={data?.user?.email || ''}
              disabled
              placeholder="Email (cannot be changed)"
            />
            <button type="submit" style={btnStyle} disabled={loading.profile}>
              {loading.profile ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div style={sectionStyle}>
          <div style={{ fontWeight: 600, marginBottom: 14, color: 'var(--text-primary)' }}>
            🔒 Change password
          </div>
          {messages.password && <p style={{ color: 'green', fontSize: 13, margin: '0 0 8px' }}>✅ {messages.password}</p>}
          {errors.password   && <p style={{ color: 'red',   fontSize: 13, margin: '0 0 8px' }}>❌ {errors.password}</p>}
          <form onSubmit={handlePasswordChange}>
            <input
              style={inputStyle} type="password"
              value={currentPass} onChange={e => setCurrentPass(e.target.value)}
              placeholder="Current password" required
            />
            <input
              style={inputStyle} type="password"
              value={newPass} onChange={e => setNewPass(e.target.value)}
              placeholder="New password (min 8 characters)" required
            />
            <button type="submit" style={btnStyle} disabled={loading.password}>
              {loading.password ? 'Changing...' : 'Change password'}
            </button>
          </form>
        </div>

        {/* Account info */}
        <div style={sectionStyle}>
          <div style={{ fontWeight: 600, marginBottom: 14, color: 'var(--text-primary)' }}>
            ℹ️ Account info
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 2 }}>
            <div>🏢 Org slug: <strong style={{ color: 'var(--text-primary)' }}>/{data?.org?.slug}</strong></div>
            <div>📅 Org created: <strong style={{ color: 'var(--text-primary)' }}>{data?.org?.created_at ? new Date(data.org.created_at).toLocaleDateString() : '...'}</strong></div>
            <div>📅 Member since: <strong style={{ color: 'var(--text-primary)' }}>{data?.user?.created_at ? new Date(data.user.created_at).toLocaleDateString() : '...'}</strong></div>
            <div>💳 Current plan: <strong style={{ color: 'var(--text-primary)' }}>{data?.org?.plan}</strong></div>
          </div>
        </div>

        {/* Danger zone */}
        <div style={{ ...sectionStyle, border: '1px solid var(--danger)' }}>
          <div style={{ fontWeight: 600, color: 'var(--danger)', marginBottom: 6 }}>
            ⚠️ Danger zone
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
            Permanently delete your organization and all its data. This cannot be undone.
          </p>
          <button onClick={handleDeleteOrg} style={{
            padding: '8px 18px', borderRadius: 6, fontSize: 13,
            border: '1px solid var(--danger)', background: 'transparent',
            color: 'var(--danger)', cursor: 'pointer'
          }}>
            Delete organization
          </button>
        </div>
      </div>
    </div>
  )
}