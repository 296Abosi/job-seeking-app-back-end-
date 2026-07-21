const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const mongoose = require('mongoose')
const Job = require('../models/Job')
const Notification = require('../models/Notification')
const fallbackDb = require('../fallbackDb')

function useMongo() {
  return mongoose.connection.readyState === 1
}

async function searchJobs(search, location, type) {
  return useMongo()
    ? Job.find({
        ...(search ? { title: new RegExp(search, 'i') } : {}),
        ...(location ? { location: new RegExp(location, 'i') } : {}),
        ...(type ? { type } : {})
      }).sort({ createdAt: -1 })
    : fallbackDb.getJobs({ search, location, type })
}

async function createJob(data) {
  return useMongo() ? new Job(data).save() : fallbackDb.saveJob({ ...data, createdAt: new Date().toISOString() })
}

async function createNotification(data) {
  return useMongo() ? Notification.create(data) : fallbackDb.saveNotification({ ...data, createdAt: new Date().toISOString() })
}

// GET /api/jobs?search=&location=&type=
router.get('/', async (req, res) => {
  const { search, location, type } = req.query
  const jobs = await searchJobs(search, location, type)
  res.json(jobs)
})

// POST /api/jobs - protected (employer)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'employer') return res.status(403).json({ message: 'Only employers can post jobs' })

    const { title, company, location, type, description } = req.body
    if (!title || !company) return res.status(400).json({ message: 'Title and company are required' })

    const job = await createJob({ title, company, location, type, description, postedBy: req.user.id })
    await createNotification({ type: 'new_job', message: `New job posted: ${title}`, meta: { jobId: useMongo() ? job._id : job.id } })

    res.status(201).json(job)
  } catch (err) {
    console.error(err)
    res.status(500).send('Server error')
  }
})

module.exports = router
