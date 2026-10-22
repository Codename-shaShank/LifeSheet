import { Router } from 'express';
import { z } from 'zod';
import { UserProblem } from '../models/UserProblem.js';
import { asyncHandler } from '../middleware/errors.js';
import { validateProblemId } from './problemId.js';

const router = Router();
router.param('problemId', validateProblemId);

// Just what the listing page needs: flags, plus the difficulty pill and notes indicator.
const FIELDS = 'problemId done saved hasNotes notes.difficulty -_id';

const toRow = (d) => ({
  problemId: d.problemId,
  done: !!d.done,
  saved: !!d.saved,
  hasNotes: !!d.hasNotes,
  difficulty: d.notes?.difficulty ?? '',
});

const flagsSchema = z
  .object({ done: z.boolean().optional(), saved: z.boolean().optional() })
  .strict()
  .refine((o) => o.done !== undefined || o.saved !== undefined, 'Send done and/or saved');

// All of the user's rows in one response (~60 bytes each; 500 problems ≈ 30 KB).
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const docs = await UserProblem.find({ userId: req.user.id }).select(FIELDS).lean();
    res.json(docs.map(toRow));
  }),
);

router.patch(
  '/:problemId',
  asyncHandler(async (req, res) => {
    const flags = flagsSchema.parse(req.body ?? {});
    const set = { ...flags };
    if (flags.done !== undefined) set.completedAt = flags.done ? new Date() : null;

    const doc = await UserProblem.upsertFor(req.user.id, req.params.problemId, { $set: set }, FIELDS);
    res.json(toRow(doc));
  }),
);

// FUTURE: GET /stats — streak and per-day counts from completedAt, for the top-bar flame and Dashboard.
// FUTURE: POST /import — bulk-mark problems done (e.g. from a LeetCode profile sync).

export default router;
