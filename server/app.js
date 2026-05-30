
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const memberRoutes  = require('./routes/members') 
const billingRoutes = require('./routes/billing') 
const settingsRoutes = require('./routes/settings')
const analyticsRoutes = require('./routes/analytics')
const uploadRoutes = require('./routes/upload') 
const notificationRoutes = require('./routes/notifications')
const invitationRoutes = require('./routes/invitations') 
const activityRoutes = require('./routes/activity')
const apiKeyRoutes = require('./routes/apikeys')


const app = express()

app.use(helmet({
  crossOriginResourcePolicy: false
}))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please slow down!' }
})
app.use('/api/', limiter)


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, try again in 15 minutes' }
})
app.use('/api/auth/', authLimiter)


app.use(cors({
  origin: ['http://localhost:3000', process.env.CLIENT_URL].filter(Boolean),
  credentials: true
}))

app.use('/uploads', express.static('uploads'))


app.use(express.json()) 


app.use('/api/auth', authRoutes)
app.use('/api/members', memberRoutes)
app.use('/api/billing', billingRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/analytics', analyticsRoutes)  
app.use('/api/upload', uploadRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/invitations', invitationRoutes)
app.use('/api/activity', activityRoutes) 
app.use('/api/keys', apiKeyRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})