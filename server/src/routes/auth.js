import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { clearSessionCookie, readSession, setSessionCookie } from '../middleware/auth.js';

const router = Router();

const BCRYPT_ROUNDS = 12;
// Compared against when the user doesn't exist, so "no such user" and "wrong password" take the same time.
const DUMMY_HASH = bcrypt.hashSync('lifesheet-timing-equaliser', BCRYPT_ROUNDS);

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(sha256(a), sha256(b));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
});

const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,30}$/, 'Use 3–30 letters, numbers or underscores'),
  email: z.string().trim().toLowerCase().email('Enter a valid email').max(254),
  password: z.string().min(8, 'Password needs at least 8 characters').max(128),
  inviteCode: z.string().trim().optional().default(''),
});

const loginSchema = z.object({
  identifier: z.string().trim().toLowerCase().min(1, 'Enter your email or username'),
  password: z.string().min(1, 'Enter your password'),
});

router.post(
  '/signup',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { name, username, email, password, inviteCode } = signupSchema.parse(req.body ?? {});

    if (env.SIGNUP_INVITE_CODE && !safeEqual(inviteCode, env.SIGNUP_INVITE_CODE)) {
      throw new HttpError(403, 'That invite code isn’t valid');
    }
    if ((await User.estimatedDocumentCount()) >= env.MAX_USERS) {
      throw new HttpError(403, `This LifeSheet is limited to ${env.MAX_USERS} accounts and is full`);
    }
    if (await User.exists({ $or: [{ email }, { username }] })) {
      throw new HttpError(409, 'That email or username is already in use');
    }

    const user = await User.create({
      name,
      username,
      email,
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      role: env.adminEmail && email === env.adminEmail ? 'admin' : 'user',
    });

    setSessionCookie(res, user);
    res.status(201).json({ user: user.toPublic() });
  }),
);

router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { identifier, password } = loginSchema.parse(req.body ?? {});
    const query = identifier.includes('@') ? { email: identifier } : { username: identifier };
    const user = await User.findOne(query).select('+passwordHash');

    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw new HttpError(401, 'Wrong email/username or password');

    setSessionCookie(res, user);
    res.json({ user: user.toPublic() });
  }),
);

router.post('/logout', (_req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

// Returns { user: null } instead of 401 when logged out — the client calls this on every load.
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const session = readSession(req);
    const user = session && (await User.findById(session.id));
    if (!user) {
      if (session) clearSessionCookie(res); // account deleted since the cookie was issued
      return res.json({ user: null });
    }
    res.json({ user: user.toPublic() });
  }),
);

// FUTURE: POST /password (change password), POST /forgot + /reset (email reset link).

export default router;
