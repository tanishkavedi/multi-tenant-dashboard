
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const memberRoutes  = require('./routes/members') 
const billingRoutes = require('./routes/billing') 

const app = express()

app.use(helmet())

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
  origin: process.env.CLIENT_URL || 'http://localhost:3000'
}))


app.use(express.json()) 


app.use('/api/auth', authRoutes)
app.use('/api/members', memberRoutes)
app.use('/api/billing', billingRoutes)


app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})