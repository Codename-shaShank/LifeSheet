import { Router } from 'express';
import { User } from '../models/User.js';
import { UserProblem } from '../models/UserProblem.js';
import { asyncHandler } from '../middleware/errors.js';

const router = Router();

// Every user with how many problems they've finished. Two queries, joined in memory (≤ 5 users).
router.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const [users, counts] = await Promise.all([
      User.find().select('name username email role createdAt').sort({ createdAt: 1 }).lean(),
      UserProblem.aggregate([{ $match: { done: true } }, { $group: { _id: '$userId', done: { $sum: 1 } } }]),
    ]);
    const doneBy = new Map(counts.map((c) => [String(c._id), c.done]));

    res.json(
      users.map((u) => ({
        id: String(u._id),
        name: u.name,
        username: u.username,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        done: doneBy.get(String(u._id)) ?? 0,
      })),
    );
  }),
);

// FUTURE: PATCH /users/:id (change role, disable), DELETE /users/:id (with their userproblems),
//         and invite-code rotation, all surfaced in an /admin page on the client.

export default router;
