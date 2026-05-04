import express from "express";
import jwt from "jsonwebtoken";
import GamePreset from "../models/GamePreset.js";
import User from "../models/User.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer "))
    return res.status(401).json({ error: "Authentication required" });
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function optionalAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    } catch {
      // invalid token — treat as unauthenticated
    }
  }
  next();
}

function isMod(user) {
  return user?.role === "moderator" || user?.role === "admin";
}

// GET /api/game-presets — list presets
// Moderators/admins: all presets
// Authenticated users: approved + own (pending/rejected)
// Public: approved only
router.get("/", optionalAuth, async (req, res) => {
  try {
    let filter = {};
    if (isMod(req.user)) {
      filter = {}; // all
    } else if (req.user) {
      filter = { $or: [{ status: "approved" }, { createdBy: req.user.id }] };
    } else {
      filter = { status: "approved" };
    }

    const presets = await GamePreset.find(filter)
      .sort({ title: 1 })
      .select("-imageBase64")
      .lean();
    res.json(presets);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/game-presets/pending — list pending presets (mod/admin only)
router.get("/pending", requireAuth, async (req, res) => {
  if (!isMod(req.user))
    return res.status(403).json({ error: "Moderator access required" });
  try {
    const presets = await GamePreset.find({ status: "pending" })
      .sort({ createdAt: 1 })
      .select("-imageBase64")
      .lean();
    res.json(presets);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/game-presets/:id — single preset (includes imageBase64)
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const preset = await GamePreset.findById(req.params.id).lean();
    if (!preset) return res.status(404).json({ error: "Preset not found" });

    // Non-approved presets are only visible to creator and mods
    if (preset.status !== "approved") {
      if (!req.user) return res.status(404).json({ error: "Preset not found" });
      const isOwner = String(preset.createdBy) === String(req.user.id);
      if (!isOwner && !isMod(req.user))
        return res.status(404).json({ error: "Preset not found" });
    }

    res.json(preset);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/game-presets — create preset (auth required)
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, mode, icon, rules, addons, estimatedMinutes } = req.body;
    if (!title?.trim())
      return res.status(400).json({ error: "Title is required" });

    const user = await User.findById(req.user.id).select("username role").lean();
    if (!user) return res.status(401).json({ error: "User not found" });

    // Moderators and admins are auto-approved
    const status = isMod(user) ? "approved" : "pending";

    const preset = await GamePreset.create({
      title: title.trim(),
      mode: mode || "ffa",
      icon: icon || "🎮",
      rules: rules || "",
      estimatedMinutes: Number(estimatedMinutes) || 0,
      addons: addons || {},
      createdBy: req.user.id,
      createdByUsername: user.username,
      status,
    });

    res.status(201).json(preset);
  } catch (err) {
    console.error("create preset error:", err);
    res.status(500).json({ error: "Failed to create preset" });
  }
});

// PATCH /api/game-presets/:id/status — approve or reject (mod/admin only)
router.patch("/:id/status", requireAuth, async (req, res) => {
  if (!isMod(req.user))
    return res.status(403).json({ error: "Moderator access required" });
  try {
    const { status, rejectionReason } = req.body;
    if (!["approved", "rejected"].includes(status))
      return res.status(400).json({ error: "status must be approved or rejected" });

    const preset = await GamePreset.findById(req.params.id);
    if (!preset) return res.status(404).json({ error: "Preset not found" });

    preset.status = status;
    preset.rejectionReason = status === "rejected" ? (rejectionReason || "") : "";
    await preset.save();
    res.json(preset);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/game-presets/:id — update own preset (auth required)
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const preset = await GamePreset.findById(req.params.id);
    if (!preset) return res.status(404).json({ error: "Preset not found" });

    const isOwner = String(preset.createdBy) === String(req.user.id);
    if (!isOwner && !isMod(req.user))
      return res.status(403).json({ error: "Not your preset" });

    const { title, mode, icon, rules, addons, estimatedMinutes } = req.body;
    if (title !== undefined) preset.title = title.trim();
    if (mode !== undefined) preset.mode = mode;
    if (icon !== undefined) preset.icon = icon || "🎮";
    if (rules !== undefined) preset.rules = rules;
    if (addons !== undefined) preset.addons = addons;
    if (estimatedMinutes !== undefined)
      preset.estimatedMinutes = Number(estimatedMinutes) || 0;

    // Editing a rejected/pending preset resets it to pending for re-review
    if (isOwner && !isMod(req.user) && preset.status === "rejected") {
      preset.status = "pending";
      preset.rejectionReason = "";
    }

    await preset.save();
    res.json(preset);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/game-presets/:id — delete own preset or any preset (mod/admin)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const preset = await GamePreset.findById(req.params.id);
    if (!preset) return res.status(404).json({ error: "Preset not found" });

    const isOwner = String(preset.createdBy) === String(req.user.id);
    if (!isOwner && !isMod(req.user))
      return res.status(403).json({ error: "Not your preset" });

    await preset.deleteOne();
    res.json({ message: "Preset deleted" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
