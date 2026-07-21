const fs = require('fs').promises
const path = require('path')

const dbPath = path.join(__dirname, 'fallback-db.json')
let data = {
  users: [],
  jobs: [],
  applications: [],
  notifications: []
}
let loaded = false

async function loadDb() {
  try {
    const file = await fs.readFile(dbPath, 'utf8')
    data = JSON.parse(file)
  } catch (err) {
    if (err.code === 'ENOENT') {
      await saveDb()
    } else {
      throw err
    }
  }
  loaded = true
}

async function saveDb() {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8')
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

async function ensureLoaded() {
  if (!loaded) await loadDb()
}

async function getUserByEmail(email) {
  await ensureLoaded()
  return data.users.find((user) => user.email === email)
}

async function getUserById(id) {
  await ensureLoaded()
  return data.users.find((user) => user.id === id)
}

async function saveUser(user) {
  await ensureLoaded()
  if (!user.id) user.id = makeId()
  data.users = data.users.filter((item) => item.id !== user.id)
  data.users.push(user)
  await saveDb()
  return user
}

async function getUsersFavorites(id) {
  await ensureLoaded()
  const user = data.users.find((user) => user.id === id)
  return user ? user.favorites || [] : []
}

async function getJobs({ search, location, type } = {}) {
  await ensureLoaded()
  const regex = (value) => new RegExp(value, 'i')
  return data.jobs.filter((job) => {
    if (search && !regex(search).test(job.title) && !regex(search).test(job.company)) return false
    if (location && !regex(location).test(job.location || '')) return false
    if (type && job.type !== type) return false
    return true
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

async function getJobById(id) {
  await ensureLoaded()
  return data.jobs.find((job) => job.id === id)
}

async function saveJob(job) {
  await ensureLoaded()
  if (!job.id) job.id = makeId()
  data.jobs = data.jobs.filter((item) => item.id !== job.id)
  data.jobs.push(job)
  await saveDb()
  return job
}

async function getApplicationsByApplicant(applicantId) {
  await ensureLoaded()
  return data.applications.filter((app) => app.applicant === applicantId)
}

async function saveApplication(application) {
  await ensureLoaded()
  if (!application.id) application.id = makeId()
  data.applications = data.applications.filter((item) => item.id !== application.id)
  data.applications.push(application)
  await saveDb()
  return application
}

async function getNotifications() {
  await ensureLoaded()
  return data.notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

async function saveNotification(notification) {
  await ensureLoaded()
  if (!notification.id) notification.id = makeId()
  data.notifications = data.notifications.filter((item) => item.id !== notification.id)
  data.notifications.push(notification)
  await saveDb()
  return notification
}

async function getNotificationById(id) {
  await ensureLoaded()
  return data.notifications.find((note) => note.id === id)
}

module.exports = {
  getUserByEmail,
  getUserById,
  saveUser,
  getUsersFavorites,
  getJobs,
  getJobById,
  saveJob,
  getApplicationsByApplicant,
  saveApplication,
  getNotifications,
  saveNotification,
  getNotificationById
}
