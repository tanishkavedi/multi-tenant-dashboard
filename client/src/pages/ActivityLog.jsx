import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import Sidebar from '../components/Sidebar'

const ACTION_STYLES = {
  member_added: { icon: '👤', color: '#a6e3a1', label: 'Member added' },
  member_removed: { icon: '❌', color: '#f38ba8', label: 'Member removed' },
  org_created: { icon: '🏢', color: '#89b4fa', label: 'Org created' },
  org_updated: { icon: '✏️', color: '#fab387', label: 'Org updated' },
  plan_changed: { icon: '💳', color: '#cba6f7', label: 'Plan changed' },
  invite_sent: { icon: '📧', color: '#89dceb', label: 'Invite sent' },
  default: { icon: '⚡', color: '#a6adc8', label: 'Action' },
}

export default function ActivityLog() {
  const token = localStorage.getItem('token')

  const [logs, setLogs]= useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    axios.get('http://localhost:5000/api/activity', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setLogs(res.data)
    }).finally(() => setLoading(false))
  }, [])

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter(l => l.action === filter)

  const uniqueActions = [...new Set(logs.map(l => l.action))]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <Sidebar />

      <div style={{ flex: 1, background: 'var(--bg-main)', padding: 32 }}>
        <h2 style={{ margin: '0 0 4px', color: 'var(--text-primary)' }}>
          Activity Log
        </h2>
        <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: 14 }}>
          Everything that happened in your organization
        </p>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['all', ...uniqueActions].map(action => {
            const style = ACTION_STYLES[action] || ACTION_STYLES.default
            return (
              <button
                key={action}
                onClick={() => setFilter(action)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12,
                  cursor: 'pointer', border: 'none', fontWeight: 500,
                  background: filter === action ? style.color : 'var(--bg-card)',
                  color:      filter === action ? '#1e1e2e' : 'var(--text-secondary)',
                }}
              >
                {action === 'all' ? '⚡ All' : `${style.icon} ${style.label}`}
              </button>
            )
          })}
        </div>

        {/* Activity list */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          border: '1px solid var(--border)', overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
              No activity yet 🌱
            </div>
          ) : (
            filteredLogs.map((log, i) => {
              const style = ACTION_STYLES[log.action] || ACTION_STYLES.default
              return (
                <div key={log.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: '16px 20px',
                  borderBottom: i < filteredLogs.length - 1
                    ? '1px solid var(--border)' : 'none'
                }}>
                  {/* Icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: style.color + '22',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 16
                  }}>
                    {style.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      <strong>{log.user_name}</strong> — {log.details || style.label}
                    </div>
                    <div style={{
                      display: 'inline-block', marginTop: 4,
                      fontSize: 11, padding: '2px 8px', borderRadius: 20,
                      background: style.color + '22', color: style.color
                    }}>
                      {style.label}
                    </div>
                  </div>

                  {/* Time */}
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>
                    {timeAgo(log.created_at)}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}