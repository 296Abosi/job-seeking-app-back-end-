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

function sanitize(user) {
  const returned = useMongo() ? user.toObject({ getters: true, versionKey: false }) : { ...user }
  if (returned.password) delete returned.password
  return returned
}

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     summary: Get the current user's profile
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: The user's profile
 *       404:
 *         description: User not found
 */
// GET /api/users/me
router.get('/me', auth, async (req, res) => {
  const user = await findUser(req.user.id)
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json(sanitize(user))
})

/**
 * @openapi
 * /api/users/me:
 *   put:
 *     summary: Update the current user's profile
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               title: { type: string }
 *               phone: { type: string }
 *               location: { type: string }
 *               bio: { type: string }
 *               skills: { type: array, items: { type: string } }
 *               experience:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title: { type: string }
 *                     company: { type: string }
 *                     duration: { type: string }
 *     responses:
 *       200:
 *         description: Updated profile
 *       404:
 *         description: User not found
 */
// PUT /api/users/me - update editable profile fields
// Deliberately excludes email/password/role - those need their own
// verification flows and are out of scope for this endpoint.
router.put('/me', auth, async (req, res) => {
  const user = await findUser(req.user.id)
  if (!user) return res.status(404).json({ message: 'User not found' })

  const editableFields = ['name', 'title', 'phone', 'location', 'bio', 'skills', 'experience']
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field]
    }
  })

  await saveUser(user)
  res.json(sanitize(user))
})

/**
 * @openapi
 * /api/users/favorites/{jobId}:
 *   post:
 *     summary: Toggle a job as favorited/saved for the current user
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Favorite toggled
 *       404:
 *         description: User or job not found
 */
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
      return res.json({ message: 'Removed from favorites', saved: false })
    }
    user.favorites.push(jobId)
    await user.save()
    return res.json({ message: 'Added to favorites', saved: true })
  }

  user.favorites = user.favorites || []
  const index = user.favorites.indexOf(jobId)
  if (index >= 0) {
    user.favorites.splice(index, 1)
    await saveUser(user)
    return res.json({ message: 'Removed from favorites', saved: false })
  }

  user.favorites.push(jobId)
  await saveUser(user)
  res.json({ message: 'Added to favorites', saved: true })
})

module.exports = router
