import express from "express";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import Olympic from "../models/Olympic.js";
import User from "../models/User.js";
import { computeLeaderboard } from "../utils/scoring.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";

/** Generate a unique 4-char room code */
async function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  let exists = true;
  while (exists) {
    code = Array.from(
      { length: 4 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
    exists = await Olympic.exists({ code });
  }
  return code;
}

/** Middleware: verify host token */
function requireHostToken(req, res, next) {
  const token = req.headers["x-host-token"];
  if (!token) return res.status(401).json({ error: "Host token required" });
  req.hostToken = token;
  next();
}

/** Middleware: verify JWT auth */
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

// POST /api/olympics — Create a new Olympic as a draft (requires auth)
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      name,
      tieRule,
      extraRules,
      games,
      maxPlayers,
      scoringMode,
      scoringEnabled,
      hostParticipates,
      hostGhostMode,
      hostPlayerName,
      hideGamePlan,
    } = req.body;
    if (!name)
      return res.status(400).json({ error: "Olympic name is required" });

    const code = await generateCode();
    const hostToken = uuidv4();

    const olympic = await Olympic.create({
      code,
      name,
      hostToken,
      ownerId: req.user.id,
      tieRule: tieRule || "tiebreaker",
      scoringMode: scoringMode || "linear",
      scoringEnabled: scoringEnabled !== false,
      hostParticipates: !!hostParticipates,
      hostGhostMode: !!hostGhostMode,
      hostPlayerName: hostPlayerName || "",
      hideGamePlan: !!hideGamePlan,
      extraRules: extraRules || {},
      maxPlayers: maxPlayers || 20,
      participants: [],
      games: games || [],
      results: [],
      status: "draft",
      currentGameIndex: 0,
    });

    res.status(201).json({ code: olympic.code, hostToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create Olympic" });
  }
});

// GET /api/olympics/mine — Get current user's Olympics (requires auth)
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const olympics = await Olympic.find({ ownerId: req.user.id })
      .sort({ createdAt: -1 })
      .select("-hostToken")
      .lean();
    res.json(olympics);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/olympics/participated — Olympics the user joined as a participant (requires auth)
