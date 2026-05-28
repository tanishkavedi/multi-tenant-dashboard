import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

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
  const navigate  = useNavigate()
  const user      = JSON.parse(localStorage.getItem('user'))
  const org       = JSON.parse(localStorage.getItem('org'))

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: 200, background: '#1e1e2e', color: '#cdd6f4',
        display: 'flex', flexDirection: 'column', padding: '24px 0'
      }}>
        {/* Org name */}
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #313244' }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{org?.name}</div>
          <div style={{ fontSize: 11, color: '#a6adc8', marginTop: 4 }}>
            {org?.plan} plan
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, marginTop: 12 }}>
          {[
            { label: '🏠  Dashboard',    path: '/dashboard' },
            { label: '👥  Members',      path: '/members'   },
            { label: '💳  Billing',      path: '/billing'   },
            { label: '⚙️  Settings',     path: '/settings'  },
          ].map(item => (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                padding: '10px 20px', cursor: 'pointer', fontSize: 13,
                background: window.location.pathname === item.path ? '#313244' : 'transparent',
                borderLeft: window.location.pathname === item.path ? '3px solid #89b4fa' : '3px solid transparent',
              }}
            >
              {item.label}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div
          onClick={handleLogout}
          style={{ padding: '12px 20px', cursor: 'pointer', fontSize: 13, color: '#f38ba8' }}
        >
          🚪  Logout
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, background: '#f8f9fa', padding: 32 }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: 0 }}>Good morning, {user?.name} 👋</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>
            Here's what's happening at {org?.name}
          </p>
        </div>

        {/* Metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Users',  value: '1,284', change: '+12% this month', color: '#4caf50' },
            { label: 'Active Now',   value: '47',    change: 'across 3 orgs',   color: '#888'    },
            { label: 'API Calls',    value: '89.4k', change: '82% of limit',    color: '#ff9800' },
            { label: 'Revenue',      value: '$3,200',change: '+8% vs last mo',  color: '#4caf50' },
          ].map(card => (
            <div key={card.label} style={{
              background: '#fff', borderRadius: 10, padding: '18px 20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
            }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{card.value}</div>
              <div style={{ fontSize: 12, color: card.color, marginTop: 4 }}>{card.change}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div style={{
          background: '#fff', borderRadius: 10, padding: 24,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>API Usage — Last 7 days</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="calls" fill="#89b4fa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  )
}