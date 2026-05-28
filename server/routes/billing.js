
const express = require('express')
const pool    = require('../db')
const jwt     = require('jsonwebtoken')

const router = express.Router()

// auth middleware
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

//  GET current subscription 

router.get('/subscription', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM subscriptions WHERE org_id = $1',
      [req.user.orgId]
    )
    res.json(result.rows[0] || { plan: 'free', status: 'active' })
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch subscription' })
  }
})

//  UPGRADE plan (simulates what Stripe webhook would do) 

router.post('/upgrade', auth, async (req, res) => {
  const { plan } = req.body

  const validPlans = ['free', 'pro', 'enterprise']
  if (!validPlans.includes(plan))
    return res.status(400).json({ error: 'Invalid plan' })

  try {
    // upsert subscription row
    await pool.query(
      `INSERT INTO subscriptions (org_id, plan, status)
       VALUES ($1, $2, 'active')
       ON CONFLICT (org_id)
       DO UPDATE SET plan = $2, status = 'active'`,
      [req.user.orgId, plan]
    )

    // update org plan too
    await pool.query(
      'UPDATE organizations SET plan = $1 WHERE id = $2',
      [plan, req.user.orgId]
    )

    res.json({ message: `Successfully upgraded to ${plan} plan!` })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not upgrade plan' })
  }
})

// CANCEL — go back to free 

router.post('/cancel', auth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE subscriptions SET plan = 'free', status = 'cancelled'
       WHERE org_id = $1`,
      [req.user.orgId]
    )
    await pool.query(
      "UPDATE organizations SET plan = 'free' WHERE id = $1",
      [req.user.orgId]
    )
    res.json({ message: 'Subscription cancelled. You are now on the free plan.' })
  } catch (err) {
    res.status(500).json({ error: 'Could not cancel subscription' })
  }
})

module.exports = router