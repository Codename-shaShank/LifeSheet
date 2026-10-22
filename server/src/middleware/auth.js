import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { HttpError, asyncHandler } from './errors.js';

export const COOKIE_NAME = 'ls_session';
const SESSION_DAYS = 7;

const cookieOptions = () => ({
  httpOnly: true, // JavaScript can't read it → XSS can't steal the session
  secure: env.isProd,
  sameSite: env.COOKIE_SAMESITE,
  maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  path: '/',
});

export function setSessionCookie(res, user) {
  const token = jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: user._id.toString(),
    expiresIn: `${SESSION_DAYS}d`,
  });
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

export function clearSessionCookie(res) {
  const { maxAge, ...options } = cookieOptions();
  res.clearCookie(COOKIE_NAME, options);
}

/** { id, role } from a valid cookie, otherwise null. */
export function readSession(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    return { id: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

export function requireAuth(req, _res, next) {
  const session = readSession(req);
  if (!session) return next(new HttpError(401, 'Log in to continue'));
  req.user = session;
  next();
}

/** Re-checks the role in the database, so a demoted admin loses access immediately. */
export const requireAdmin = asyncHandler(async (req, _res, next) => {
  const user = await User.findById(req.user.id).select('role').lean();
  if (user?.role !== 'admin') throw new HttpError(403, 'Only admins can do that');
  next();
});
