import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import Sidebar from '../components/Sidebar'

export default function Settings() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')
  const org  = JSON.parse(localStorage.getItem('org'))

  const [data, setData]   = useState(null)
  const [orgName, setOrgName]  = useState('')
  const [userName, setUserName]  = useState('')
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass]  = useState('')
  const [messages, setMessages] = useState({})
  const [errors, setErrors]   = useState({})
  const [loading, setLoading]  = useState({})

  // fetch current settings
  useEffect(() => {
    axios.get('http://localhost:5000/api/settings', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setData(res.data)
      setOrgName(res.data.org.name)
      setUserName(res.data.user.name)
    })
  }, [])

  const setMsg = (key, msg) => setMessages(p => ({ ...p, [key]: msg }))
  const setErr = (key, err) => setErrors(p => ({ ...p, [key]: err }))
  const setLoad = (key, val) => setLoading(p => ({ ...p, [key]: val }))

  // update org name
  const handleOrgUpdate = async (e) => {
    e.preventDefault()
    setMsg('org', ''); setErr('org', '')
    setLoad('org', true)
    try {
      const res = await axios.put(
        'http://localhost:5000/api/settings/org',
        { name: orgName },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMsg('org', res.data.message)
      // update localStorage so sidebar shows new name
      const updatedOrg = { ...org, name: res.data.org.name, slug: res.data.org.slug }
      localStorage.setItem('org', JSON.stringify(updatedOrg))
    } catch (err) {
      setErr('org', err.response?.data?.error || 'Could not update')
    } finally {
      setLoad('org', false)
    }
  }

  // update profile name
  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setMsg('profile', ''); setErr('profile', '')
    setLoad('profile', true)
    try {
      const res = await axios.put(
        'http://localhost:5000/api/settings/profile',
        { name: userName },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMsg('profile', res.data.message)
      const updatedUser = { ...JSON.parse(localStorage.getItem('user')), name: res.data.user.name }
      localStorage.setItem('user', JSON.stringify(updatedUser))
    } catch (err) {
      setErr('profile', err.response?.data?.error || 'Could not update')
    } finally {
      setLoad('profile', false)
    }
  }

  // change password
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setMsg('password', ''); setErr('password', '')
    setLoad('password', true)
    try {
      const res = await axios.put(
        'http://localhost:5000/api/settings/password',
        { currentPassword: currentPass, newPassword: newPass },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMsg('password', res.data.message)
      setCurrentPass('')
      setNewPass('')
    } catch (err) {
      setErr('password', err.response?.data?.error || 'Could not change password')
    } finally {
      setLoad('password', false)
    }
  }

  // delete org
  const handleDeleteOrg = async () => {
    if (!window.confirm('Are you sure? This will permanently delete your organization and cannot be undone!')) return
    if (!window.confirm('Last warning! Are you 100% sure?')) return
    try {
      await axios.delete('http://localhost:5000/api/settings/org', {
        headers: { Authorization: `Bearer ${token}` }
      })
      localStorage.clear()
      navigate('/register')
    } catch (err) {
      alert('Could not delete organization')
    }
  }

  const sectionStyle = {
    background: '#fff', borderRadius: 10, padding: 24,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20
  }
  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 6,
    border: '1px solid #ddd', fontSize: 13, marginBottom: 10,
    boxSizing: 'border-box'
  }
  const btnStyle = {
    padding: '8px 20px', borderRadius: 6, border: 'none',
    background: '#89b4fa', color: '#1e1e2e',
    fontWeight: 600, fontSize: 13, cursor: 'pointer'
  }

  return (
    <Sidebar />
  )
}