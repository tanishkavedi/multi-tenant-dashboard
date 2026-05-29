
const express = require('express')
const bcrypt  = require('bcryptjs')
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

//  GET org + user info 
router.get('/', auth, async (req, res) => {
  try {
    const orgResult = await pool.query(
      'SELECT id, name, slug, plan, created_at FROM organizations WHERE id = $1',
      [req.user.orgId]
    )
    const userResult = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [req.user.userId]
    )
    res.json({
      org:  orgResult.rows[0],
      user: userResult.rows[0],
    })
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch settings' })
  }
})

//  UPDATE org name 
router.put('/org', auth, async (req, res) => {
  const { name } = req.body
  if (!name || name.trim().length < 2)
    return res.status(400).json({ error: 'Name must be at least 2 characters' })

  try {
    const slug = name.toLowerCase().replace(/\s+/g, '-')
    const result = await pool.query(
      `UPDATE organizations SET name = $1, slug = $2
       WHERE id = $3 RETURNING id, name, slug, plan`,
      [name.trim(), slug, req.user.orgId]
    )
    res.json({ message: 'Organization updated!', org: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: 'Could not update organization' })
  }
})

//  UPDATE user name 
router.put('/profile', auth, async (req, res) => {
  const { name } = req.body
  if (!name || name.trim().length < 2)
    return res.status(400).json({ error: 'Name must be at least 2 characters' })

  try {
    const result = await pool.query(
      `UPDATE users SET name = $1 WHERE id = $2
       RETURNING id, name, email`,
      [name.trim(), req.user.userId]
    )
    res.json({ message: 'Profile updated!', user: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: 'Could not update profile' })
  }
})

//  CHANGE password 
router.put('/password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Both fields are required' })

  if (newPassword.length < 8)
    return res.status(400).json({ error: 'New password must be at least 8 characters' })

  try {
    // get current password hash
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.userId]
    )

    // check current password is correct
    const match = await bcrypt.compare(currentPassword, result.rows[0].password_hash)
    if (!match)
      return res.status(400).json({ error: 'Current password is incorrect' })

    // save new password
    const newHash = await bcrypt.hash(newPassword, 10)
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newHash, req.user.userId]
    )

    res.json({ message: 'Password changed successfully!' })
  } catch (err) {
    res.status(500).json({ error: 'Could not change password' })
  }
})

//  DELETE organization (danger zone) 
router.delete('/org', auth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM organizations WHERE id = $1',
      [req.user.orgId]
    )
    res.json({ message: 'Organization deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Could not delete organization' })
  }
})

module.exports = router