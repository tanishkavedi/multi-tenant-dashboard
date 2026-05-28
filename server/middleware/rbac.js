
const pool = require('../db')

const requireRole = (...allowedRoles) => async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT role FROM org_members
       WHERE user_id = $1 AND org_id = $2`,
      [req.user.userId, req.user.orgId]
    )

    const role = result.rows[0]?.role

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'You do not have permission to do this' })
    }

    req.user.role = role
    next()
  } catch (err) {
    res.status(500).json({ error: 'Permission check failed' })
  }
}

module.exports = requireRole