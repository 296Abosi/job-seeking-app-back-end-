# Job Seeking Backend

This is a starter Express.js backend for a job-seeking app.

## Scripts

- `npm install`
- `npm run dev`
- `npm start`

## Endpoints

- `GET /health`
- `GET /api/jobs`
- `POST /api/jobs`

## MongoDB & Auth

1. Create a `.env` file in the `backend` folder. You can copy `.env.example` and update values.
2. Run a local MongoDB instance, or set `MONGO_URI` to your hosted MongoDB connection string.
3. Install dependencies and start the server:

```bash
cd backend
npm install
npm run dev   # development with nodemon
```

4. Auth endpoints:
- `POST /api/auth/register` (name, email, password, role)
- `POST /api/auth/login` (email, password)

5. Other endpoints added:
- `GET /api/jobs` (search via query params)
- `POST /api/jobs` (employer only, requires Authorization: Bearer <token>)
- `POST /api/applications/apply/:jobId` (multipart form with `resume` file)
- `GET /api/applications/my` (get logged-in user's applications)
- `GET /api/notifications` (list recent notifications)

