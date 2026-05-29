import { useLocation } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Sidebar from '../components/Sidebar'

const chartData = [
  { day: 'Mon', calls: 320 },
  { day: 'Tue', calls: 480 },
  { day: 'Wed', calls: 410 },
  { day: 'Thu', calls: 620 },
  { day: 'Fri', calls: 540 },
  { day: 'Sat', calls: 700 },
  { day: 'Sun', calls: 810 },
]

export default function Dashboard() {
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user'))
  const org = JSON.parse(localStorage.getItem('org'))

  const searchParams = new URLSearchParams(location.search)
  const unauthorized = searchParams.get('error') === 'unauthorized'

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      <div style={{ flex: 1, background: 'var(--bg-main)', padding: 32 }}>

        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>
            Good morning, {user?.name} 👋
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
            Here's what's happening at {org?.name}
          </p>
        </div>

        {unauthorized && (
          <div style={{
            background: '#fee2e2', border: '1px solid #fca5a5',
            borderRadius: 8, padding: '12px 16px',
            color: '#b91c1c', fontSize: 13, marginBottom: 20
          }}>
            🚫 You don't have permission to access that page.
          </div>
        )}

        {/* Metric cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16, marginBottom: 28
        }}>
          {[
            { label: 'Total Users', value: '1,284', change: '+12% this month', color: 'var(--success)' },
            { label: 'Active Now', value: '47',  change: 'across 3 orgs',  color: 'var(--text-secondary)' },
            { label: 'API Calls',  value: '89.4k', change: '82% of limit', color: 'var(--warning)' },
            { label: 'Revenue', value: '$3,200',change: '+8% vs last mo', color: 'var(--success)' },
          ].map(card => (
            <div key={card.label} style={{
              background: 'var(--bg-card)', borderRadius: 10, padding: '18px 20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                {card.label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>
                {card.value}
              </div>
              <div style={{ fontSize: 12, color: card.color, marginTop: 4 }}>
                {card.change}
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: 10, padding: 24,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid var(--border)'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
            API Usage — Last 7 days
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)'
                }}
              />
              <Bar dataKey="calls" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  )
}