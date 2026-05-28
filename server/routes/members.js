const express = require('express')
const pool = require('../db')
const jwt = require('jsonwebtoken')

const router = express.Router()

// MIDDLEWARE: verify token on every request 
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

// GET all members of the org 
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, m.role, m.joined_at
       FROM org_members m
       JOIN users u ON u.id = m.user_id
       WHERE m.org_id = $1
       ORDER BY m.joined_at ASC`,
      [req.user.orgId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not fetch members' })
  }
})

// INVITE: add a new member directly (simplified) 
router.post('/invite', auth, async (req, res) => {
  const { email, role } = req.body

  try {
    //  Check if user exists
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1', [email]
    )

    if (userResult.rows.length === 0)
      return res.status(404).json({ error: 'No user found with that email. They must register first.' })

    const invitedUser = userResult.rows[0]

    //  Check if already a member
    const alreadyMember = await pool.query(
      'SELECT id FROM org_members WHERE org_id = $1 AND user_id = $2',
      [req.user.orgId, invitedUser.id]
    )
    if (alreadyMember.rows.length > 0)
      return res.status(400).json({ error: 'User is already a member' })

    //  Add them to the org
    await pool.query(
      `INSERT INTO org_members (org_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [req.user.orgId, invitedUser.id, role || 'member']
    )

    res.json({ message: 'Member added successfully!' })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not invite member' })
  }
})

// REMOVE a member 
router.delete('/:userId', auth, async (req, res) => {
  try {
    // Prevent owner from removing themselves
    if (req.params.userId === req.user.userId)
      return res.status(400).json({ error: 'You cannot remove yourself' })

    await pool.query(
      'DELETE FROM org_members WHERE org_id = $1 AND user_id = $2',
      [req.user.orgId, req.params.userId]
    )
    res.json({ message: 'Member removed' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not remove member' })
  }
})

module.exports = router