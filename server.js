const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Job seeking backend is running' });
});

app.get('/api/jobs', (req, res) => {
  res.json([
    {
      id: 1,
      title: 'Frontend Developer',
      company: 'TechNova',
      location: 'Remote',
      type: 'Full-time'
    },
    {
      id: 2,
      title: 'Backend Developer',
      company: 'CodeCraft',
      location: 'Lagos',
      type: 'Contract'
    }
  ]);
});

app.post('/api/jobs', (req, res) => {
  const job = req.body;

  if (!job || !job.title || !job.company) {
    return res.status(400).json({ message: 'Title and company are required' });
  }

  res.status(201).json({ message: 'Job created successfully', job });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
