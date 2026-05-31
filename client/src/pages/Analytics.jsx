import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import Sidebar from '../components/Sidebar'

export default function Analytics() {
  const token = localStorage.getItem('token')

  const [apiCalls,  setApiCalls]  = useState([])
  const [breakdown, setBreakdown] = useState([])
  const [summary,  setSummary]   = useState(null)
  const [loading,  setLoading]   = useState(true)

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      axios.get('http://localhost:5000/api/analytics/api-calls',  { headers }),
      axios.get('http://localhost:5000/api/analytics/breakdown',  { headers }),
      axios.get('http://localhost:5000/api/analytics/summary',    { headers }),
    ]).then(([callsRes, breakdownRes, summaryRes]) => {
      setApiCalls(callsRes.data.map(row => ({
        day:   new Date(row.day).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        calls: parseInt(row.calls)
      })))
      setBreakdown(breakdownRes.data.map(row => ({
        name:  row.event_type,
        count: parseInt(row.count)
      })))
      setSummary(summaryRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const COLORS = {
    api_call: '#89b4fa',
    login:  '#a6e3a1',
    export: '#fab387',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <Sidebar />

      <div style={{ flex: 1, background: 'var(--bg-main)', padding: 32 }}>
        <h2 style={{ margin: '0 0 4px', color: 'var(--text-primary)' }}>Analytics</h2>
        <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: 14 }}>
          Your organization's usage over the last 30 days
        </p>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Loading analytics...
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16, marginBottom: 28
            }}>
              {[
                { label: 'Total Events', value: summary?.total,     color: '#89b4fa', icon: '⚡' },
                { label: 'API Calls',  value: summary?.api_calls, color: '#89b4fa', icon: '🔌' },
                { label: 'Logins',   value: summary?.logins,  color: '#a6e3a1', icon: '🔐' },
                { label: 'Exports',  value: summary?.exports,  color: '#fab387', icon: '📤' },
              ].map(card => (
                <div key={card.label} style={{
                  background: 'var(--bg-card)', borderRadius: 10, padding: '18px 20px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    {card.icon} {card.label}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 600, color: card.color }}>
                    {card.value ?? 0}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                    last 30 days
                  </div>
                </div>
              ))}
            </div>

            {/* Area chart */}
            <div style={{
              background: 'var(--bg-card)', borderRadius: 10, padding: 24,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              border: '1px solid var(--border)', marginBottom: 24
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
                📈 API Calls — Last 30 days
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Daily API call volume
              </div>
              {apiCalls.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: 13, padding: '20px 0' }}>
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
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} interval={4} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                    <Tooltip contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)'
                    }} />
                    <Area
                      type="monotone" dataKey="calls"
                      stroke="#89b4fa" strokeWidth={2}
                      fill="url(#colorCalls)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Bar chart */}
            <div style={{
              background: 'var(--bg-card)', borderRadius: 10, padding: 24,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid var(--border)'
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
                📊 Events Breakdown
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                All event types in the last 30 days
              </div>
              {breakdown.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: 13, padding: '20px 0' }}>
                  No events yet.
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={breakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                      <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                      <Tooltip contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)'
                      }} />
                      <Bar dataKey="count" fill="#89b4fa" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
                    {breakdown.map(item => (
                      <div key={item.name} style={{
                        display: 'flex', alignItems: 'center', gap: 6, fontSize: 12
                      }}>
                        <div style={{
                          width: 10, height: 10, borderRadius: 2,
                          background: COLORS[item.name] || '#89b4fa'
                        }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>({item.count})</span>
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