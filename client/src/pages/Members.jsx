import { useEffect, useState } from 'react'
import axios from 'axios'
import Sidebar from '../components/Sidebar'

const ROLE_COLORS = {
  owner: { bg: '#e8f0fe', color: '#1a56db' },
  admin: { bg: '#e3fcef', color: '#057a55' },
  member: { bg: '#f3f4f6', color: '#555'    },
}

export default function Members() {
  const user = JSON.parse(localStorage.getItem('user'))
  const org  = JSON.parse(localStorage.getItem('org'))
  const token = localStorage.getItem('token')

  const [members, setMembers] = useState([])
  const [search, setSearch]  = useState('')
  const [email,  setEmail]   = useState('')
  const [role,  setRole]    = useState('member')
  const [message, setMessage] = useState('')
  const [error,  setError]   = useState('')
  const [loading, setLoading] = useState(false)

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
      fetchMembers()
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this member?')) return
    try {
      await axios.delete(`http://localhost:5000/api/members/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchMembers()
    } catch (err) {
      alert(err.response?.data?.error || 'Could not remove')
    }
  }

  // filtered members based on search
  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <Sidebar />

      <div style={{ flex: 1, background: 'var(--bg-main)', padding: 32 }}>

        {/* Header */}
        <h2 style={{ margin: '0 0 4px', color: 'var(--text-primary)' }}>Team Members</h2>
        <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: 14 }}>
          {search
            ? `${filteredMembers.length} result${filteredMembers.length !== 1 ? 's' : ''} for "${search}"`
            : `${members.length} member${members.length !== 1 ? 's' : ''} in ${org?.name}`
          }
        </p>

        {/* Search bar */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: 10, padding: '14px 20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 16,
          border: '1px solid var(--border)'
        }}>
          <input
            type="text"
            placeholder="🔍  Search members by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 6,
              border: '1px solid var(--border)', fontSize: 13,
              background: 'var(--bg-main)', color: 'var(--text-primary)',
              outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Invite form */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: 10, padding: 20,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 24,
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 14, color: 'var(--text-primary)' }}>
            ➕ Add a member
          </div>
          {message && <p style={{ color: 'green',  fontSize: 13 }}>{message}</p>}
          {error   && <p style={{ color: 'red',    fontSize: 13 }}>{error}</p>}
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="email"
              placeholder="Enter their email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 6,
                border: '1px solid var(--border)', fontSize: 13,
                background: 'var(--bg-main)', color: 'var(--text-primary)'
              }}
            />
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 6,
                border: '1px solid var(--border)', fontSize: 13,
                background: 'var(--bg-main)', color: 'var(--text-primary)'
              }}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" disabled={loading} style={{
              padding: '8px 18px', borderRadius: 6, border: 'none',
              background: 'var(--accent)', color: '#1e1e2e',
              fontWeight: 600, fontSize: 13, cursor: 'pointer'
            }}>
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </form>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 10 }}>
            💡 The person must have registered first before you can add them.
          </p>
        </div>

        {/* Members list */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden',
          border: '1px solid var(--border)'
        }}>
          {filteredMembers.length === 0 ? (
            <div style={{
              padding: '30px', textAlign: 'center',
              color: 'var(--text-secondary)', fontSize: 13
            }}>
              {search ? `😕 No members found matching "${search}"` : 'No members yet.'}
            </div>
          ) : (
            filteredMembers.map((m, i) => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 20px',
                borderBottom: i < filteredMembers.length - 1
                  ? '1px solid var(--border)' : 'none'
              }}>
                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--accent)', color: '#1e1e2e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 600, fontSize: 13, flexShrink: 0
                }}>
                  {m.name.slice(0, 2).toUpperCase()}
                </div>

                {/* Name + email */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>
                    {m.name}{' '}
                    {m.id === user.id && (
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>(you)</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.email}</div>
                </div>

                {/* Role badge */}
                <span style={{
                  fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 500,
                  background: ROLE_COLORS[m.role]?.bg,
                  color:      ROLE_COLORS[m.role]?.color,
                }}>
                  {m.role}
                </span>

                {/* Remove button */}
                {m.role !== 'owner' && (
                  <button onClick={() => handleRemove(m.id)} style={{
                    fontSize: 12, padding: '4px 10px', borderRadius: 6,
                    border: '1px solid var(--danger)', background: 'transparent',
                    color: 'var(--danger)', cursor: 'pointer'
                  }}>
                    Remove
                  </button>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}