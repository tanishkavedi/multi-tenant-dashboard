import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import Sidebar from '../components/Sidebar'


import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'

export default function Analytics() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')
  const org  = JSON.parse(localStorage.getItem('org'))

  const [apiCalls, setApiCalls]  = useState([])
  const [breakdown, setBreakdown] = useState([])
  const [summary, setSummary]   = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      axios.get('http://localhost:5000/api/analytics/api-calls', { headers }),
      axios.get('http://localhost:5000/api/analytics/breakdown', { headers }),
      axios.get('http://localhost:5000/api/analytics/summary', { headers }),
    ]).then(([callsRes, breakdownRes, summaryRes]) => {
      // format date for display
      setApiCalls(callsRes.data.map(row => ({
        day: new Date(row.day).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        calls: parseInt(row.calls)
      })))
      setBreakdown(breakdownRes.data.map(row => ({
        name: row.event_type,
        count: parseInt(row.count)
      })))
      setSummary(summaryRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const COLORS = {
    api_call: '#89b4fa',
    login: '#a6e3a1',
    export: '#fab387',
  }

  return (
    <Sidebar />
  )
}