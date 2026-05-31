import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function UsageLimits() {
  const token = localStorage.getItem('token')
  const navigate = useNavigate()
  const [limits, setLimits] = useState(null)

  useEffect(() => {
    axios.get('http://localhost:5000/api/analytics/limits', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setLimits(res.data))
      .catch(() => {})
  }, [])

  if (!limits) return null

  const { plan, limits: l } = limits

  const ProgressBar = ({ used, max, pct, label, color }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 12, marginBottom: 6
      }}>
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{label}</span>
        <span style={{ color: 'var(--text-secondary)' }}>
          {max === null ? `${used} / Unlimited` : `${used} / ${max.toLocaleString()}`}
        </span>
      </div>
      <div style={{
        height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden'
      }}>
        <div style={{
          height: '100%', borderRadius: 4,
          width: `${Math.min(pct, 100)}%`,
          background: pct >= 90 ? 'var(--danger)' : pct >= 70 ? 'var(--warning)' : color,
          transition: 'width 0.3s ease'
        }} />
      </div>
      {pct >= 90 && max !== null && (
        <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>
          ⚠️ Almost at limit!{' '}
          <span
            onClick={() => navigate('/billing')}
            style={{ textDecoration: 'underline', cursor: 'pointer' }}
          >
            Upgrade plan
          </span>
        </div>
      )}
    </div>
  )

  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 10, padding: 20,
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid var(--border)',
      marginBottom: 24
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 16
      }}>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          🚦 Usage & Limits
        </div>
        <span style={{
          fontSize: 12, padding: '3px 10px', borderRadius: 20,
          background: plan === 'free' ? '#f3f4f6' : plan === 'pro' ? '#e8f0fe' : '#e3fcef',
          color:      plan === 'free' ? '#555' : plan === 'pro' ? '#1a56db' : '#057a55',
          fontWeight: 500, textTransform: 'capitalize'
        }}>
          {plan} plan
        </span>
      </div>

      <ProgressBar
        label="Team Members"
        used={l.members.used}
        max={l.members.max}
        pct={l.members.pct}
        color="var(--accent)"
      />
      <ProgressBar
        label="API Calls (this month)"
        used={l.apiCalls.used}
        max={l.apiCalls.max}
        pct={l.apiCalls.pct}
        color="var(--success)"
      />

      {plan === 'free' && (
        <button
          onClick={() => navigate('/billing')}
          style={{
            width: '100%', padding: '8px', borderRadius: 8,
            border: 'none', background: 'var(--accent)',
            color: '#1e1e2e', fontWeight: 600, fontSize: 13,
            cursor: 'pointer', marginTop: 4
          }}
        >
          ⚡ Upgrade for more
        </button>
      )}
    </div>
  )
}