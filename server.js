const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
let MongoMemoryServer
try {
  MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer
} catch (e) {
  MongoMemoryServer = null
}

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jobseeker';
  try {
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB:', mongoUri);
  } catch (err) {
    console.warn('MongoDB connection failed:', err.message);
    // If an explicit MONGO_URI was provided, or mongodb-memory-server is unavailable,
    // don't crash the process; fall back to the in-memory JS store (fallbackDb) used
    // by the routes. If mongodb-memory-server is available, try to use it.
    if (MongoMemoryServer) {
      try {
        const mongoServer = await MongoMemoryServer.create();
        const memoryUri = mongoServer.getUri();
        await mongoose.connect(memoryUri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to in-memory MongoDB');
        return;
      } catch (memErr) {
        console.warn('mongodb-memory-server failed to start:', memErr.message);
      }
    }

    console.warn('Proceeding without MongoDB — using fallback in-memory DB for development.');
  }
}

// static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Job seeking backend is running' });
});

// mount routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/users', require('./routes/users'));

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

connectDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});
