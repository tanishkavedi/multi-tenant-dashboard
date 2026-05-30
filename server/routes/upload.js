const express = require('express')
const multer = require('multer')
const path  = require('path')
const jwt = require('jsonwebtoken')
const pool = require('../db')

const router = express.Router()

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

//  storage config 
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')   // save to server/uploads folder
  },
  filename: (req, file, cb) => {
    // filename: userId + timestamp + extension
    const ext = path.extname(file.originalname)
    cb(null, `${req.user.userId}-${Date.now()}${ext}`)
  }
})

// only allow images
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (allowed.includes(file.mimetype)) cb(null, true)
  else cb(new Error('Only JPG, PNG, WEBP or GIF allowed'), false)
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }  // max 2MB
})

//  UPLOAD avatar 
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: 'No file uploaded' })

    const avatarUrl = `/uploads/${req.file.filename}`

    // save to database
    await pool.query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2',
      [avatarUrl, req.user.userId]
    )

    res.json({ avatarUrl, message: 'Avatar updated!' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Upload failed' })
  }
})

//  GET current avatar 
router.get('/avatar', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT avatar_url FROM users WHERE id = $1',
      [req.user.userId]
    )
    res.json({ avatarUrl: result.rows[0]?.avatar_url || null })
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch avatar' })
  }
})

module.exports = router