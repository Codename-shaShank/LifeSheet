import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9_]{3,30}$/,
    },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    // FUTURE: disabled (admin can lock an account), lastActiveAt (for streaks/notifications).
  },
  { timestamps: true },
);

/** The only shape of a user that ever leaves the server. */
userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    name: this.name,
    username: this.username,
    email: this.email,
    role: this.role,
    createdAt: this.createdAt,
  };
};

export const User = model('User', userSchema);
