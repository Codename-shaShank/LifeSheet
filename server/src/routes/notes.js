import { Router } from 'express';
import { z } from 'zod';
import { UserProblem } from '../models/UserProblem.js';
import { asyncHandler } from '../middleware/errors.js';
import { validateProblemId } from './problemId.js';

const router = Router();
router.param('problemId', validateProblemId);

// Field names are NOT hard-coded: the client's notesSchema.js decides them. The server only
// enforces safe shapes, so adding a notes field never needs a backend change.
const NOTE_KEY = /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/;
const MAX_FIELDS = 30;
const MAX_CHARS = 10_000;

const notesBody = z.object({
  notes: z
    .record(z.string().regex(NOTE_KEY, 'Invalid note field name'), z.string().max(MAX_CHARS, `A note can be at most ${MAX_CHARS} characters`))
    .refine((o) => Object.keys(o).length <= MAX_FIELDS, `At most ${MAX_FIELDS} note fields`),
});

router.get(
  '/:problemId',
  asyncHandler(async (req, res) => {
    const doc = await UserProblem.findOne({ userId: req.user.id, problemId: req.params.problemId })
      .select('notes -_id')
      .lean();
    res.json({ notes: doc?.notes ?? {} });
  }),
);

// Replaces the whole notes object. Empty fields are dropped, so clearing a field deletes it.
router.put(
  '/:problemId',
  asyncHandler(async (req, res) => {
    const { notes } = notesBody.parse(req.body ?? {});
    const clean = Object.fromEntries(
      Object.entries(notes)
        .map(([key, value]) => [key, value.trim()])
        .filter(([, value]) => value),
    );

    const doc = await UserProblem.upsertFor(
      req.user.id,
      req.params.problemId,
      { $set: { notes: clean, hasNotes: Object.keys(clean).length > 0 } },
      'notes hasNotes -_id',
    );
    res.json({ notes: doc.notes, hasNotes: doc.hasNotes });
  }),
);

// FUTURE: GET /export — all notes as Markdown for revision before interviews.

export default router;
