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
  if (useMongo()) {
    return Application.find({ applicant: userId }).populate('job').sort({ createdAt: -1 })
  }
  const apps = await fallbackDb.getApplicationsByApplicant(userId)
  // Manually "populate" the job reference so the response shape matches
  // the mongoose .populate('job') path above.
  const withJobs = await Promise.all(
    apps.map(async (app) => ({
      ...app,
      job: await fallbackDb.getJobById(app.job)
    }))
  )
  return withJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

/**
 * @openapi
 * /api/applications/apply/{jobId}:
 *   post:
 *     summary: Apply for a job (multipart form with optional resume file)
 *     tags: [Applications]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               resume: { type: string, format: binary }
 *               coverLetter: { type: string }
 *     responses:
 *       201:
 *         description: Application submitted
 *       404:
 *         description: Job not found
 */
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

/**
 * @openapi
 * /api/applications/my:
 *   get:
 *     summary: Get the current user's job applications
 *     tags: [Applications]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of applications with populated job details
 */
// GET /api/applications/my - get current user's applications
router.get('/my', auth, async (req, res) => {
  const apps = await findApplicationsForUser(req.user.id)
  res.json(apps)
})

module.exports = router
