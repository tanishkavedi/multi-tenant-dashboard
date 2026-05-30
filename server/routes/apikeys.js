const express = require('express')
const crypto  = require('crypto')
const pool  = require('../db')
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

//  GET all API keys for org 
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, key_prefix, is_active, last_used,
              expires_at, created_at
       FROM api_keys
       WHERE org_id = $1
       ORDER BY created_at DESC`,
      [req.user.orgId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch API keys' })
  }
})

//  CREATE a new API key 
router.post('/', auth, async (req, res) => {
  const { name, expiresIn } = req.body
  if (!name) return res.status(400).json({ error: 'Key name is required' })

  try {
    // generate a random key like
    const rawKey    = `sk_live_${crypto.randomBytes(24).toString('hex')}`
    const keyPrefix = rawKey.substring(0, 12)  // first 12 chars for display
    const keyHash   = crypto.createHash('sha256').update(rawKey).digest('hex')

    // calculate expiry
    let expiresAt = null
    if (expiresIn === '30d')  expiresAt = new Date(Date.now() + 30  * 24 * 60 * 60 * 1000)
    if (expiresIn === '90d')  expiresAt = new Date(Date.now() + 90  * 24 * 60 * 60 * 1000)
    if (expiresIn === '365d') expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

    await pool.query(
      `INSERT INTO api_keys (org_id, user_id, name, key_hash, key_prefix, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.orgId, req.user.userId, name, keyHash, keyPrefix, expiresAt]
    )

    // log activity
    await pool.query(
      `INSERT INTO activity_logs (org_id, user_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [req.user.orgId, req.user.userId, 'api_key_created', `API key "${name}" created`]
    )

    // return the FULL key only once — we never store it
    res.json({
      message: 'API key created!',
      key: rawKey,   //  shown only once!
      prefix: keyPrefix
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not create API key' })
  }
})

//  REVOKE (deactivate) a key 
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE api_keys SET is_active = false
       WHERE id = $1 AND org_id = $2`,
      [req.params.id, req.user.orgId]
    )

    // log activity
    await pool.query(
      `INSERT INTO activity_logs (org_id, user_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [req.user.orgId, req.user.userId, 'api_key_revoked', 'An API key was revoked']
    )

    res.json({ message: 'Key revoked' })
  } catch (err) {
    res.status(500).json({ error: 'Could not revoke key' })
  }
})

module.exports = router