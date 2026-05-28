

import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const ROLE_COLORS = {
  owner:  { bg: '#e8f0fe', color: '#1a56db' },
  admin:  { bg: '#e3fcef', color: '#057a55' },
  member: { bg: '#f3f4f6', color: '#555'    },
}

export default function Members() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))
  const org = JSON.parse(localStorage.getItem('org'))
  const token = localStorage.getItem('token')

  const [members, setMembers]   = useState([])
  const [email, setEmail]       = useState('')
  const [role, setRole]         = useState('member')
  const [message, setMessage]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  // fetch members on load
  const fetchMembers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/members', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMembers(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { fetchMembers() }, [])

  // invite a member
  const handleInvite = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setLoading(true)
    try {
      const res = await axios.post(
        'http://localhost:5000/api/members/invite',
        { email, role },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessage(res.data.message)
      setEmail('')
      fetchMembers()   // refresh list
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // remove a member
  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this member?')) return
    try {
      await axios.delete(`http://localhost:5000/api/members/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchMembers()  // refresh list
    } catch (err) {
      alert(err.response?.data?.error || 'Could not remove')
    }
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
            { label: '👥  Members',   path: '/members'   },
            { label: '💳  Billing',   path: '/billing'   },
            { label: '⚙️  Settings',  path: '/settings'  },
          ].map(item => (
            <div key={item.path} onClick={() => navigate(item.path)} style={{
              padding: '10px 20px', cursor: 'pointer', fontSize: 13,
              background: window.location.pathname === item.path ? '#313244' : 'transparent',
              borderLeft: window.location.pathname === item.path ? '3px solid #89b4fa' : '3px solid transparent',
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
      <div style={{ flex: 1, background: '#f8f9fa', padding: 32 }}>
        <h2 style={{ margin: '0 0 4px' }}>Team Members</h2>
        <p style={{ margin: '0 0 24px', color: '#666', fontSize: 14 }}>
          {members.length} member{members.length !== 1 ? 's' : ''} in {org?.name}
        </p>

        {/* ── Invite form ── */}
        <div style={{
          background: '#fff', borderRadius: 10, padding: 20,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 24
        }}>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>➕ Add a member</div>
          {message && <p style={{ color: 'green',  fontSize: 13 }}>{message}</p>}
          {error   && <p style={{ color: 'red',    fontSize: 13 }}>{error}</p>}
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="email"
              placeholder="Enter their email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }}
            />
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" disabled={loading} style={{
              padding: '8px 18px', borderRadius: 6, border: 'none',
              background: '#89b4fa', color: '#1e1e2e', fontWeight: 600,
              fontSize: 13, cursor: 'pointer'
            }}>
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </form>
          <p style={{ fontSize: 12, color: '#888', marginTop: 10 }}>
            💡 The person must have registered first before you can add them.
          </p>
        </div>

        {/* ── Members list ── */}
        <div style={{
          background: '#fff', borderRadius: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden'
        }}>
          {members.map((m, i) => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 20px',
              borderBottom: i < members.length - 1 ? '1px solid #f0f0f0' : 'none'
            }}>
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#e8f0fe', color: '#1a56db',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 600, fontSize: 13, flexShrink: 0
              }}>
                {m.name.slice(0, 2).toUpperCase()}
              </div>

              {/* Name + email */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>
                  {m.name} {m.id === user.id && <span style={{ fontSize: 11, color: '#888' }}>(you)</span>}
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>{m.email}</div>
              </div>

              {/* Role badge */}
              <span style={{
                fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 500,
                background: ROLE_COLORS[m.role]?.bg,
                color:      ROLE_COLORS[m.role]?.color,
              }}>
                {m.role}
              </span>

              {/* Remove button (only show for non-owners, and only to the logged-in owner) */}
              {m.role !== 'owner' && (
                <button onClick={() => handleRemove(m.id)} style={{
                  fontSize: 12, padding: '4px 10px', borderRadius: 6,
                  border: '1px solid #fca5a5', background: 'transparent',
                  color: '#ef4444', cursor: 'pointer'
                }}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}