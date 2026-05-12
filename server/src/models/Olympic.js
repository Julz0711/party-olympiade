import mongoose from "mongoose";

const StatSchema = new mongoose.Schema(
  {
    iq: { type: Number, min: 1, max: 10, default: 5 },
    shooter: { type: Number, min: 1, max: 10, default: 5 },
    partyAnimal: { type: Number, min: 1, max: 10, default: 5 },
    driver: { type: Number, min: 1, max: 10, default: 5 },
    strategist: { type: Number, min: 1, max: 10, default: 5 },
  },
  { _id: false },
);

const ParticipantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 30 },
  avatarBase64: { type: String, default: "" },
  stats: { type: StatSchema, default: () => ({}) },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  // Card display data — snapshotted from User profile on join
  username: { type: String, default: null },
  avatarColor: { type: Number, default: null },
  role: { type: String, enum: ["player", "host", "co-host"], default: "player" },
  cardImage: { type: String, default: null },
  playerCard: {
    type: {
      iq: { type: Number },
      shooter: { type: Number },
      racing: { type: Number },
      party: { type: Number },
      troll: { type: Number },
    },
    default: null,
  },
});

const AddonsSchema = new mongoose.Schema(
  {
    drinkingGame: {
      enabled: { type: Boolean, default: false },
      rules: { type: String, default: "", maxlength: 500 },
    },
    timeLimit: { type: Number, default: 0, min: 0 },
    equipment: { type: String, default: "", maxlength: 200 },
    handicap: { type: String, default: "", maxlength: 200 },
    teamSize: { type: Number, default: 2, min: 1 },
  },
  { _id: false },
);

const GameSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 60 },
  mode: { type: String, enum: ["ffa", "team"], default: "ffa" },
  icon: { type: String, default: "🎮", maxlength: 10 },
  rules: { type: String, default: "", maxlength: 1000 },
  imageBase64: { type: String, default: "" },
  order: { type: Number, default: 0 },
  estimatedMinutes: { type: Number, default: 0, min: 0 },
  addons: { type: AddonsSchema, default: () => ({}) },
});

const PlacementSchema = new mongoose.Schema(
  {
    participantName: { type: String, required: true },
    place: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const TeamResultSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    members: [{ type: String }],
    won: { type: Boolean, required: true },
  },
  { _id: false },
);

const ResultSchema = new mongoose.Schema(
  {
    gameId: { type: mongoose.Schema.Types.ObjectId, required: true },
    placements: [PlacementSchema],
    teams: [TeamResultSchema],
  },
  { _id: false },
);

const ExtraRulesSchema = new mongoose.Schema(
  {
    comebackPenalty: { type: Boolean, default: false },
    lastPlaceBonus: { type: Boolean, default: false },
    winStreakBonus: { type: Boolean, default: false },
    finalDoublePoints: { type: Boolean, default: false },
  },
  { _id: false },
);

const OlympicSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 4,
      maxlength: 6,
    },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    hostToken: { type: String, required: true },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "lobby", "active", "finished"],
      default: "draft",
    },
    maxPlayers: { type: Number, default: 20, min: 2, max: 50 },
    currentGameIndex: { type: Number, default: 0, min: 0 },
    tieRule: {
      type: String,
      enum: ["tiebreaker", "shared_points"],
      default: "tiebreaker",
    },
    scoringMode: {
      type: String,
      enum: ["linear", "top3", "f1"],
      default: "linear",
    },
    scoringEnabled: { type: Boolean, default: true },
    hostParticipates: { type: Boolean, default: false },
    hostGhostMode: { type: Boolean, default: false },
    hostPlayerName: { type: String, default: "", trim: true, maxlength: 30 },
    hideGamePlan: { type: Boolean, default: false },
    extraRules: { type: ExtraRulesSchema, default: () => ({}) },
    participants: [ParticipantSchema],
    games: [GameSchema],
    results: [ResultSchema],
    finalLeaderboard: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

// code uniqueness is enforced by unique: true in the schema field above

export default mongoose.model("Olympic", OlympicSchema);
