import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    avatarColor: {
      type: Number,
      default: 0,
      min: 0,
      max: 7,
    },
    playerCard: {
      type: {
        iq: { type: Number, min: 0, max: 5 },
        shooter: { type: Number, min: 0, max: 5 },
        racing: { type: Number, min: 0, max: 5 },
        party: { type: Number, min: 0, max: 5 },
        troll: { type: Number, min: 0, max: 5 },
      },
      default: null,
    },
    cardImage: { type: String, default: null },
    bio: { type: String, default: "", maxlength: 300, trim: true },
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password helper
UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model('User', UserSchema);
