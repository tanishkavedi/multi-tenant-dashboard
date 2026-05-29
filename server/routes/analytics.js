
const express = require('express')
const pool = require('../db')
const jwt = require('jsonwebtoken')

const router = express.Router()

//  auth middleware 
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

//  GET daily API calls (last 30 days) 
router.get('/api-calls', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DATE(created_at) as day, COUNT(*) as calls
       FROM usage_events
       WHERE org_id = $1
         AND event_type = 'api_call'
         AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY day ORDER BY day`,
      [req.user.orgId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not fetch API calls' })
  }
})

//  GET events breakdown (pie chart data) 
router.get('/breakdown', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT event_type, COUNT(*) as count
       FROM usage_events
       WHERE org_id = $1
         AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY event_type ORDER BY count DESC`,
      [req.user.orgId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch breakdown' })
  }
})

//  GET summary stats 
router.get('/summary', auth, async (req, res) => {
  try {
    // total events this month
    const totalResult = await pool.query(
      `SELECT COUNT(*) as total FROM usage_events
       WHERE org_id = $1
         AND created_at > NOW() - INTERVAL '30 days'`,
      [req.user.orgId]
    )

    // total logins this month
    const loginResult = await pool.query(
      `SELECT COUNT(*) as logins FROM usage_events
       WHERE org_id = $1
         AND event_type = 'login'
         AND created_at > NOW() - INTERVAL '30 days'`,
      [req.user.orgId]
    )

    // total exports this month
    const exportResult = await pool.query(
      `SELECT COUNT(*) as exports FROM usage_events
       WHERE org_id = $1
         AND event_type = 'export'
         AND created_at > NOW() - INTERVAL '30 days'`,
      [req.user.orgId]
    )

    // total api calls this month
    const apiResult = await pool.query(
      `SELECT COUNT(*) as api_calls FROM usage_events
       WHERE org_id = $1
         AND event_type = 'api_call'
         AND created_at > NOW() - INTERVAL '30 days'`,
      [req.user.orgId]
    )

    res.json({
      total: parseInt(totalResult.rows[0].total),
      logins: parseInt(loginResult.rows[0].logins),
      exports: parseInt(exportResult.rows[0].exports),
      api_calls:parseInt(apiResult.rows[0].api_calls),
    })
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch summary' })
  }
})

//  LOG a new event (call this from anywhere in your app) 
router.post('/log', auth, async (req, res) => {
  const { event_type, metadata } = req.body
  if (!event_type)
    return res.status(400).json({ error: 'event_type is required' })

  try {
    await pool.query(
      `INSERT INTO usage_events (org_id, event_type, metadata)
       VALUES ($1, $2, $3)`,
      [req.user.orgId, event_type, metadata || {}]
    )
    res.json({ message: 'Event logged' })
  } catch (err) {
    res.status(500).json({ error: 'Could not log event' })
  }
})

module.exports = router