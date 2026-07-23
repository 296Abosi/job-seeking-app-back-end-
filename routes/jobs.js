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

/**
 * @openapi
 * /api/jobs:
 *   get:
 *     summary: List or search jobs
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches against job title or company
 *       - in: query
 *         name: location
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of jobs
 */
// GET /api/jobs?search=&location=&type=
router.get('/', async (req, res) => {
  const { search, location, type } = req.query
  const jobs = await searchJobs(search, location, type)
  res.json(jobs)
})

/**
 * @openapi
 * /api/jobs/{id}:
 *   get:
 *     summary: Get a single job by id
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Job found
 *       404:
 *         description: Job not found
 */
// GET /api/jobs/:id
router.get('/:id', async (req, res) => {
  try {
    const job = useMongo() ? await Job.findById(req.params.id) : await fallbackDb.getJobById(req.params.id)
    if (!job) return res.status(404).json({ message: 'Job not found' })
    res.json(job)
  } catch (err) {
    console.error(err)
    res.status(500).send('Server error')
  }
})

/**
 * @openapi
 * /api/jobs:
 *   post:
 *     summary: Post a new job (employer only)
 *     tags: [Jobs]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, company]
 *             properties:
 *               title: { type: string }
 *               company: { type: string }
 *               location: { type: string }
 *               type: { type: string }
 *               salary: { type: string }
 *               description: { type: string }
 *               requirements: { type: array, items: { type: string } }
 *               benefits: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Job created
 *       403:
 *         description: Only employers can post jobs
 */
// POST /api/jobs - protected (employer)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'employer') return res.status(403).json({ message: 'Only employers can post jobs' })

    const { title, company, location, type, salary, description, requirements, benefits } = req.body
    if (!title || !company) return res.status(400).json({ message: 'Title and company are required' })

    const job = await createJob({
      title,
      company,
      location,
      type,
      salary,
      description,
      requirements,
      benefits,
      postedBy: req.user.id
    })
    await createNotification({ type: 'new_job', message: `New job posted: ${title}`, meta: { jobId: useMongo() ? job._id : job.id } })

    res.status(201).json(job)
  } catch (err) {
    console.error(err)
    res.status(500).send('Server error')
  }
})

module.exports = router
