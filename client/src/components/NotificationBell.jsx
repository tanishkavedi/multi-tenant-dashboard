import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const TYPE_COLORS = {
  success: { bg: '#dcfce7', color: '#166534', icon: '✅' },
  warning: { bg: '#fef9c3', color: '#854d0e', icon: '⚠️' },
  danger: { bg: '#fee2e2', color: '#b91c1c', icon: '❌' },
  info:  { bg: '#e0f2fe', color: '#075985', icon: 'ℹ️' },
}

export default function NotificationBell() {
  const token = localStorage.getItem('token')

  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount,  setUnreadCount]  = useState(0)
  const dropdownRef = useRef()

  const fetchNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        axios.get('http://localhost:5000/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/notifications/unread-count', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      setNotifications(notifRes.data)
      setUnreadCount(countRes.data.count)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleOpen = async () => {
    setOpen(!open)
    if (!open && unreadCount > 0) {
      // mark all as read when opening
      await axios.put(
        'http://localhost:5000/api/notifications/mark-read',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    await axios.delete(
      `http://localhost:5000/api/notifications/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60)   return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400)return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <div
        onClick={handleOpen}
        style={{
          cursor: 'pointer', position: 'relative',
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16
        }}
      >
        🔔
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            background: '#f38ba8', color: '#fff',
            borderRadius: '50%', width: 18, height: 18,
            fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 44, right: 0,
          width: 320, background: 'var(--bg-card)',
          border: '1px solid var(--border)', borderRadius: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 1000, overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
              🔔 Notifications
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {notifications.length} total
            </div>
          </div>

          {/* Notification list */}
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '30px', textAlign: 'center',
                color: 'var(--text-secondary)', fontSize: 13
              }}>
                🎉 You're all caught up!
              </div>
            ) : (
              notifications.map(n => {
                const typeStyle = TYPE_COLORS[n.type] || TYPE_COLORS.info
                return (
                  <div key={n.id} style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    background: n.is_read ? 'transparent' : 'rgba(137,180,250,0.05)',
                    display: 'flex', gap: 10, alignItems: 'flex-start'
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: typeStyle.bg, color: typeStyle.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, flexShrink: 0
                    }}>
                      {typeStyle.icon}
                    </div>

                    {/* Message */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                        {timeAgo(n.created_at)}
                      </div>
                    </div>

                    {/* Delete button */}
                    <div
                      onClick={(e) => handleDelete(n.id, e)}
                      style={{
                        cursor: 'pointer', color: 'var(--text-secondary)',
                        fontSize: 14, padding: '0 4px', flexShrink: 0
                      }}
                    >
                      ✕
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}