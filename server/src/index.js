import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { requireAdmin, requireAuth } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errors.js';
import authRoutes from './routes/auth.js';
import progressRoutes from './routes/progress.js';
import notesRoutes from './routes/notes.js';
import adminRoutes from './routes/admin.js';

const app = express();

app.set('trust proxy', env.TRUST_PROXY); // real client IP for rate limiting behind Vercel/Render
app.use(helmet());
app.use(cors({ origin: env.clientOrigins, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/progress', requireAuth, progressRoutes);
app.use('/api/notes', requireAuth, notesRoutes);
app.use('/api/admin', requireAuth, requireAdmin, adminRoutes);
// FUTURE: /api/chat — AI help on the problem page via the Google Gemini API
//         (requireAuth + per-user rate limit; key from GEMINI_API_KEY, model from GEMINI_MODEL).
// FUTURE: /api/tasks (Daily Planner), /api/collections (named Save collections),
//         /api/community (discussion threads).

app.use(notFound);
app.use(errorHandler);

mongoose.set('strictQuery', true);
await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
console.log(`MongoDB connected → database "${mongoose.connection.name}"`);

const server = app.listen(env.PORT, () => console.log(`API listening on :${env.PORT}`));

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`);
  server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
