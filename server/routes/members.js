const express     = require('express')
const pool = require('../db')
const jwt  = require('jsonwebtoken')
const requireRole = require('../middleware/rbac')
const PLANS = require('../config/plans')  

const router = express.Router()

//  auth middleware 
const auth = (req, res, next) => {
  // check header OR query param (for file downloads)
  const token = req.headers.authorization?.split(' ')[1] || req.query.token
  if (!token) return res.status(401).json({ error: 'No token' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

//  GET all members of the org 
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

//  INVITE: add a new member 
router.post('/invite', auth, requireRole('owner', 'admin'), async (req, res) => {
  const { email, role } = req.body

  try {
    //  Check member limit 
    const orgResult = await pool.query(
      'SELECT plan FROM organizations WHERE id = $1',
      [req.user.orgId]
    )
    const plan  = orgResult.rows[0]?.plan || 'free'
    const planLimit = PLANS[plan]?.maxMembers || 2

    const memberCount = await pool.query(
      'SELECT COUNT(*) as count FROM org_members WHERE org_id = $1',
      [req.user.orgId]
    )
    const currentCount = parseInt(memberCount.rows[0].count)

    if (currentCount >= planLimit)
      return res.status(403).json({
        error: `You've reached the ${planLimit} member limit for the ${plan} plan. Please upgrade to add more members.`
      })

    //  Check if user exists 
    const userResult = await pool.query(
      'SELECT id, name FROM users WHERE email = $1', [email]
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

    //  Log notification 
    await pool.query(
      `INSERT INTO notifications (org_id, user_id, message, type)
       VALUES ($1, $2, $3, 'success')`,
      [req.user.orgId, req.user.userId,
       `${invitedUser.name} was added to the organization as ${role || 'member'}`]
    )

    //  Log activity 
    await pool.query(
      `INSERT INTO activity_logs (org_id, user_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [req.user.orgId, req.user.userId,
       'member_added',
       `Added ${invitedUser.name} as ${role || 'member'}`]
    )

    res.json({ message: 'Member added successfully!' })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not invite member' })
  }
})

//  REMOVE a member 
router.delete('/:userId', auth, requireRole('owner'), async (req, res) => {
  try {
    if (req.params.userId === req.user.userId)
      return res.status(400).json({ error: 'You cannot remove yourself' })

    // get member name before deleting
    const memberResult = await pool.query(
      `SELECT u.name FROM users u
       JOIN org_members m ON m.user_id = u.id
       WHERE m.org_id = $1 AND u.id = $2`,
      [req.user.orgId, req.params.userId]
    )
    const memberName = memberResult.rows[0]?.name || 'A member'

    await pool.query(
      'DELETE FROM org_members WHERE org_id = $1 AND user_id = $2',
      [req.user.orgId, req.params.userId]
    )

    // log notification
    await pool.query(
      `INSERT INTO notifications (org_id, user_id, message, type)
       VALUES ($1, $2, $3, 'warning')`,
      [req.user.orgId, req.user.userId,
       `${memberName} was removed from the organization`]
    )

    // log activity
    await pool.query(
      `INSERT INTO activity_logs (org_id, user_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [req.user.orgId, req.user.userId,
       'member_removed',
       `Removed ${memberName} from the organization`]
    )

    res.json({ message: 'Member removed' })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not remove member' })
  }
})

//  EXPORT members as CSV 
router.get('/export', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.name, u.email, m.role, m.joined_at
       FROM org_members m
       JOIN users u ON u.id = m.user_id
       WHERE m.org_id = $1
       ORDER BY m.joined_at ASC`,
      [req.user.orgId]
    )

    const headers = 'Name,Email,Role,Joined At'
    const rows = result.rows.map(m =>
      `"${m.name}","${m.email}","${m.role}","${new Date(m.joined_at).toLocaleDateString()}"`
    )
    const csv = [headers, ...rows].join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="members.csv"')
    res.send(csv)

    // log activity
    await pool.query(
      `INSERT INTO activity_logs (org_id, user_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [req.user.orgId, req.user.userId,
       'export', 'Members list exported as CSV']
    )

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not export members' })
  }
})

module.exports = router