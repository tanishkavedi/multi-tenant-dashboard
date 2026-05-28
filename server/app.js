
const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const memberRoutes  = require('./routes/members') 
const billingRoutes = require('./routes/billing') 

const app = express()

app.use(cors())
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