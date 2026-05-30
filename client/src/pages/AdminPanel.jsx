import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const PLAN_COLORS = {
  free: { bg: '#f3f4f6', color: '#555'    },
  pro:  { bg: '#e8f0fe', color: '#1a56db' },
  enterprise: { bg: '#e3fcef', color: '#057a55' },
}

export default function AdminPanel() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const [summary, setSummary]  = useState(null)
  const [orgs,  setOrgs]  = useState([])
  const [users,  setUsers] = useState([])
  const [tab,  setTab]  = useState('overview')
  const [loading, setLoading]  = useState(true)
  const [error,  setError] = useState('')

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      axios.get('http://localhost:5000/api/admin/summary', { headers }),
      axios.get('http://localhost:5000/api/admin/orgs',  { headers }),
      axios.get('http://localhost:5000/api/admin/users',  { headers }),
    ]).then(([summaryRes, orgsRes, usersRes]) => {
      setSummary(summaryRes.data)
      setOrgs(orgsRes.data)
      setUsers(usersRes.data)
    }).catch(err => {
      setError(err.response?.data?.error || 'Access denied')
    }).finally(() => setLoading(false))
  }, [])

  const handleDeleteOrg = async (orgId, orgName) => {
    if (!window.confirm(`Delete "${orgName}"? This cannot be undone!`)) return
    try {
      await axios.delete(`http://localhost:5000/api/admin/orgs/${orgId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOrgs(prev => prev.filter(o => o.id !== orgId))
      setSummary(prev => ({ ...prev, totalOrgs: prev.totalOrgs - 1 }))
    } catch (err) {
      alert('Could not delete org')
    }
  }

  const tabStyle = (active) => ({
    padding: '8px 20px', borderRadius: 8, fontSize: 13,
    cursor: 'pointer', border: 'none', fontWeight: active ? 600 : 400,
    background: active ? 'var(--accent)' : 'var(--bg-card)',
    color: active ? '#1e1e2e' : 'var(--text-secondary)',
  })

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-main)',
      color: 'var(--text-secondary)', fontFamily: 'sans-serif'
    }}>
      Loading admin panel...
    </div>
  )

  if (error) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-main)',
      fontFamily: 'sans-serif', flexDirection: 'column', gap: 16
    }}>
      <div style={{ fontSize: 48 }}>🚫</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
        Access Denied
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{error}</div>
      <button onClick={() => navigate('/dashboard')} style={{
        padding: '8px 20px', borderRadius: 8, border: 'none',
        background: 'var(--accent)', color: '#1e1e2e',
        fontWeight: 600, cursor: 'pointer'
      }}>
        Go to Dashboard
      </button>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-main)',
      fontFamily: 'sans-serif', padding: 32
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 28
      }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>
            👑 Super Admin Panel
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
            Platform-wide overview and management
          </p>
        </div>
        <button onClick={() => navigate('/dashboard')} style={{
          padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
          background: 'transparent', color: 'var(--text-secondary)',
          fontSize: 13, cursor: 'pointer'
        }}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Summary cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16, marginBottom: 28
      }}>
        {[
          { label: 'Total Organizations', value: summary?.totalOrgs, icon: '🏢', color: 'var(--accent)'  },
          { label: 'Total Users',  value: summary?.totalUsers,  icon: '👥', color: 'var(--success)' },
          { label: 'Events This Month',   value: summary?.eventsThisMonth,  icon: '⚡', color: 'var(--warning)' },
          { label: 'Paid Orgs', value: summary?.planBreakdown?.find(p => p.plan !== 'free')?.count || 0,
            icon: '💰', color: '#cba6f7' },
        ].map(card => (
          <div key={card.label} style={{
            background: 'var(--bg-card)', borderRadius: 10, padding: '18px 20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
              {card.icon} {card.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: card.color }}>
              {card.value ?? 0}
            </div>
          </div>
        ))}
      </div>

      {/* Plan breakdown */}
      <div style={{
        background: 'var(--bg-card)', borderRadius: 10, padding: 20,
        border: '1px solid var(--border)', marginBottom: 24,
        display: 'flex', gap: 16, flexWrap: 'wrap'
      }}>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', width: '100%', marginBottom: 4 }}>
          📊 Plan breakdown
        </div>
        {summary?.planBreakdown?.map(p => (
          <div key={p.plan} style={{
            padding: '8px 16px', borderRadius: 8,
            background: PLAN_COLORS[p.plan]?.bg || '#f3f4f6',
            color: PLAN_COLORS[p.plan]?.color || '#555',
            fontSize: 13, fontWeight: 500
          }}>
            {p.plan}: {p.count} org{p.count !== '1' ? 's' : ''}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setTab('orgs')}  style={tabStyle(tab === 'orgs')}>
          🏢 Organizations ({orgs.length})
        </button>
        <button onClick={() => setTab('users')} style={tabStyle(tab === 'users')}>
          👥 Users ({users.length})
        </button>
      </div>

      {/* Organizations table */}
      {tab === 'orgs' && (
        <div style={{
          background: 'var(--bg-card)', borderRadius: 10,
          border: '1px solid var(--border)', overflow: 'hidden'
        }}>
          {orgs.map((org, i) => (
            <div key={org.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 20px',
              borderBottom: i < orgs.length - 1 ? '1px solid var(--border)' : 'none'
            }}>
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: 'var(--accent)', color: '#1e1e2e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13
              }}>
                {org.name.slice(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>
                  {org.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  /{org.slug} · {org.member_count} member{org.member_count !== '1' ? 's' : ''}
                  · Created {new Date(org.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Plan badge */}
              <span style={{
                fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 500,
                background: PLAN_COLORS[org.plan]?.bg || '#f3f4f6',
                color: PLAN_COLORS[org.plan]?.color || '#555',
              }}>
                {org.plan}
              </span>

              {/* Delete button */}
              <button onClick={() => handleDeleteOrg(org.id, org.name)} style={{
                fontSize: 12, padding: '4px 10px', borderRadius: 6,
                border: '1px solid var(--danger)', background: 'transparent',
                color: 'var(--danger)', cursor: 'pointer'
              }}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Users table */}
      {tab === 'users' && (
        <div style={{
          background: 'var(--bg-card)', borderRadius: 10,
          border: '1px solid var(--border)', overflow: 'hidden'
        }}>
          {users.map((user, i) => (
            <div key={user.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 20px',
              borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none'
            }}>
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: user.is_super_admin ? '#cba6f7' : 'var(--accent)',
                color: '#1e1e2e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13
              }}>
                {user.name.slice(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>
                  {user.name}
                  {user.is_super_admin && (
                    <span style={{
                      marginLeft: 8, fontSize: 11, padding: '2px 8px',
                      borderRadius: 20, background: '#cba6f7', color: '#1e1e2e',
                      fontWeight: 600
                    }}>👑 Super Admin</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {user.email} · {user.org_count} org{user.org_count !== '1' ? 's' : ''}
                  · Joined {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}