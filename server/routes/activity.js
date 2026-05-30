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

//  GET activity log for org 
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.name as user_name, u.avatar_url
       FROM activity_logs a
       JOIN users u ON u.id = a.user_id
       WHERE a.org_id = $1
       ORDER BY a.created_at DESC
       LIMIT 50`,
      [req.user.orgId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch activity' })
  }
})

//  LOG a new activity (helper used by other routes) 
router.post('/', auth, async (req, res) => {
  const { action, details } = req.body
  try {
    await pool.query(
      `INSERT INTO activity_logs (org_id, user_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [req.user.orgId, req.user.userId, action, details || null]
    )
    res.json({ message: 'Logged' })
  } catch (err) {
    res.status(500).json({ error: 'Could not log activity' })
  }
})

module.exports = router