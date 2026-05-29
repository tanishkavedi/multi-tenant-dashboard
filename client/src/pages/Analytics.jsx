import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'

export default function Analytics() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')
  const org  = JSON.parse(localStorage.getItem('org'))

  const [apiCalls, setApiCalls]  = useState([])
  const [breakdown, setBreakdown] = useState([])
  const [summary, setSummary]   = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      axios.get('http://localhost:5000/api/analytics/api-calls', { headers }),
      axios.get('http://localhost:5000/api/analytics/breakdown', { headers }),
      axios.get('http://localhost:5000/api/analytics/summary', { headers }),
    ]).then(([callsRes, breakdownRes, summaryRes]) => {
      // format date for display
      setApiCalls(callsRes.data.map(row => ({
        day: new Date(row.day).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        calls: parseInt(row.calls)
      })))
      setBreakdown(breakdownRes.data.map(row => ({
        name: row.event_type,
        count: parseInt(row.count)
      })))
      setSummary(summaryRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const COLORS = {
    api_call: '#89b4fa',
    login: '#a6e3a1',
    export: '#fab387',
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
            { label: '🏠  Dashboard',  path: '/dashboard'  },
            { label: '📊  Analytics',  path: '/analytics'  },
            { label: '👥  Members', path: '/members'    },
            { label: '💳  Billing', path: '/billing'    },
            { label: '⚙️  Settings', path: '/settings'   },
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
      <div style={{ flex: 1, background: '#f8f9fa', padding: 32 }}>
        <h2 style={{ margin: '0 0 4px' }}>Analytics</h2>
        <p style={{ margin: '0 0 24px', color: '#666', fontSize: 14 }}>
          Your organization's usage over the last 30 days
        </p>

        {loading ? (
          <div style={{ color: '#888', fontSize: 14 }}>Loading analytics...</div>
        ) : (
          <>
            {/* ── Summary cards ── */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16, marginBottom: 28
            }}>
              {[
                { label: 'Total Events',  value: summary?.total,  color: '#89b4fa', icon: '⚡' },
                { label: 'API Calls',  value: summary?.api_calls, color: '#89b4fa', icon: '🔌' },
                { label: 'Logins',  value: summary?.logins,    color: '#a6e3a1', icon: '🔐' },
                { label: 'Exports',  value: summary?.exports,  color: '#fab387', icon: '📤' },
              ].map(card => (
                <div key={card.label} style={{
                  background: '#fff', borderRadius: 10, padding: '18px 20px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                }}>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>
                    {card.icon} {card.label}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 600, color: card.color }}>
                    {card.value ?? 0}
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>last 30 days</div>
                </div>
              ))}
            </div>

            {/* ── Area chart — API calls over time ── */}
            <div style={{
              background: '#fff', borderRadius: 10, padding: 24,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 24
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>📈 API Calls — Last 30 days</div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>
                Daily API call volume for {org?.name}
              </div>
              {apiCalls.length === 0 ? (
                <div style={{ color: '#aaa', fontSize: 13, padding: '20px 0' }}>
                  No API call data yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={apiCalls}>
                    <defs>
                      <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#89b4fa" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#89b4fa" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11 }}
                      interval={4}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="calls"
                      stroke="#89b4fa"
                      strokeWidth={2}
                      fill="url(#colorCalls)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* ── Bar chart — events breakdown ── */}
            <div style={{
              background: '#fff', borderRadius: 10, padding: 24,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>📊 Events Breakdown</div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>
                All event types in the last 30 days
              </div>
              {breakdown.length === 0 ? (
                <div style={{ color: '#aaa', fontSize: 13, padding: '20px 0' }}>
                  No events yet.
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={breakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {breakdown.map((entry) => (
                          <rect
                            key={entry.name}
                            fill={COLORS[entry.name] || '#89b4fa'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
                    {breakdown.map(item => (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <div style={{
                          width: 10, height: 10, borderRadius: 2,
                          background: COLORS[item.name] || '#89b4fa'
                        }} />
                        <span style={{ color: '#555' }}>{item.name}</span>
                        <span style={{ color: '#888' }}>({item.count})</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}