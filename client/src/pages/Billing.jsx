import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import Sidebar from '../components/Sidebar'

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: '₹0',
    features: ['1 team member', '10k API calls/mo', 'Community support'],
    color: '#888',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '₹49',
    features: ['5 team members', '100k API calls/mo', 'Priority support', 'Analytics'],
    color: '#89b4fa',
    popular:  true,
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: '₹99',
    features: ['Unlimited members', 'Unlimited API calls', '24/7 support', 'Custom integrations'],
    color: '#a6e3a1',
  },
]

export default function Billing() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const [subscription, setSubscription] = useState(null)
  const [message,  setMessage]  = useState('')
  const [error,  setError]  = useState('')
  const [loading, setLoading] = useState(false)

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
    setLoading(true); setMessage(''); setError('')
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
    if (!window.confirm('Cancel subscription? You will go back to the free plan.')) return
    setLoading(true); setMessage(''); setError('')
    try {
      const res = await axios.post(
        'http://localhost:5000/api/billing/cancel', {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessage(res.data.message)
      fetchSubscription()
    } catch (err) {
      setError('Could not cancel subscription')
    } finally {
      setLoading(false)
    }
  }

  const currentPlan = subscription?.plan || 'free'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <Sidebar />

      <div style={{ flex: 1, background: 'var(--bg-main)', padding: 32 }}>
        <h2 style={{ margin: '0 0 4px', color: 'var(--text-primary)' }}>Billing & Plans</h2>
        <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: 14 }}>
          You are on the <strong>{currentPlan}</strong> plan
        </p>

        {message && (
          <div style={{
            background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8,
            padding: '12px 16px', color: '#166534', fontSize: 13, marginBottom: 20
          }}>🎉 {message}</div>
        )}
        {error && (
          <div style={{
            background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8,
            padding: '12px 16px', color: '#b91c1c', fontSize: 13, marginBottom: 20
          }}>❌ {error}</div>
        )}

        {/* Plan cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20, marginBottom: 32
        }}>
          {PLANS.map(plan => (
            <div key={plan.key} style={{
              background: 'var(--bg-card)', borderRadius: 12, padding: 24,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)', position: 'relative',
              border: currentPlan === plan.key
                ? `2px solid ${plan.color}`
                : '2px solid var(--border)',
            }}>
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#89b4fa', color: '#1e1e2e', fontSize: 11,
                  padding: '3px 12px', borderRadius: 20, fontWeight: 600
                }}>MOST POPULAR</div>
              )}
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6, color: 'var(--text-primary)' }}>
                {plan.name}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
                {plan.price}
                <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 400 }}>/mo</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', fontSize: 13 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ padding: '4px 0', color: 'var(--text-secondary)' }}>✅ {f}</li>
                ))}
              </ul>
              {currentPlan === plan.key ? (
                <div style={{
                  textAlign: 'center', padding: 8, borderRadius: 8,
                  background: 'var(--bg-main)', color: 'var(--text-secondary)',
                  fontSize: 13, fontWeight: 500
                }}>✓ Current plan</div>
              ) : (
                <button onClick={() => handleUpgrade(plan.key)} disabled={loading} style={{
                  width: '100%', padding: 10, borderRadius: 8, border: 'none',
                  background: plan.color, color: '#1e1e2e',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer'
                }}>
                  {loading ? 'Please wait...' : `Switch to ${plan.name}`}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Cancel section */}
        {currentPlan !== 'free' && (
          <div style={{
            background: 'var(--bg-card)', borderRadius: 10, padding: 20,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid var(--border)'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--danger)', marginBottom: 6 }}>
              Cancel subscription
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
              You will be downgraded to the free plan immediately.
            </p>
            <button onClick={handleCancel} disabled={loading} style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13,
              border: '1px solid var(--danger)', background: 'transparent',
              color: 'var(--danger)', cursor: 'pointer'
            }}>
              Cancel subscription
            </button>
          </div>
        )}
      </div>
    </div>
  )
}