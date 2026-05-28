// server/routes/auth.js
const express  = require('express')
const bcrypt   = require('bcryptjs')
const jwt      = require('jsonwebtoken')
const pool     = require('../db')

const router = express.Router()

// ─── REGISTER ───────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password, orgName } = req.body

  try {
    // 1. Check if email already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1', [email]
    )
    if (existing.rows.length > 0)
      return res.status(400).json({ error: 'Email already in use' })

    // 2. Scramble the password (never save plain text!)
    const password_hash = await bcrypt.hash(password, 10)

    // 3. Create the user
    const userResult = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3) RETURNING id, name, email`,
      [name, email, password_hash]
    )
    const user = userResult.rows[0]

    // 4. Create their organization
    const slug = orgName.toLowerCase().replace(/\s+/g, '-')
    const orgResult = await pool.query(
      `INSERT INTO organizations (name, slug)
       VALUES ($1, $2) RETURNING id, name, slug, plan`,
      [orgName, slug]
    )
    const org = orgResult.rows[0]

    // 5. Make this user the OWNER of that org
    await pool.query(
      `INSERT INTO org_members (org_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [org.id, user.id]
    )

    // 6. Create a token (keycard) and send it back
    const token = jwt.sign(
      { userId: user.id, orgId: org.id, role: 'owner' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({ token, user, org })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// ─── LOGIN ──────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  try {
    // 1. Find user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    )
    const user = result.rows[0]
    if (!user)
      return res.status(400).json({ error: 'Invalid email or password' })

    // 2. Check if password matches
    const match = await bcrypt.compare(password, user.password_hash)
    if (!match)
      return res.status(400).json({ error: 'Invalid email or password' })

    // 3. Get their organization
    const orgResult = await pool.query(
      `SELECT o.*, m.role FROM organizations o
       JOIN org_members m ON m.org_id = o.id
       WHERE m.user_id = $1 LIMIT 1`,
      [user.id]
    )
    const org = orgResult.rows[0]

    // 4. Create and send token
    const token = jwt.sign(
      { userId: user.id, orgId: org.id, role: org.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ token, user: { id: user.id, name: user.name, email: user.email }, org })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

module.exports = router