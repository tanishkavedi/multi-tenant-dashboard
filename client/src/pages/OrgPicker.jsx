import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useState } from 'react'

export default function OrgPicker() {
  const navigate = useNavigate()
  const orgs  = JSON.parse(localStorage.getItem('orgs') || '[]')
  const user  = JSON.parse(localStorage.getItem('user'))
  const [loading, setLoading] = useState(false)

  const handlePick = async (org) => {
    setLoading(true)
    try {
      // get a new token scoped to this org
      const res = await axios.post(
        'http://localhost:5000/api/auth/switch-org',
        { orgId: org.id },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('org', JSON.stringify(res.data.org))
      navigate('/dashboard')
    } catch (err) {
      alert('Could not switch org')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-main)', fontFamily: 'sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: 24 }}>

        <h2 style={{ margin: '0 0 4px', color: 'var(--text-primary)', textAlign: 'center' }}>
          👋 Welcome back, {user?.name}!
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 28px' }}>
          Select an organization to continue
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orgs.map(org => (
            <div
              key={org.id}
              onClick={() => !loading && handlePick(org)}
              style={{
                background: 'var(--bg-card)', borderRadius: 12, padding: '18px 20px',
                border: '1px solid var(--border)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              {/* Org avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: 'var(--accent)', color: '#1e1e2e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 16
              }}>
                {org.name.slice(0, 2).toUpperCase()}
              </div>

              {/* Org info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
                  {org.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {org.plan} plan · {org.role}
                </div>
              </div>

              {/* Arrow */}
              <div style={{ color: 'var(--text-secondary)', fontSize: 18 }}>→</div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', marginTop: 20 }}>
          Want to create a new organization?{' '}
          <span
            onClick={() => { localStorage.clear(); navigate('/register') }}
            style={{ color: 'var(--accent)', cursor: 'pointer' }}
          >
            Register here
          </span>
        </p>

      </div>
    </div>
  )
}