const express = require('express')
const pool = require('../db')
const jwt = require('jsonwebtoken')

const router = express.Router()

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

//  GET all notifications for this org 
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE org_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.user.orgId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch notifications' })
  }
})

//  GET unread count 
router.get('/unread-count', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM notifications
       WHERE org_id = $1 AND is_read = false`,
      [req.user.orgId]
    )
    res.json({ count: parseInt(result.rows[0].count) })
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch count' })
  }
})

//  MARK all as read 
router.put('/mark-read', auth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = true
       WHERE org_id = $1`,
      [req.user.orgId]
    )
    res.json({ message: 'All marked as read' })
  } catch (err) {
    res.status(500).json({ error: 'Could not mark as read' })
  }
})

//  CREATE a notification (used internally) 
router.post('/', auth, async (req, res) => {
  const { message, type } = req.body
  try {
    await pool.query(
      `INSERT INTO notifications (org_id, user_id, message, type)
       VALUES ($1, $2, $3, $4)`,
      [req.user.orgId, req.user.userId, message, type || 'info']
    )
    res.json({ message: 'Notification created' })
  } catch (err) {
    res.status(500).json({ error: 'Could not create notification' })
  }
})

//  DELETE a notification 
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM notifications WHERE id = $1 AND org_id = $2`,
      [req.params.id, req.user.orgId]
    )
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Could not delete' })
  }
})

module.exports = router