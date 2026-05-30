import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'

export default function AcceptInvite() {
  const navigate  = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError]  = useState('')
  const [loading,  setLoading] = useState(false)
  const [needsAccount, setNeedsAccount] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid invite link')
    }
  }, [token])

  const handleAccept = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await axios.post('http://localhost:5000/api/invitations/accept', {
        token, name, password
      })
      setMessage('Invite accepted! Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Something went wrong'
      if (errMsg.includes('Name and password')) setNeedsAccount(true)
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-main)', fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 12, padding: 36,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: 400,
        border: '1px solid var(--border)'
      }}>
        <h2 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>
          🎉 You're invited!
        </h2>
        <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: 14 }}>
          You've been invited to join an organization on SaaS Dashboard.
        </p>

        {message && (
          <div style={{
            background: '#dcfce7', border: '1px solid #86efac',
            borderRadius: 8, padding: '12px 16px', color: '#166534',
            fontSize: 13, marginBottom: 16
          }}>✅ {message}</div>
        )}
        {error && (
          <div style={{
            background: '#fee2e2', border: '1px solid #fca5a5',
            borderRadius: 8, padding: '12px 16px', color: '#b91c1c',
            fontSize: 13, marginBottom: 16
          }}>❌ {error}</div>
        )}

        <form onSubmit={handleAccept} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {needsAccount && (
            <>
              <input
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{
                  padding: '9px 12px', borderRadius: 6, fontSize: 13,
                  border: '1px solid var(--border)', background: 'var(--bg-main)',
                  color: 'var(--text-primary)'
                }}
                required
              />
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  padding: '9px 12px', borderRadius: 6, fontSize: 13,
                  border: '1px solid var(--border)', background: 'var(--bg-main)',
                  color: 'var(--text-primary)'
                }}
                required
              />
            </>
          )}

          <button type="submit" disabled={loading || !token} style={{
            padding: '10px', borderRadius: 8, border: 'none',
            background: 'var(--accent)', color: '#1e1e2e',
            fontWeight: 600, fontSize: 14, cursor: 'pointer'
          }}>
            {loading ? 'Accepting...' : 'Accept Invitation'}
          </button>
        </form>
      </div>
    </div>
  )
}