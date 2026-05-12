import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import olympicsRouter from "./src/routes/olympics.js";
import authRouter from "./src/routes/auth.js";
import gamePresetsRouter from "./src/routes/gamePresets.js";
import usersRouter from "./src/routes/users.js";
import { initSocket } from "./src/socket/index.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Allow both www and non-www versions, plus localhost for development
const allowedOrigins = [
  CLIENT_URL,
  CLIENT_URL.replace("https://", "https://www.").replace("http://", "http://www."), // add www prefix
  CLIENT_URL.replace("https://www.", "https://").replace("http://www.", "http://"), // remove www prefix
];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

// Make io globally available to routes
global.io = io;

// Middleware
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "15mb" })); // generous limit for base64 images

// Routes
app.use("/api/olympics", olympicsRouter);
app.use("/api/auth", authRouter);
app.use("/api/game-presets", gamePresetsRouter);
app.use("/api/users", usersRouter);

// Health check
app.get("/health", (_req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() }),
);

// GET /api/profile-presets - list available profile picture presets
app.get("/api/profile-presets", (_req, res) => {
  const presets = Array.from({ length: 30 }, (_, i) => ({
    id: `Charakter_${i + 1}`,
    name: `Charakter ${i + 1}`,
  }));
  res.json(presets);
});

// Socket.IO
initSocket(io);

// Connect to MongoDB then start server
const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/party-olympiade";
const PORT = process.env.PORT || 5000;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    httpServer.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`),
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
