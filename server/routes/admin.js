const express = require('express')
const pool  = require('../db')
const jwt = require('jsonwebtoken')

const router = express.Router()

//  auth + super admin check 
const adminAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // check if user is super admin
    const result = await pool.query(
      'SELECT is_super_admin FROM users WHERE id = $1',
      [decoded.userId]
    )
    if (!result.rows[0]?.is_super_admin)
      return res.status(403).json({ error: 'Super admin access required' })
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

//  GET platform summary 
router.get('/summary', adminAuth, async (req, res) => {
  try {
    const [orgsResult, usersResult, subsResult, eventsResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM organizations'),
      pool.query('SELECT COUNT(*) as total FROM users'),
      pool.query(`SELECT plan, COUNT(*) as count FROM organizations GROUP BY plan`),
      pool.query(`SELECT COUNT(*) as total FROM usage_events
                  WHERE created_at > NOW() - INTERVAL '30 days'`),
    ])

    res.json({
      totalOrgs:   parseInt(orgsResult.rows[0].total),
      totalUsers:  parseInt(usersResult.rows[0].total),
      planBreakdown: subsResult.rows,
      eventsThisMonth: parseInt(eventsResult.rows[0].total),
    })
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch summary' })
  }
})

//  GET all organizations 
router.get('/orgs', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*,
              COUNT(DISTINCT m.user_id) as member_count
       FROM organizations o
       LEFT JOIN org_members m ON m.org_id = o.id
       GROUP BY o.id
       ORDER BY o.created_at DESC`
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch orgs' })
  }
})

//  GET all users 
router.get('/users', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.is_super_admin,
              u.created_at, COUNT(m.org_id) as org_count
       FROM users u
       LEFT JOIN org_members m ON m.user_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch users' })
  }
})

//  DELETE an organization 
router.delete('/orgs/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM organizations WHERE id = $1', [req.params.id])
    res.json({ message: 'Organization deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Could not delete org' })
  }
})

module.exports = router