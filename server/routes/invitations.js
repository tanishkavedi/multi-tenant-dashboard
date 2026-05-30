const express  = require('express')
const crypto = require('crypto')
const pool  = require('../db')
const jwt  = require('jsonwebtoken')
const { sendInviteEmail } = require('../services/email')

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

//  SEND invite email 
router.post('/send', auth, async (req, res) => {
  const { email, role } = req.body
  if (!email) return res.status(400).json({ error: 'Email is required' })

  try {
    // get org and inviter info
    const orgResult = await pool.query(
      'SELECT name FROM organizations WHERE id = $1', [req.user.orgId]
    )
    const userResult = await pool.query(
      'SELECT name FROM users WHERE id = $1', [req.user.userId]
    )

    const org = orgResult.rows[0]
    const inviter = userResult.rows[0]

    // check if already invited
    const existing = await pool.query(
      `SELECT id FROM invitations
       WHERE org_id = $1 AND email = $2 AND status = 'pending'`,
      [req.user.orgId, email]
    )
    if (existing.rows.length > 0)
      return res.status(400).json({ error: 'Invite already sent to this email' })

    // generate unique token
    const inviteToken = crypto.randomBytes(32).toString('hex')

    // save invitation to DB
    await pool.query(
      `INSERT INTO invitations (org_id, invited_by, email, role, token)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.orgId, req.user.userId, email, role || 'member', inviteToken]
    )

    // send email
    const inviteLink = `${process.env.CLIENT_URL}/invite/accept?token=${inviteToken}`
    await sendInviteEmail({
      toEmail: email,
      orgName: org.name,
      inviterName: inviter.name,
      inviteLink,
    })

    // log notification
    await pool.query(
      `INSERT INTO notifications (org_id, user_id, message, type)
       VALUES ($1, $2, $3, 'info')`,
      [req.user.orgId, req.user.userId,
       `Invite email sent to ${email}`]
    )

    res.json({ message: `Invite sent to ${email}!` })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not send invite' })
  }
})

//  GET pending invites for this org 
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, role, status, created_at, expires_at
       FROM invitations
       WHERE org_id = $1
       ORDER BY created_at DESC`,
      [req.user.orgId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch invites' })
  }
})

//  ACCEPT invite (when user clicks the link in email) 
router.post('/accept', async (req, res) => {
  const { token, name, password } = req.body
  if (!token) return res.status(400).json({ error: 'Token is required' })

  try {
    // find the invitation
    const inviteResult = await pool.query(
      `SELECT * FROM invitations
       WHERE token = $1 AND status = 'pending' AND expires_at > NOW()`,
      [token]
    )

    if (inviteResult.rows.length === 0)
      return res.status(400).json({ error: 'Invite is invalid or expired' })

    const invite = inviteResult.rows[0]

    // check if user already exists
    let userId
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1', [invite.email]
    )

    if (existingUser.rows.length > 0) {
      // user exists — just add them to org
      userId = existingUser.rows[0].id
    } else {
      // user doesn't exist — create account
      if (!name || !password)
        return res.status(400).json({ error: 'Name and password required to create account' })

      const bcrypt = require('bcryptjs')
      const hash   = await bcrypt.hash(password, 10)
      const newUser = await pool.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3) RETURNING id`,
        [name, invite.email, hash]
      )
      userId = newUser.rows[0].id
    }

    // add to org
    await pool.query(
      `INSERT INTO org_members (org_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [invite.org_id, userId, invite.role]
    )

    // mark invite as accepted
    await pool.query(
      `UPDATE invitations SET status = 'accepted' WHERE id = $1`,
      [invite.id]
    )

    // log notification
    await pool.query(
      `INSERT INTO notifications (org_id, user_id, message, type)
       VALUES ($1, $2, $3, 'success')`,
      [invite.org_id, userId, `${invite.email} accepted the invitation!`]
    )

    res.json({ message: 'Invite accepted! You can now login.' })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not accept invite' })
  }
})

//  CANCEL invite 
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE invitations SET status = 'cancelled'
       WHERE id = $1 AND org_id = $2`,
      [req.params.id, req.user.orgId]
    )
    res.json({ message: 'Invite cancelled' })
  } catch (err) {
    res.status(500).json({ error: 'Could not cancel invite' })
  }
})

module.exports = router