const express = require('express')
const bcrypt  = require('bcryptjs')
const jwt   = require('jsonwebtoken')
const pool  = require('../db')

const router = express.Router()

//  REGISTER 
router.post('/register', async (req, res) => {
  const { name, email, password, orgName } = req.body

  if (!name || !email || !password || !orgName)
    return res.status(400).json({ error: 'All fields are required' })

  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' })

  if (!email.includes('@'))
    return res.status(400).json({ error: 'Invalid email address' })

  try {
    // check if email already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1', [email]
    )
    if (existing.rows.length > 0)
      return res.status(400).json({ error: 'Email already in use' })

    // scramble the password
    const password_hash = await bcrypt.hash(password, 10)

    // create the user
    const userResult = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3) RETURNING id, name, email`,
      [name, email, password_hash]
    )
    const user = userResult.rows[0]

    // create their organization
    const slug = orgName.toLowerCase().replace(/\s+/g, '-')
    const orgResult = await pool.query(
      `INSERT INTO organizations (name, slug)
       VALUES ($1, $2) RETURNING id, name, slug, plan`,
      [orgName, slug]
    )
    const org = orgResult.rows[0]

    // make this user the owner
    await pool.query(
      `INSERT INTO org_members (org_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [org.id, user.id]
    )

    // create token
    const token = jwt.sign(
      { userId: user.id, orgId: org.id, role: 'owner' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      token,
      user,
      org: { ...org, role: 'owner' },
      orgs: [{ ...org, role: 'owner' }]
    })

  } catch (err) {
    console.error('REGISTER ERROR:', err.message)
    res.status(500).json({ error: err.message })
  }
})

//  LOGIN 
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  try {
    // find user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    )
    const user = result.rows[0]
    if (!user)
      return res.status(400).json({ error: 'Invalid email or password' })

    // check password
    const match = await bcrypt.compare(password, user.password_hash)
    if (!match)
      return res.status(400).json({ error: 'Invalid email or password' })

    // get ALL orgs this user belongs to
    const orgResult = await pool.query(
      `SELECT o.*, m.role FROM organizations o
       JOIN org_members m ON m.org_id = o.id
       WHERE m.user_id = $1
       ORDER BY o.created_at ASC`,
      [user.id]
    )

    const orgs = orgResult.rows

    if (orgs.length === 0)
      return res.status(400).json({ error: 'You do not belong to any organization' })

    // use first org as default
    const org = orgs[0]

    const token = jwt.sign(
      { userId: user.id, orgId: org.id, role: org.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
      org: { ...org },
      orgs,
    })

  } catch (err) {
    console.error('LOGIN ERROR:', err.message)
    res.status(500).json({ error: err.message })
  }
})

//  SWITCH ORG 
router.post('/switch-org', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const { orgId } = req.body

    // verify user belongs to this org
    const memberResult = await pool.query(
      `SELECT m.role, o.* FROM org_members m
       JOIN organizations o ON o.id = m.org_id
       WHERE m.user_id = $1 AND m.org_id = $2`,
      [decoded.userId, orgId]
    )

    if (memberResult.rows.length === 0)
      return res.status(403).json({ error: 'You do not belong to this organization' })

    const org = memberResult.rows[0]

    // issue new token scoped to selected org
    const newToken = jwt.sign(
      { userId: decoded.userId, orgId: org.id, role: org.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ token: newToken, org: { ...org } })

  } catch (err) {
    console.error('SWITCH ORG ERROR:', err.message)
    res.status(500).json({ error: 'Could not switch org' })
  }
})

module.exports = router