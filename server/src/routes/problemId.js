import { HttpError } from '../middleware/errors.js';

// Matches ids produced by client/scripts/ingest.mjs (lowercase slugs).
const PROBLEM_ID = /^[a-z0-9][a-z0-9-]{0,159}$/;

export function validateProblemId(_req, _res, next, id) {
  if (PROBLEM_ID.test(id)) return next();
  next(new HttpError(400, 'Invalid problem id'));
}
