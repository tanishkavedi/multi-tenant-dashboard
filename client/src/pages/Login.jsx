import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', form)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('org', JSON.stringify(res.data.org))
      localStorage.setItem('user', JSON.stringify(res.data.user))
      localStorage.setItem('orgs', JSON.stringify(res.data.orgs))
      navigate('/dashboard')


       if (res.data.orgs.length > 1) {
      navigate('/pick-org')
    } else {
      navigate('/dashboard')
    }

    
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials')
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input name="email"    placeholder="Email"    type="email"  onChange={handleChange} required />
        <input name="password" placeholder="Password" type="password" onChange={handleChange} required />
        <button type="submit">Login</button>
      </form>
      <p>No account? <a href="/register">Register</a></p>
    </div>
  )
}