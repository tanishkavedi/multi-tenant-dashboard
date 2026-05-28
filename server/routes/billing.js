
const express   = require('express')
const Razorpay = require('razorpay')
const crypto  = require('crypto')
const pool  = require('../db')
const jwt = require('jsonwebtoken')

const router = express.Router()

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

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

//  PLANS 
const PLANS = {
  pro: { name: 'Pro',  amount: 4900  },  // amount in paise (₹49)
  enterprise: { name: 'Enterprise', amount: 9900  },  // ₹99
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

//  CREATE Razorpay order (user clicks Upgrade) 
router.post('/create-order', auth, async (req, res) => {
  const { plan } = req.body
  const planConfig = PLANS[plan]
  if (!planConfig) return res.status(400).json({ error: 'Invalid plan' })

  try {
    const order = await razorpay.orders.create({
      amount: planConfig.amount,
      currency: 'INR',
      notes: {
        orgId: req.user.orgId,
        plan,
      }
    })
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not create order' })
  }
})

// VERIFY payment after user pays 
router.post('/verify', auth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body

  // verify the payment signature (security check)
  const body  = razorpay_order_id + '|' + razorpay_payment_id
  const expected  = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex')

  if (expected !== razorpay_signature)
    return res.status(400).json({ error: 'Payment verification failed' })

  try {
    // save subscription to DB
    await pool.query(
      `INSERT INTO subscriptions (org_id, plan, status)
       VALUES ($1, $2, 'active')
       ON CONFLICT (org_id)
       DO UPDATE SET plan = $2, status = 'active'`,
      [req.user.orgId, plan]
    )

    // update org plan
    await pool.query(
      'UPDATE organizations SET plan = $1 WHERE id = $2',
      [plan, req.user.orgId]
    )

    res.json({ message: 'Payment successful! Plan upgraded.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not upgrade plan' })
  }
})

// CANCEL subscription 
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
    res.status(500).json({ error: 'Could not cancel' })
  }
})

module.exports = router