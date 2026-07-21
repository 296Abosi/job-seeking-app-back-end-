const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const multer = require('multer')
const path = require('path')
const mongoose = require('mongoose')
const Application = require('../models/Application')
const Job = require('../models/Job')
const Notification = require('../models/Notification')
const fallbackDb = require('../fallbackDb')

const upload = multer({ dest: path.join(__dirname, '..', 'uploads') })

function useMongo() {
  return mongoose.connection.readyState === 1
}

async function findJobById(id) {
  return useMongo() ? Job.findById(id) : fallbackDb.getJobById(id)
}

async function createApplication(data) {
  return useMongo() ? new Application(data).save() : fallbackDb.saveApplication({ ...data, createdAt: new Date().toISOString() })
}

async function createNotification(data) {
  return useMongo() ? Notification.create(data) : fallbackDb.saveNotification({ ...data, createdAt: new Date().toISOString() })
}

async function findApplicationsForUser(userId) {
  return useMongo()
    ? Application.find({ applicant: userId }).populate('job')
    : fallbackDb.getApplicationsByApplicant(userId)
}

// POST /api/apply/:jobId (applicant)
router.post('/apply/:jobId', auth, upload.single('resume'), async (req, res) => {
  try {
    const job = await findJobById(req.params.jobId)
    if (!job) return res.status(404).json({ message: 'Job not found' })

    const resumeUrl = req.file ? `/uploads/${req.file.filename}` : undefined
    const application = await createApplication({
      job: useMongo() ? job._id : job.id,
      applicant: req.user.id,
      resumeUrl,
      coverLetter: req.body.coverLetter
    })

    await createNotification({
      type: 'new_application',
      message: `New application for ${job.title}`,
      meta: { jobId: useMongo() ? job._id : job.id, applicationId: useMongo() ? application._id : application.id }
    })

    res.status(201).json(application)
  } catch (err) {
    console.error(err)
    res.status(500).send('Server error')
  }
})

// GET /api/applications/my - get current user's applications
router.get('/my', auth, async (req, res) => {
  const apps = await findApplicationsForUser(req.user.id)
  res.json(apps)
})

module.exports = router
