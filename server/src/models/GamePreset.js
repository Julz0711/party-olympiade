import mongoose from "mongoose";

const GamePresetSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 60 },
    mode: { type: String, enum: ["ffa", "team"], default: "ffa" },
    icon: { type: String, default: "🎮", maxlength: 10 },
    rules: { type: String, default: "", maxlength: 1000 },
    estimatedMinutes: { type: Number, default: 0, min: 0 },
    imageBase64: { type: String, default: "" },
    addons: {
      drinkingGame: {
        enabled: { type: Boolean, default: false },
        rules: { type: String, default: "", maxlength: 500 },
      },
      timeLimit: { type: Number, default: 0, min: 0 },
      equipment: { type: String, default: "", maxlength: 200 },
      handicap: { type: String, default: "", maxlength: 200 },
      teamSize: { type: Number, default: 2, min: 1 },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByUsername: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: { type: String, default: "" },
  },
  { timestamps: true },
);

// Text index for search
GamePresetSchema.index({ title: "text", rules: "text" });

export default mongoose.model("GamePreset", GamePresetSchema);