router.get("/participated", requireAuth, async (req, res) => {
  try {
    const olympics = await Olympic.find({
      "participants.userId": req.user.id,
      // exclude ones they own (those appear in /mine)
      ownerId: { $ne: req.user.id },
    })
      .sort({ updatedAt: -1 })
      .select("-hostToken")
      .lean();
    res.json(olympics);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/olympics/:code — Get Olympic state (no hostToken in response)
router.get("/:code", async (req, res) => {
  try {
    const olympic = await Olympic.findOne({
      code: req.params.code.toUpperCase(),
    }).lean();
    if (!olympic) return res.status(404).json({ error: "Olympic not found" });

    const { hostToken: _ht, ...safeOlympic } = olympic;
    res.json(safeOlympic);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/olympics/:code/leaderboard — Computed leaderboard
router.get("/:code/leaderboard", async (req, res) => {
  try {
    const olympic = await Olympic.findOne({
      code: req.params.code.toUpperCase(),
    }).lean();
    if (!olympic) return res.status(404).json({ error: "Olympic not found" });

    res.json(computeLeaderboard(olympic));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/olympics/:code — Update a draft Olympic (requires auth + ownership)
router.patch("/:code", requireAuth, async (req, res) => {
  try {
    const olympic = await Olympic.findOne({
      code: req.params.code.toUpperCase(),
    });
    if (!olympic) return res.status(404).json({ error: "Olympic not found" });
    if (String(olympic.ownerId) !== String(req.user.id))
      return res.status(403).json({ error: "Not your Olympic" });
    if (olympic.status !== "draft")
      return res
        .status(400)
        .json({ error: "Only draft Olympics can be edited" });

    const {
      name,
      tieRule,
      extraRules,
      maxPlayers,
      games,
      scoringMode,
      scoringEnabled,
      hostParticipates,
      hostGhostMode,
      hostPlayerName,
      hideGamePlan,
    } = req.body;
    if (name !== undefined) olympic.name = name;
    if (tieRule !== undefined) olympic.tieRule = tieRule;
    if (scoringMode !== undefined) olympic.scoringMode = scoringMode;
    if (scoringEnabled !== undefined) olympic.scoringEnabled = scoringEnabled;
    if (extraRules !== undefined) olympic.extraRules = extraRules;
    if (maxPlayers !== undefined) olympic.maxPlayers = maxPlayers;
    if (games !== undefined) olympic.games = games;
    if (hostParticipates !== undefined)
      olympic.hostParticipates = hostParticipates;
    if (hostGhostMode !== undefined) olympic.hostGhostMode = !!hostGhostMode;
    if (hostPlayerName !== undefined) olympic.hostPlayerName = hostPlayerName;
    if (hideGamePlan !== undefined) olympic.hideGamePlan = !!hideGamePlan;

    await olympic.save();
    const { hostToken: _ht, ...safe } = olympic.toObject();
    res.json(safe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update Olympic" });
  }
});

// DELETE /api/olympics/:code — Delete an Olympic (requires auth + ownership)
router.delete("/:code", requireAuth, async (req, res) => {
  try {
    const olympic = await Olympic.findOne({
      code: req.params.code.toUpperCase(),
    });
    if (!olympic) return res.status(404).json({ error: "Olympic not found" });
    if (String(olympic.ownerId) !== String(req.user.id))
      return res.status(403).json({ error: "Not your Olympic" });

    await olympic.deleteOne();
    res.json({ message: "Olympic deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/olympics/:code/launch — Launch a draft into lobby (requires auth + ownership)
router.post("/:code/launch", requireAuth, async (req, res) => {
  try {
    const olympic = await Olympic.findOne({
      code: req.params.code.toUpperCase(),
    });
    if (!olympic) return res.status(404).json({ error: "Olympic not found" });
    if (String(olympic.ownerId) !== String(req.user.id))
      return res.status(403).json({ error: "Not your Olympic" });
    if (olympic.status !== "draft")
      return res.status(400).json({ error: "Olympic is already launched" });
    if (olympic.games.length === 0)
      return res
        .status(400)
        .json({ error: "Add at least one game before launching" });

    // Auto-add host as participant when hostParticipates is enabled
    if (olympic.hostParticipates && olympic.hostPlayerName?.trim()) {
      const hostName = olympic.hostPlayerName.trim();
      if (!olympic.participants.some((p) => p.name === hostName)) {
        const hostData = { name: hostName, userId: req.user.id };
        try {
          const hostUser = await User.findById(req.user.id)
            .select("avatarColor cardImage playerCard")
            .lean();
          if (hostUser) {
            hostData.avatarColor = hostUser.avatarColor ?? 0;
            hostData.cardImage = hostUser.cardImage ?? null;
            hostData.playerCard = hostUser.playerCard ?? null;
          }
        } catch {}
        olympic.participants.push(hostData);
      }
    }

    olympic.status = "lobby";
    await olympic.save();
    res.json({ code: olympic.code, hostToken: olympic.hostToken });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/olympics/:code/navigate — Move currentGameIndex
router.patch("/:code/navigate", requireHostToken, async (req, res) => {
  try {
    const olympic = await Olympic.findOne({
      code: req.params.code.toUpperCase(),
    });
    if (!olympic) return res.status(404).json({ error: "Olympic not found" });
    if (olympic.hostToken !== req.hostToken)
      return res.status(403).json({ error: "Invalid host token" });

    const { direction } = req.body; // 'next' | 'prev'
    const maxIndex = olympic.games.length - 1;
    if (direction === "next" && olympic.currentGameIndex < maxIndex)
      olympic.currentGameIndex += 1;
    else if (direction === "prev" && olympic.currentGameIndex > 0)
      olympic.currentGameIndex -= 1;

    await olympic.save();
    const { hostToken: _ht, ...safe } = olympic.toObject();
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/olympics/:code/status — Update status
router.patch("/:code/status", requireHostToken, async (req, res) => {
  try {
    const olympic = await Olympic.findOne({
      code: req.params.code.toUpperCase(),
    });
    if (!olympic) return res.status(404).json({ error: "Olympic not found" });
    if (olympic.hostToken !== req.hostToken)
      return res.status(403).json({ error: "Invalid host token" });

    const { status } = req.body;
    if (!["setup", "active", "finished"].includes(status))
      return res.status(400).json({ error: "Invalid status" });

    olympic.status = status;
    await olympic.save();
    const { hostToken: _ht, ...safe } = olympic.toObject();
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/olympics/:code/results — Submit / upsert game result
router.post("/:code/results", requireHostToken, async (req, res) => {
  try {
    const olympic = await Olympic.findOne({
      code: req.params.code.toUpperCase(),
    });
    if (!olympic) return res.status(404).json({ error: "Olympic not found" });
    if (olympic.hostToken !== req.hostToken)
      return res.status(403).json({ error: "Invalid host token" });

    const { gameId, placements, teams } = req.body;
    if (!gameId) return res.status(400).json({ error: "gameId required" });

    const existingIdx = olympic.results.findIndex(
      (r) => String(r.gameId) === String(gameId),
    );
    const resultData = {
      gameId,
      placements: placements || [],
      teams: teams || [],
    };

    if (existingIdx >= 0) olympic.results[existingIdx] = resultData;
    else olympic.results.push(resultData);

    await olympic.save();
    const { hostToken: _ht, ...safe } = olympic.toObject();
    const leaderboard = computeLeaderboard(safe);
    res.json({ olympic: safe, leaderboard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/olympics/:code/results/:gameId — Remove a game result
router.delete("/:code/results/:gameId", requireHostToken, async (req, res) => {
  try {
    const olympic = await Olympic.findOne({
      code: req.params.code.toUpperCase(),
    });
    if (!olympic) return res.status(404).json({ error: "Olympic not found" });
    if (olympic.hostToken !== req.hostToken)
      return res.status(403).json({ error: "Invalid host token" });

    olympic.results = olympic.results.filter(
      (r) => String(r.gameId) !== req.params.gameId,
    );
    await olympic.save();
    const { hostToken: _ht, ...safe } = olympic.toObject();
    res.json({ olympic: safe, leaderboard: computeLeaderboard(safe) });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/olympics/:code/games — Update games list (requires host token, works during active games)
router.patch("/:code/games", requireHostToken, async (req, res) => {
  try {
    const olympic = await Olympic.findOne({ code: req.params.code.toUpperCase() });
    if (!olympic) return res.status(404).json({ error: "Olympic not found" });
    if (olympic.hostToken !== req.hostToken)
      return res.status(403).json({ error: "Invalid host token" });

    const { games } = req.body;
    if (!Array.isArray(games)) return res.status(400).json({ error: "games must be an array" });

    olympic.games = games;
    await olympic.save();

    const safe = olympic.toObject();
    delete safe.hostToken;

    if (global.io) {
      const leaderboard = computeLeaderboard(safe);
      global.io.to(req.params.code.toUpperCase()).emit("room-update", { olympic: safe, leaderboard });
    }

    res.json(safe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update games" });
  }
});

// PATCH /api/olympics/:code/participants/role — Update participant role by name (requires host token)
router.patch("/:code/participants/role", requireHostToken, async (req, res) => {
  try {
    const { code } = req.params;
    const { name, role } = req.body;
    const hostToken = req.hostToken;

    const olympic = await Olympic.findOne({ code: code.toUpperCase() });
    if (!olympic) return res.status(404).json({ error: "Olympic not found" });

    // Verify host token
    if (olympic.hostToken !== hostToken) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Validate role
    if (!["player", "co-host"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    if (!name) return res.status(400).json({ error: "Participant name required" });

    // Update participant role by name
    const participant = olympic.participants.find(
      (p) => p.name === name,
    );
    if (!participant)
      return res.status(404).json({ error: "Participant not found" });

    participant.role = role; // 'player' or 'co-host'
    await olympic.save();

    // Broadcast update via Socket.IO
    if (global.io) {
      const safe = olympic.toObject();
      delete safe.hostToken;
      const leaderboard = computeLeaderboard(safe);
      global.io.to(code.toUpperCase()).emit("room-update", {
        olympic: safe,
        leaderboard,
      });

      // Grant or revoke hostToken for the co-host's socket
      const sockets = await global.io.in(code.toUpperCase()).fetchSockets();
      for (const s of sockets) {
        if (s.data.name === name && !s.data.isHost) {
          if (role === "co-host") {
            s.emit("cohost-token", { hostToken: olympic.hostToken });
          } else {
            s.emit("cohost-token", { hostToken: null });
          }
          break;
        }
      }
    }

    const { hostToken: _ht, ...safe } = olympic.toObject();
    res.json(safe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update role" });
  }
});

export default router;
