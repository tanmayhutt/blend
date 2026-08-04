# Blend (formerly YouTube Blend)

Compare your YouTube taste with friends and discover your compatibility score instantly. 

**Live:** [youtube-blend.tanmaytiwari.me](https://youtube-blend.tanmaytiwari.me)

---

## ⚡ Infrastructure Highlights

- **Vercel Serverless Architecture:** Fully migrated to Vercel for instant deployments, utilizing global edge networks for the frontend and serverless Python functions for the backend.
- **Vite + React Frontend:** Lightning-fast static frontend built with Vite, ensuring rapid load times and optimal asset delivery.
- **FastAPI Backend:** High-performance Python backend exposed seamlessly via Vercel's `/api` routing.
- **Zero-Config Deployment:** A single `vercel.json` manages both the Vite frontend build process and the Python backend environment natively.
- **Scalable Vector Graphics:** All branding assets are written in pure SVG for perfect mathematical scaling and zero overhead.

---

## Overview

Blend allows users to:
- Securely connect their YouTube account via Google OAuth
- Generate shareable blend links (2-hour expiration)
- Compare compatibility with friends across subscriptions, videos, and music preferences
- Receive a 0-100% compatibility score based on Jaccard similarity algorithm

**Key Points:** Read-only access • No data stored permanently • Secure & encrypted tokens

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + MongoDB (Python) |
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Auth | Google OAuth 2.0 |
| Hosting | Vercel (Static Frontend + Serverless Functions) |

---

## Project Structure

```
youtube-blend/
├── api/
│   └── index.py             # Vercel Serverless Entry Point (Python)
├── backend/
│   ├── main.py              # FastAPI app & OAuth routes
│   └── services/
│       ├── youtube.py       # YouTube API integration
│       └── comparison.py    # Jaccard similarity algorithm
├── frontend/
│   ├── src/pages/           # Landing, Dashboard, Compare pages
│   ├── src/components/      # UI components
│   └── package.json         # React dependencies
├── vercel.json              # Vercel Deployment Configuration
├── requirements.txt         # Python dependencies
└── README.md
```

---

## Security Features

- **Google Site Verification:** Domain ownership verified via HTML meta-tags.
- **Rate limiting:** 20 req/min per IP.
- **CSRF & XSS prevention:** JSON-safe escaping and secure tokens.
- **Read-only APIs:** We request the absolute minimum permissions needed.
- **JWT authentication:** Encrypted sessions with strict expirations.

---

## How It Works: The Algorithm

Uses **Jaccard Similarity** across 5 dimensions:

```
Similarity = (Common Items / Total Unique Items) × 100

Example:
User1 subscriptions: [MrBeast, Vsauce, Kurzgesagt]
User2 subscriptions: [Vsauce, Kurzgesagt, Veritasium]

Score = (2 / 4) × 100 = 50%
```

**Overall Score** = Average of:
1. Subscriptions similarity
2. Subscription genres similarity
3. Saved videos similarity
4. Video genres similarity
5. Music listened similarity

---

## Local Development Quick Start

### Backend
```bash
# Navigate to project root
pip install -r requirements.txt

# Set environment variables in .env (see .env.vercel for required keys)
export MONGO_URI=your_mongodb_uri
export GOOGLE_CLIENT_ID=your_client_id
export GOOGLE_CLIENT_SECRET=your_client_secret
export JWT_SECRET=$(openssl rand -base64 32)
export DEPLOYED_DOMAIN=http://localhost:8000
export FRONTEND_URL=http://localhost:5173

# Run FastAPI Server
cd backend
python -m uvicorn main:app --reload
```

### Frontend
```bash
# Navigate to frontend folder
cd frontend
npm install

# Run Vite Dev Server
export VITE_API_URL=http://localhost:8000
npm run dev
```

---

## Production Deployment (Vercel)

Both the frontend and backend run natively on Vercel. 

#### Step 1: Push to GitHub
Simply push your code to the `main` branch. 

#### Step 2: Vercel Takes Over
Vercel will automatically detect the configuration in `vercel.json`:
1. It builds the Vite React frontend into static assets.
2. It detects the `requirements.txt` at the root and deploys `api/index.py` as a Python Serverless Function.
3. It routes all `/api/*` traffic seamlessly to the FastAPI backend.

Ensure you have copied the variables from `.env.vercel` into your Vercel project's **Environment Variables** dashboard.

#### Step 3: Prevent Cold Starts (Keep-Alive)
Because Vercel uses AWS Lambda for the backend, idle functions are put to sleep after 5-15 minutes of inactivity. To prevent the 2-3 second "cold start" delay for your users, you should set up a free uptime monitor.

1. Create a free account on [cron-job.org](https://cron-job.org/).
2. Create a new cronjob pointing to your base API URL: `https://your-domain.com/api/`
3. Set the schedule to **Every 5 minutes**.

*(Since this endpoint just returns a simple JSON message and does no database processing, it uses a microscopic fraction of Vercel's generous free Hobby tier limits).*

---

## Known Limitations

- Comparison links expire after 2 hours
- YouTube API free tier limits to ~50 subscriptions per request
- Comparison results cached after first run
- Music data requires YouTube Music account

---

## License

MIT - Feel free to fork, modify, and use this project.
