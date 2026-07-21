const mongoose = require('mongoose')

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String },
  message: { type: String },
  read: { type: Boolean, default: false },
  meta: { type: Object },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Notification', NotificationSchema)
