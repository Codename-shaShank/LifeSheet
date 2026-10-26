# LifeSheet

Personal DSA prep tracker (≤ 5 users). React 19 + Vite 8 frontend, Express 5 + MongoDB
(Mongoose 9) backend. Needs **Node 24 LTS** (see `.nvmrc`).

```
LifeSheet/
├── client/                     React + Vite SPA
│   ├── src/content/            all problem content (mapping-driven JSON)
│   └── vercel.json             proxies /api → backend, SPA fallback
└── server/                     Express API (auth, progress, notes)
```

## Content vs. user data

| Content (JSON in `client/src/content`) | User data (MongoDB) |
|---|---|
| collections, sections, sheet cards, modules, groups, problems, links, solutions | account, done/saved flags, notes |
| committed JSON | written by the app |

The two are joined only by the problem `id`. For LeetCode problems the id is the LeetCode slug
(`two-sum`), so it stays stable even if problems are renamed or reordered.

## 1. Run locally

```bash
# terminal 1
cd server
npm install
cp .env.example .env        # fill MONGODB_URI and JWT_SECRET
npm run dev                 # http://localhost:5000

# terminal 2
cd client
npm install
npm run dev                 # http://localhost:5173  (proxies /api → :5000)
```

## 2. Deploy

1. **Backend → Render** (Web Service, root dir `server`, build `npm install`, start `npm start`).
   Env: everything in `.env.example`, with `NODE_ENV=production`, `TRUST_PROXY=2`,
   `CLIENT_ORIGIN=https://<your-app>.vercel.app`.
2. **Frontend → Vercel** (root dir `client`, framework Vite). Edit `client/vercel.json` and
   replace `YOUR-RENDER-SERVICE` with your Render hostname.
   Requests to `/api/*` are proxied, so the session cookie is first-party and works in every browser.
3. Render's free tier sleeps after idling; the first request after a nap takes a while.
