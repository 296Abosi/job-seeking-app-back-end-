const mongoose = require('mongoose')

const ExperienceSchema = new mongoose.Schema(
  {
    title: { type: String },
    company: { type: String },
    duration: { type: String }
  },
  { _id: false }
)

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['jobseeker', 'employer'], default: 'jobseeker' },
  title: { type: String, default: '' },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  bio: { type: String, default: '' },
  skills: [{ type: String }],
  experience: [ExperienceSchema],
  createdAt: { type: Date, default: Date.now },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }]
})

module.exports = mongoose.model('User', UserSchema)
