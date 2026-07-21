const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const User = require('../models/User')
const fallbackDb = require('../fallbackDb')
require('dotenv').config()

function useMongo() {
  return mongoose.connection.readyState === 1
}

async function findUserByEmail(email) {
  return useMongo() ? User.findOne({ email }) : fallbackDb.getUserByEmail(email)
}

async function findUserById(id) {
  return useMongo() ? User.findById(id) : fallbackDb.getUserById(id)
}

async function saveUserDoc(user) {
  return useMongo() ? user.save() : fallbackDb.saveUser(user)
}

// POST /api/auth/register
router.post(
  '/register',
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['jobseeker', 'employer']),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { name, email, password, role } = req.body
    try {
      let user = await findUserByEmail(email)
      if (user) return res.status(400).json({ message: 'User already exists' })

      const hashedPassword = await bcrypt.hash(password, 10)
      if (useMongo()) {
        user = new User({ name, email, password: hashedPassword, role })
      } else {
        user = { name, email, password: hashedPassword, role: role || 'jobseeker', favorites: [] }
      }
      await saveUserDoc(user)

      const payload = { user: { id: useMongo() ? user.id : user.id, role: user.role } }
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' })
      res.json({ token, user: { id: useMongo() ? user.id : user.id, name: user.name, email: user.email, role: user.role } })
    } catch (err) {
      console.error(err)
      res.status(500).send('Server error')
    }
  }
)

// POST /api/auth/login
router.post('/login', body('email').isEmail(), body('password').exists(), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { email, password } = req.body
  try {
    const user = await findUserByEmail(email)
    if (!user) return res.status(400).json({ message: 'Invalid credentials' })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' })

    const payload = { user: { id: useMongo() ? user.id : user.id, role: user.role } }
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' })
    res.json({ token, user: { id: useMongo() ? user.id : user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    console.error(err)
    res.status(500).send('Server error')
  }
})

module.exports = router
