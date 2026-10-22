import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Express 4 doesn't catch rejected promises — route handlers go through this. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function notFound(req, _res, next) {
  next(new HttpError(404, `No route for ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const where = issue?.path?.length ? `${issue.path.join('.')}: ` : '';
    return res.status(400).json({ error: `${where}${issue?.message ?? 'Invalid input'}` });
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0];
    return res.status(409).json({ error: field ? `That ${field} is already taken` : 'Already exists' });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON' });
  }

  const status = err?.status ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Something went wrong on the server' : err.message });
}
