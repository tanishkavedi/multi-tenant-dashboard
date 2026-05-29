

import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const ROLE_COLORS = {
  owner:  { bg: '#e8f0fe', color: '#1a56db' },
  admin:  { bg: '#e3fcef', color: '#057a55' },
  member: { bg: '#f3f4f6', color: '#555'    },
}

export default function Members() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))
  const org = JSON.parse(localStorage.getItem('org'))
  const token = localStorage.getItem('token')

  const [members, setMembers]   = useState([])
  const [email, setEmail]       = useState('')
  const [role, setRole]         = useState('member')
  const [message, setMessage]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  // fetch members on load
  const fetchMembers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/members', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMembers(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { fetchMembers() }, [])

  // invite a member
  const handleInvite = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setLoading(true)
    try {
      const res = await axios.post(
        'http://localhost:5000/api/members/invite',
        { email, role },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessage(res.data.message)
      setEmail('')
      fetchMembers()   // refresh list
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // remove a member
  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this member?')) return
    try {
      await axios.delete(`http://localhost:5000/api/members/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchMembers()  // refresh list
    } catch (err) {
      alert(err.response?.data?.error || 'Could not remove')
    }
  }

  return (
    <Sidebar />
  )
}