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

## Full app local run

Backend:
```bash
cd backend
npm install
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Default URLs:
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

## Current status
- Auth register/login works
- Employer can post jobs
- Jobseeker can apply with resume upload
- The backend uses an in-memory fallback when MongoDB is unavailable

## Thursday continuation plan
1. Finish favorites UI and favorites endpoints
2. Add notification badges and UI
3. Add employer dashboard/profile UI
4. Add search/filter polish and better job cards
5. Connect to real MongoDB for persistence

