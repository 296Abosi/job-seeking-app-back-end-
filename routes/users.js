const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const auth = require('../middleware/auth')
const User = require('../models/User')
const Job = require('../models/Job')
const fallbackDb = require('../fallbackDb')

function useMongo() {
  return mongoose.connection.readyState === 1
}

async function findUser(userId) {
  return useMongo() ? User.findById(userId).select('-password').populate('favorites') : fallbackDb.getUserById(userId)
}

async function findJob(jobId) {
  return useMongo() ? Job.findById(jobId) : fallbackDb.getJobById(jobId)
}

async function saveUser(user) {
  return useMongo() ? user.save() : fallbackDb.saveUser(user)
}

// GET /api/users/me
router.get('/me', auth, async (req, res) => {
  const user = await findUser(req.user.id)
  if (!user) return res.status(404).json({ message: 'User not found' })
  const returned = useMongo()
    ? user.toObject({ getters: true, versionKey: false })
    : { ...user }
  if (returned.password) delete returned.password
  res.json(returned)
})

// POST /api/users/favorites/:jobId - toggle favorite
router.post('/favorites/:jobId', auth, async (req, res) => {
  const user = await findUser(req.user.id)
  if (!user) return res.status(404).json({ message: 'User not found' })

  const jobId = req.params.jobId
  const job = await findJob(jobId)
  if (!job) return res.status(404).json({ message: 'Job not found' })

  if (useMongo()) {
    const favoriteIndex = user.favorites.findIndex((f) => f.toString() === jobId)
    if (favoriteIndex >= 0) {
      user.favorites.splice(favoriteIndex, 1)
      await user.save()
      return res.json({ message: 'Removed from favorites' })
    }
    user.favorites.push(jobId)
    await user.save()
    return res.json({ message: 'Added to favorites' })
  }

  user.favorites = user.favorites || []
  const index = user.favorites.indexOf(jobId)
  if (index >= 0) {
    user.favorites.splice(index, 1)
    await saveUser(user)
    return res.json({ message: 'Removed from favorites' })
  }

  user.favorites.push(jobId)
  await saveUser(user)
  res.json({ message: 'Added to favorites' })
})

module.exports = router
