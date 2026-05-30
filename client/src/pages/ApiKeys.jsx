
import { useEffect, useState } from 'react'
import axios from 'axios'
import Sidebar from '../components/Sidebar'

export default function ApiKeys() {
  const token = localStorage.getItem('token')

  const [keys, setKeys] = useState([])
  const [name, setName] = useState('')
  const [expiresIn, setExpiresIn] = useState('never')
  const [newKey,  setNewKey]  = useState(null)
  const [message,  setMessage] = useState('')
  const [error,   setError]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [copied,  setCopied]  = useState(false)

  const fetchKeys = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/keys', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setKeys(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { fetchKeys() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setMessage(''); setError(''); setLoading(true); setNewKey(null)
    try {
      const res = await axios.post(
        'http://localhost:5000/api/keys',
        { name, expiresIn },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setNewKey(res.data.key)
      setName('')
      setExpiresIn('never')
      fetchKeys()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create key')
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (id) => {
    if (!window.confirm('Revoke this API key? This cannot be undone.')) return
    try {
      await axios.delete(`http://localhost:5000/api/keys/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessage('Key revoked successfully')
      fetchKeys()
    } catch (err) {
      setError('Could not revoke key')
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(newKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const timeAgo = (date) => {
    if (!date) return 'Never'
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60)  return 'just now'
    if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return new Date(date).toLocaleDateString()
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <Sidebar />

      <div style={{ flex: 1, background: 'var(--bg-main)', padding: 32 }}>
        <h2 style={{ margin: '0 0 4px', color: 'var(--text-primary)' }}>🔑 API Keys</h2>
        <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: 14 }}>
          Generate API keys to access your organization's data programmatically
        </p>

        {/* ── New key shown once ── */}
        {newKey && (
          <div style={{
            background: '#dcfce7', border: '1px solid #86efac',
            borderRadius: 10, padding: 20, marginBottom: 24
          }}>
            <div style={{ fontWeight: 600, color: '#166534', marginBottom: 8 }}>
              ✅ API key created! Copy it now — you won't see it again!
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#f0fdf4', borderRadius: 6, padding: '10px 14px',
              border: '1px solid #86efac'
            }}>
              <code style={{ flex: 1, fontSize: 13, color: '#166534', wordBreak: 'break-all' }}>
                {newKey}
              </code>
              <button onClick={handleCopy} style={{
                padding: '6px 14px', borderRadius: 6, border: 'none',
                background: '#166534', color: '#fff',
                fontSize: 12, cursor: 'pointer', flexShrink: 0
              }}>
                {copied ? '✅ Copied!' : '📋 Copy'}
              </button>
            </div>
          </div>
        )}

        {message && (
          <div style={{
            background: '#dcfce7', border: '1px solid #86efac',
            borderRadius: 8, padding: '12px 16px', color: '#166534',
            fontSize: 13, marginBottom: 20
          }}>✅ {message}</div>
        )}
        {error && (
          <div style={{
            background: '#fee2e2', border: '1px solid #fca5a5',
            borderRadius: 8, padding: '12px 16px', color: '#b91c1c',
            fontSize: 13, marginBottom: 20
          }}>❌ {error}</div>
        )}

        {/* ── Create key form ── */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: 10, padding: 20,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          border: '1px solid var(--border)', marginBottom: 24
        }}>
          <div style={{ fontWeight: 600, marginBottom: 14, color: 'var(--text-primary)' }}>
            ➕ Create new API key
          </div>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              placeholder="Key name (e.g. Production, Testing)"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={{
                flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 6,
                border: '1px solid var(--border)', fontSize: 13,
                background: 'var(--bg-main)', color: 'var(--text-primary)'
              }}
            />
            <select
              value={expiresIn}
              onChange={e => setExpiresIn(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 6,
                border: '1px solid var(--border)', fontSize: 13,
                background: 'var(--bg-main)', color: 'var(--text-primary)'
              }}
            >
              <option value="never">Never expires</option>
              <option value="30d">30 days</option>
              <option value="90d">90 days</option>
              <option value="365d">1 year</option>
            </select>
            <button type="submit" disabled={loading} style={{
              padding: '8px 18px', borderRadius: 6, border: 'none',
              background: 'var(--accent)', color: '#1e1e2e',
              fontWeight: 600, fontSize: 13, cursor: 'pointer'
            }}>
              {loading ? 'Creating...' : '🔑 Create Key'}
            </button>
          </form>
        </div>

        {/* ── Keys list ── */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          border: '1px solid var(--border)', overflow: 'hidden'
        }}>
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid var(--border)',
            fontWeight: 600, fontSize: 14, color: 'var(--text-primary)'
          }}>
            Your API keys ({keys.length})
          </div>

          {keys.length === 0 ? (
            <div style={{
              padding: 30, textAlign: 'center',
              color: 'var(--text-secondary)', fontSize: 13
            }}>
              No API keys yet. Create one above!
            </div>
          ) : (
            keys.map((key, i) => (
              <div key={key.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 20px',
                borderBottom: i < keys.length - 1 ? '1px solid var(--border)' : 'none',
                opacity: key.is_active ? 1 : 0.5
              }}>
                {/* Key icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: key.is_active ? 'rgba(137,180,250,0.2)' : 'rgba(166,173,200,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
                }}>
                  🔑
                </div>

                {/* Key info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>
                    {key.name}
                    {!key.is_active && (
                      <span style={{
                        marginLeft: 8, fontSize: 11, padding: '2px 8px',
                        borderRadius: 20, background: '#fee2e2', color: '#b91c1c'
                      }}>Revoked</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    <code style={{ background: 'var(--bg-main)', padding: '1px 6px', borderRadius: 4 }}>
                      {key.key_prefix}••••••••••••••••
                    </code>
                    {' · '}Created {timeAgo(key.created_at)}
                    {key.last_used && ` · Last used ${timeAgo(key.last_used)}`}
                    {key.expires_at && ` · Expires ${new Date(key.expires_at).toLocaleDateString()}`}
                  </div>
                </div>

                {/* Revoke button */}
                {key.is_active && (
                  <button onClick={() => handleRevoke(key.id)} style={{
                    fontSize: 12, padding: '4px 12px', borderRadius: 6,
                    border: '1px solid var(--danger)', background: 'transparent',
                    color: 'var(--danger)', cursor: 'pointer', flexShrink: 0
                  }}>
                    Revoke
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Info box */}
        <div style={{
          marginTop: 20, padding: 16, borderRadius: 10,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            ℹ️ How to use your API key
          </div>
          <div>Pass it in the Authorization header of your requests:</div>
          <code style={{
            display: 'block', marginTop: 8, padding: '10px 14px',
            background: 'var(--bg-main)', borderRadius: 6, fontSize: 12,
            color: 'var(--accent)'
          }}>
            Authorization: Bearer sk_live_xxxxxxxxxxxxxxxx
          </code>
        </div>

      </div>
    </div>
  )
}