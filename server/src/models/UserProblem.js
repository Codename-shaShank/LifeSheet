import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * One document per (user × problem they've touched). No document = not done, not saved, no notes.
 * problemId is the id from the generated sheet JSON; the server never stores titles or links,
 * so content can change freely without migrations.
 */
const userProblemSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    problemId: { type: String, required: true, maxlength: 160 },
    done: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    saved: { type: Boolean, default: false }, // FUTURE: replace with savedIn: [collectionId]
    // Free-form { fieldKey: string } — the field list lives in client/src/content/notesSchema.js.
    notes: { type: Schema.Types.Mixed, default: () => ({}) },
    hasNotes: { type: Boolean, default: false }, // denormalised so the progress list stays tiny
  },
  { timestamps: true, minimize: false },
);

// Covers every query in the app: all of a user's rows, or one row by (user, problem).
userProblemSchema.index({ userId: 1, problemId: 1 }, { unique: true });

/**
 * Create-or-update one row. Two first-time writes racing on the same key can collide on the
 * unique index; the retry then finds the row the other request just created.
 */
userProblemSchema.statics.upsertFor = async function upsertFor(userId, problemId, update, select) {
  const run = () =>
    this.findOneAndUpdate({ userId, problemId }, update, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true })
      .select(select)
      .lean();
  try {
    return await run();
  } catch (err) {
    if (err?.code === 11000) return run();
    throw err;
  }
};

export const UserProblem = model('UserProblem', userProblemSchema);
