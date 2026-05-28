import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    features: ['1 team member', '10k API calls/mo', 'Community support'],
    color:'#888',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$49',
    features: ['5 team members', '100k API calls/mo', 'Priority support', 'Analytics'],
    color:'#89b4fa',
    popular: true,
  },
  {
    key: 'enterprise',
    name:  'Enterprise',
    price: '$99',
    features: ['Unlimited members', 'Unlimited API calls', '24/7 support', 'Custom integrations'],
    color: '#a6e3a1',
  },
]

export default function Billing() {
  const navigate = useNavigate()
  const location = useLocation()
  const token  = localStorage.getItem('token')
  const org  = JSON.parse(localStorage.getItem('org'))

  const [subscription, setSubscription] = useState(null)
  const [message, setMessage]  = useState('')
  const [error, setError]  = useState('')
  const [loading, setLoading]  = useState(false)

  const fetchSubscription = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/billing/subscription', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSubscription(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { fetchSubscription() }, [])

  const handleUpgrade = async (planKey) => {
    setLoading(true)
    setMessage('')
    setError('')
    try {
      const res = await axios.post(
        'http://localhost:5000/api/billing/upgrade',
        { plan: planKey },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessage(res.data.message)
      fetchSubscription()   
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel? You will go back to the free plan.')) return
    setLoading(true)
    setMessage('')
    setError('')
    try {
      const res = await axios.post(
        'http://localhost:5000/api/billing/cancel',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessage(res.data.message)
      fetchSubscription()
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const currentPlan = subscription?.plan || 'free'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: 200, background: '#1e1e2e', color: '#cdd6f4',
        display: 'flex', flexDirection: 'column', padding: '24px 0'
      }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #313244' }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{org?.name}</div>
          <div style={{ fontSize: 11, color: '#a6adc8', marginTop: 4 }}>{currentPlan} plan</div>
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
        <h2 style={{ margin: '0 0 4px' }}>Billing & Plans</h2>
        <p style={{ margin: '0 0 24px', color: '#666', fontSize: 14 }}>
          You are currently on the <strong>{currentPlan}</strong> plan
        </p>

        {/* Success / error messages */}
        {message && (
          <div style={{
            background: '#dcfce7', border: '1px solid #86efac',
            borderRadius: 8, padding: '12px 16px', color: '#166534',
            fontSize: 13, marginBottom: 20
          }}>
            🎉 {message}
          </div>
        )}
        {error && (
          <div style={{
            background: '#fee2e2', border: '1px solid #fca5a5',
            borderRadius: 8, padding: '12px 16px', color: '#b91c1c',
            fontSize: 13, marginBottom: 20
          }}>
            ❌ {error}
          </div>
        )}

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
          {PLANS.map(plan => (
            <div key={plan.key} style={{
              background: '#fff', borderRadius: 12, padding: 24,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              border: currentPlan === plan.key ? `2px solid ${plan.color}` : '2px solid transparent',
              position: 'relative'
            }}>
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: '#89b4fa', color: '#1e1e2e', fontSize: 11,
                  padding: '3px 12px', borderRadius: 20, fontWeight: 600
                }}>
                  MOST POPULAR
                </div>
              )}

              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>{plan.name}</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
                {plan.price}
                <span style={{ fontSize: 14, color: '#888', fontWeight: 400 }}>/mo</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', fontSize: 13 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ padding: '4px 0', color: '#444' }}>✅ {f}</li>
                ))}
              </ul>

              {currentPlan === plan.key ? (
                <div style={{
                  textAlign: 'center', padding: 8, borderRadius: 8,
                  background: '#f3f4f6', color: '#888', fontSize: 13, fontWeight: 500
                }}>
                  ✓ Current plan
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={loading}
                  style={{
                    width: '100%', padding: 10, borderRadius: 8, border: 'none',
                    background: plan.color, color: '#1e1e2e',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  {loading ? 'Please wait...' : `Switch to ${plan.name}`}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Cancel section */}
        {currentPlan !== 'free' && (
          <div style={{
            background: '#fff', borderRadius: 10, padding: 20,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontWeight: 600, color: '#b91c1c', marginBottom: 6 }}>
              Cancel subscription
            </div>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px' }}>
              You will be downgraded to the free plan immediately.
            </p>
            <button
              onClick={handleCancel}
              disabled={loading}
              style={{
                padding: '8px 18px', borderRadius: 8, fontSize: 13,
                border: '1px solid #fca5a5', background: 'transparent',
                color: '#b91c1c', cursor: 'pointer'
              }}
            >
              Cancel subscription
            </button>
          </div>
        )}
      </div>
    </div>
  )
}