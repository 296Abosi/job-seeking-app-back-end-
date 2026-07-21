const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const auth = require('../middleware/auth')
const Notification = require('../models/Notification')
const fallbackDb = require('../fallbackDb')

function useMongo() {
  return mongoose.connection.readyState === 1
}

// GET /api/notifications - user's notifications (simple: return all)
router.get('/', auth, async (req, res) => {
  const notes = useMongo()
    ? await Notification.find().sort({ createdAt: -1 }).limit(50)
    : await fallbackDb.getNotifications()
  res.json(notes)
})

// PATCH /api/notifications/:id/read
router.patch('/:id/read', auth, async (req, res) => {
  let note
  if (useMongo()) {
    note = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true })
  } else {
    note = await fallbackDb.getNotificationById(req.params.id)
    if (note) {
      note.read = true
      note = await fallbackDb.saveNotification(note)
    }
  }

  if (!note) return res.status(404).json({ message: 'Notification not found' })
  res.json(note)
})

module.exports = router
