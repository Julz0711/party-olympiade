import Olympic from "../models/Olympic.js";
import User from "../models/User.js";
import { computeLeaderboard } from "../utils/scoring.js";
import { getRandomTiebreakerQuestion } from "../data/tiebreakerQuestions.js";

// In-memory tiebreaker state: code → { question, correctAnswer, unit, tiedPlayers, gameId, answers }
const activeTiebreakers = new Map();

// Chat rate limiting: socketId → { timestamps: number[], blockedUntil: number }
const chatLimits = new Map();
const CHAT_MAX_MSGS = 5;   // messages allowed in the window
const CHAT_WINDOW_MS = 5000;  // rolling window (ms)
const CHAT_COOLDOWN_MS = 10000; // block duration after exceeding limit (ms)

export function initSocket(io) {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    /**
     * Helper: check if a participant is a host or co-host
     */
    const isHostOrCoHost = (participant) => {
      return participant && (participant.role === 'host' || participant.role === 'co-host');
    };

    /**
     * join-room — join a room by Olympic code
     * payload: { code, name, isHost, hostToken? }
     */
    socket.on(
      "join-room",
      async ({ code, name, isHost, hostToken, userId }) => {
        if (!code)
          return socket.emit("error", { message: "Room code required" });

        const upperCode = code.toUpperCase();
        try {
          // Use findOne (not lean) so we can save if needed
          const olympic = await Olympic.findOne({ code: upperCode });
          if (!olympic)
            return socket.emit("error", { message: "Olympic not found" });

          let participantAdded = false;
          let hostDataSynced = false;

          // Only accept new players when the room is in lobby state
          if (olympic.status === "draft") {
            return socket.emit("error", {
              message: "This Olympic has not been launched yet",
            });
          }

          // Block unregistered participants from joining active/finished games
          if (!isHost && (olympic.status === "active" || olympic.status === "finished")) {
            const trimName = name?.trim();
            const isRegistered = trimName &&
              olympic.participants.some((p) => p.name === trimName);
            if (!isRegistered) {
              return socket.emit("error", { message: "GAME_IN_PROGRESS" });
            }
          }

          // Sync host card data into their participant entry on rejoin
          if (isHost && userId && olympic.hostParticipates && olympic.hostPlayerName) {
            const hostEntry = olympic.participants.find(
              (p) => p.name === olympic.hostPlayerName.trim()
            );
            if (hostEntry) {
              try {
                const userDoc = await User.findById(userId)
                  .select("username avatarColor cardImage playerCard")
                  .lean();
                if (userDoc) {
                  hostEntry.userId = userId;
                  hostEntry.username = userDoc.username ?? null;
                  hostEntry.avatarColor = userDoc.avatarColor ?? 0;
                  hostEntry.cardImage = userDoc.cardImage ?? null;
                  hostEntry.playerCard = userDoc.playerCard ?? null;
                  await olympic.save();
                  hostDataSynced = true;
                }
              } catch {}
            }
          }

          // Dynamically add participant when a non-host joins (lobby only)
          if (!isHost && name && name.trim() && olympic.status === "lobby") {
            const trimName = name.trim().slice(0, 30);
            const existing = olympic.participants.find(
              (p) => p.name === trimName,
            );
            if (!existing) {
              if (olympic.participants.length >= (olympic.maxPlayers || 20)) {
                return socket.emit("error", { message: "Room is full" });
              }
              const participantData = { name: trimName, userId: userId || null };
              if (userId) {
                try {
                  const userDoc = await User.findById(userId)
                    .select("username avatarColor cardImage playerCard")
                    .lean();
                  if (userDoc) {
                    participantData.username = userDoc.username ?? null;
                    participantData.avatarColor = userDoc.avatarColor ?? 0;
                    participantData.cardImage = userDoc.cardImage ?? null;
                    participantData.playerCard = userDoc.playerCard ?? null;
                  }
                } catch {}
              }
              olympic.participants.push(participantData);
              await olympic.save();
              participantAdded = true;
            } else if (userId && !existing.userId) {
              // Backfill userId if player rejoins while logged in
              existing.userId = userId;
              await olympic.save();
            }
          }

          socket.join(upperCode);
          socket.data.code = upperCode;
          socket.data.name = name;
          socket.data.isHost = isHost || false;

          const safeOlympic = olympic.toObject();
          delete safeOlympic.hostToken;
          const leaderboard = computeLeaderboard(safeOlympic);

          if (participantAdded || hostDataSynced) {
            // Broadcast to everyone so all devices see the updated player list
            io.to(upperCode).emit("room-update", {
              olympic: safeOlympic,
              leaderboard,
            });
          } else {
            socket.emit("room-update", { olympic: safeOlympic, leaderboard });
          }

          console.log(`${name || "Anonymous"} joined room ${upperCode}`);
        } catch (err) {
          console.error("join-room error:", err);
          socket.emit("error", { message: "Server error" });
        }
      },
    );

    /**
     * start-olympic — host or co-host starts the event (lobby → active) and triggers intro for all
     * payload: { code, hostToken }
     */
    socket.on("start-olympic", async ({ code, hostToken }) => {
      try {
        const olympic = await Olympic.findOne({ code: code.toUpperCase() });
        if (!olympic)
          return socket.emit("error", { message: "Olympic not found" });
        if (olympic.hostToken !== hostToken)
          return socket.emit("error", { message: "Unauthorized" });

        olympic.status = "active";
        await olympic.save();
        const safe = olympic.toObject();
        delete safe.hostToken;
        const leaderboard = computeLeaderboard(safe);

        // Emit intro first so the overlay is ready before room-update arrives
        io.to(code.toUpperCase()).emit("intro-start", { olympic: safe });
        io.to(code.toUpperCase()).emit("room-update", { olympic: safe, leaderboard });
      } catch (err) {
        console.error("start-olympic error:", err);
        socket.emit("error", { message: "Server error" });
      }
    });

    /**
     * intro-next — host advances slide index
     * payload: { code, hostToken, slideIndex }
     */
    socket.on("intro-next", ({ code, hostToken, slideIndex }) => {
      io.to(code.toUpperCase()).emit("intro-slide", { slideIndex });
    });

    /**
     * intro-close — host finishes or skips the intro; game is already active
     * payload: { code, hostToken }
     */
    socket.on("intro-close", ({ code, hostToken }) => {
      io.to(code.toUpperCase()).emit("intro-ended");
    });

    /**
     * navigate — host or co-host moves to next/prev game
     * payload: { code, direction, hostToken }
     */
    socket.on("navigate", async ({ code, direction, hostToken }) => {
      try {
        const olympic = await Olympic.findOne({ code: code.toUpperCase() });
        if (!olympic)
          return socket.emit("error", { message: "Olympic not found" });
        if (olympic.hostToken !== hostToken)
          return socket.emit("error", { message: "Unauthorized" });

        const maxIndex = olympic.games.length - 1;
        if (direction === "next" && olympic.currentGameIndex < maxIndex)
          olympic.currentGameIndex += 1;
        else if (direction === "prev" && olympic.currentGameIndex > 0)
          olympic.currentGameIndex -= 1;

        await olympic.save();
        const safe = olympic.toObject();
        delete safe.hostToken;
        const leaderboard = computeLeaderboard(safe);

        io.to(code.toUpperCase()).emit("room-update", {
          olympic: safe,
          leaderboard,
        });
      } catch (err) {
        console.error("navigate error:", err);
        socket.emit("error", { message: "Server error" });
      }
    });

    /**
     * submit-score — host or co-host submits result for a game
     * payload: { code, result: { gameId, placements, teams }, hostToken }
     */
    socket.on("submit-score", async ({ code, result, hostToken }) => {
      try {
        const olympic = await Olympic.findOne({ code: code.toUpperCase() });
        if (!olympic)
          return socket.emit("error", { message: "Olympic not found" });
        if (olympic.hostToken !== hostToken)
          return socket.emit("error", { message: "Unauthorized" });

        const { gameId, placements, teams } = result;
        const existingIdx = olympic.results.findIndex(
          (r) => String(r.gameId) === String(gameId),
        );
        const resultData = {
          gameId,
          placements: placements || [],
          teams: teams || [],
        };

        // Snapshot old bonus log counts before saving
        const safeOld = olympic.toObject();
        delete safeOld.hostToken;
        const oldLeaderboard = computeLeaderboard(safeOld);
        const oldBonusCounts = {};
        for (const e of oldLeaderboard) {
          oldBonusCounts[e.name] = e.bonusLog?.length ?? 0;
        }

        if (existingIdx >= 0) olympic.results[existingIdx] = resultData;
        else olympic.results.push(resultData);

        await olympic.save();
        const safe2 = olympic.toObject();
        delete safe2.hostToken;
        const leaderboard2 = computeLeaderboard(safe2);
        const upperCode = code.toUpperCase();

        io.to(upperCode).emit("room-update", {
          olympic: safe2,
          leaderboard: leaderboard2,
        });

        // Emit newly earned bonus events
        const newBonusEvents = [];
        for (const entry of leaderboard2) {
          const oldCount = oldBonusCounts[entry.name] ?? 0;
          const newLogs = (entry.bonusLog || []).slice(oldCount);
          for (const log of newLogs) {
            newBonusEvents.push({ player: entry.name, ...log });
          }
        }
        if (newBonusEvents.length > 0) {
          io.to(upperCode).emit("bonus-events", newBonusEvents);
        }

        // Detect ties and trigger tiebreaker if enabled
        if (olympic.tieRule === "tiebreaker" && placements?.length) {
          const groups = {};
          for (const p of placements) {
            if (!groups[p.place]) groups[p.place] = [];
            groups[p.place].push(p.participantName);
          }
          const tiedGroup = Object.entries(groups)
            .filter(([, names]) => names.length > 1)
            .sort(([a], [b]) => Number(a) - Number(b))[0];

          if (tiedGroup) {
            const q = getRandomTiebreakerQuestion();
            activeTiebreakers.set(upperCode, {
              question: q.question,
              correctAnswer: q.correctAnswer,
              unit: q.unit,
              tiedPlayers: tiedGroup[1],
              gameId: String(gameId),
              answers: {},
            });
            io.to(upperCode).emit("tiebreaker-start", {
              question: q.question,
              unit: q.unit,
              tiedPlayers: tiedGroup[1],
              gameId: String(gameId),
            });
          }
        }
      } catch (err) {
        console.error("submit-score error:", err);
        socket.emit("error", { message: "Server error" });
      }
    });

    /**
     * tiebreaker-answer — participant submits their answer
     * payload: { code, name, answer }
     */
    socket.on("tiebreaker-answer", ({ code, name, answer }) => {
      const upperCode = code?.toUpperCase();
      const tb = activeTiebreakers.get(upperCode);
      if (!tb || !tb.tiedPlayers.includes(name)) return;

      tb.answers[name] = String(answer).trim();

      // Relay updated answers to everyone in the room (host shows them live)
      io.to(upperCode).emit("tiebreaker-answers-update", {
        answers: tb.answers,
        tiedPlayers: tb.tiedPlayers,
      });
    });

    /**
     * tiebreaker-resolve — host or co-host picks the winner
     * payload: { code, hostToken, gameId, winner }
     */
    socket.on("tiebreaker-resolve", async ({ code, hostToken, gameId, winner }) => {
      try {
        const upperCode = code?.toUpperCase();
        const olympic = await Olympic.findOne({ code: upperCode });
        if (!olympic) return;
        if (olympic.hostToken !== hostToken) return;

        const tb = activeTiebreakers.get(upperCode);
        const tiedPlayers = tb ? tb.tiedPlayers : [];
        activeTiebreakers.delete(upperCode);

        // Adjust placements: winner keeps the tied place, others cascade down
        const resultIdx = olympic.results.findIndex((r) => String(r.gameId) === String(gameId));
        if (resultIdx >= 0 && tiedPlayers.length > 1) {
          const placements = [...olympic.results[resultIdx].placements];
          // Find the tied place value
          const tiedPlace = placements.find((p) => p.participantName === winner)?.place;
          if (tiedPlace != null) {
            let nextPlace = tiedPlace + 1;
            for (const p of placements) {
              if (p.participantName !== winner && tiedPlayers.includes(p.participantName)) {
                p.place = nextPlace++;
              }
            }
            // Shift all non-tied placements that were at or above tiedPlace+1
            for (const p of placements) {
              if (!tiedPlayers.includes(p.participantName) && p.place >= tiedPlace + 1) {
                p.place += tiedPlayers.length - 1;
              }
            }
            olympic.results[resultIdx].placements = placements;
            await olympic.save();
          }
        }

        const safe = olympic.toObject();
        delete safe.hostToken;
        io.to(upperCode).emit("room-update", { olympic: safe, leaderboard: computeLeaderboard(safe) });
        io.to(upperCode).emit("tiebreaker-resolved", { winner });
      } catch (err) {
        console.error("tiebreaker-resolve error:", err);
      }
    });

    /**
     * finish-olympic — host or co-host ends the event
     * payload: { code, hostToken }
     */
    socket.on("finish-olympic", async ({ code, hostToken }) => {
      try {
        const olympic = await Olympic.findOne({ code: code.toUpperCase() });
        if (!olympic)
          return socket.emit("error", { message: "Olympic not found" });
        if (olympic.hostToken !== hostToken)
          return socket.emit("error", { message: "Unauthorized" });

        olympic.status = "finished";
        const safe3 = olympic.toObject();
        delete safe3.hostToken;
        const leaderboard3 = computeLeaderboard(safe3);

        // Persist final leaderboard snapshot
        olympic.finalLeaderboard = leaderboard3;
        await olympic.save();

        io.to(code.toUpperCase()).emit("room-update", {
          olympic: safe3,
          leaderboard: leaderboard3,
        });
        io.to(code.toUpperCase()).emit("olympic-finished", {
          code: code.toUpperCase(),
        });
      } catch (err) {
        console.error("finish-olympic error:", err);
        socket.emit("error", { message: "Server error" });
      }
    });

    /**
     * revert-to-draft — host or co-host reverts lobby back to draft
     * payload: { code, hostToken }
     */
    socket.on("revert-to-draft", async ({ code, hostToken }) => {
      try {
        const olympic = await Olympic.findOne({ code: code.toUpperCase() });
        if (!olympic)
          return socket.emit("error", { message: "Olympic not found" });
        if (olympic.hostToken !== hostToken)
          return socket.emit("error", { message: "Unauthorized" });
        if (olympic.status !== "lobby" && olympic.status !== "active")
          return socket.emit("error", {
            message: "Can only revert from lobby or active",
          });

        olympic.status = "draft";
        olympic.participants = []; // clear — they'll re-join on next launch
        await olympic.save();

        // Tell all connected sockets in this room (participants get kicked)
        io.to(code.toUpperCase()).emit("olympic-reverted", {
          code: code.toUpperCase(),
        });
      } catch (err) {
        console.error("revert-to-draft error:", err);
        socket.emit("error", { message: "Server error" });
      }
    });

    /**
     * chat-message — relay a chat message to everyone in the room
     * payload: { code, name, text }
     */
    socket.on("chat-message", ({ code, name, text }) => {
      const upperCode = code?.toUpperCase();
      const trimText = String(text || "").trim().slice(0, 200);
      const trimName = String(name || "?").trim().slice(0, 30);
      if (!trimText || !upperCode || !trimName) return;

      const now = Date.now();
      const limit = chatLimits.get(socket.id) || { timestamps: [], blockedUntil: 0 };

      if (now < limit.blockedUntil) {
        socket.emit("chat-cooldown", { secsLeft: Math.ceil((limit.blockedUntil - now) / 1000) });
        return;
      }

      limit.timestamps = limit.timestamps.filter((t) => now - t < CHAT_WINDOW_MS);
      limit.timestamps.push(now);

      if (limit.timestamps.length > CHAT_MAX_MSGS) {
        limit.blockedUntil = now + CHAT_COOLDOWN_MS;
        limit.timestamps = [];
        chatLimits.set(socket.id, limit);
        socket.emit("chat-cooldown", { secsLeft: Math.ceil(CHAT_COOLDOWN_MS / 1000) });
        return;
      }

      chatLimits.set(socket.id, limit);
      io.to(upperCode).emit("chat-message", {
        name: trimName,
        text: trimText,
        ts: Date.now(),
      });
    });

    socket.on("disconnect", () => {
      chatLimits.delete(socket.id);
      console.log(`Socket disconnected: ${socket.id}`);
      // If a participant disconnects from the lobby, remove them from participants
      const roomCode = socket.data.code;
      const playerName = socket.data.name;
      const isHost = socket.data.isHost;
      if (roomCode && playerName && !isHost) {
        Olympic.findOne({ code: roomCode, status: "lobby" })
          .then(async (olympic) => {
            if (!olympic) return;
            const before = olympic.participants.length;
            olympic.participants = olympic.participants.filter(
              (p) => p.name !== playerName,
            );
            if (olympic.participants.length !== before) {
              await olympic.save();
              const safe = olympic.toObject();
              delete safe.hostToken;
              io.to(roomCode).emit("room-update", {
                olympic: safe,
                leaderboard: computeLeaderboard(safe),
              });
            }
          })
          .catch(() => {});
      }
    });

    /**
     * update-settings — host or co-host edits event settings during active olympic
     * payload: { code, hostToken, settings }
     * settings: { name, maxPlayers, scoringMode, tieRule, extraRules,
     *             hostParticipates, hostPlayerName, hideGamePlan }
     */
    socket.on("update-settings", async ({ code, hostToken, settings }) => {
      try {
        const upperCode = code.toUpperCase();
        const olympic = await Olympic.findOne({ code: upperCode });
        if (!olympic)
          return socket.emit("error", { message: "Olympic not found" });
        if (olympic.hostToken !== hostToken)
          return socket.emit("error", { message: "Unauthorized" });

        const {
          name,
          maxPlayers,
          scoringMode,
          tieRule,
          extraRules,
          hostParticipates,
          hostGhostMode,
          hostPlayerName,
          hideGamePlan,
        } = settings || {};

        if (name !== undefined) {
          const n = String(name).trim().slice(0, 60);
          if (n.length > 0) olympic.name = n;
        }
        if (maxPlayers !== undefined) {
          olympic.maxPlayers = Math.max(2, Math.min(50, Number(maxPlayers)));
        }
        if (
          scoringMode !== undefined &&
          ["linear", "top3", "f1"].includes(scoringMode)
        ) {
          olympic.scoringMode = scoringMode;
        }
        if (
          tieRule !== undefined &&
          ["tiebreaker", "shared_points"].includes(tieRule)
        ) {
          olympic.tieRule = tieRule;
        }
        if (extraRules !== undefined && typeof extraRules === "object") {
          olympic.extraRules = {
            comebackPenalty: !!extraRules.comebackPenalty,
            lastPlaceBonus: !!extraRules.lastPlaceBonus,
            winStreakBonus: !!extraRules.winStreakBonus,
            finalDoublePoints: !!extraRules.finalDoublePoints,
          };
        }
        if (hostParticipates !== undefined) {
          olympic.hostParticipates = !!hostParticipates;
        }
        if (hostGhostMode !== undefined) {
          olympic.hostGhostMode = !!hostGhostMode;
        }
        if (hostPlayerName !== undefined) {
          olympic.hostPlayerName = String(hostPlayerName).trim().slice(0, 30);
        }
        if (hideGamePlan !== undefined) {
          olympic.hideGamePlan = !!hideGamePlan;
        }

        await olympic.save();
        const safe = olympic.toObject();
        delete safe.hostToken;
        io.to(upperCode).emit("room-update", {
          olympic: safe,
          leaderboard: computeLeaderboard(safe),
        });
      } catch (err) {
        console.error("update-settings error:", err);
        socket.emit("error", { message: "Server error" });
      }
    });

    /**
     * toggle-game-plan — host or co-host shows/hides game titles for participants
     * payload: { code, hostToken, hide }
     */
    socket.on("toggle-game-plan", async ({ code, hostToken, hide }) => {
      try {
        const upperCode = code.toUpperCase();
        const olympic = await Olympic.findOne({ code: upperCode });
        if (!olympic)
          return socket.emit("error", { message: "Olympic not found" });
        if (olympic.hostToken !== hostToken)
          return socket.emit("error", { message: "Unauthorized" });
        olympic.hideGamePlan = !!hide;
        await olympic.save();
        const safe = olympic.toObject();
        delete safe.hostToken;
        io.to(upperCode).emit("room-update", {
          olympic: safe,
          leaderboard: computeLeaderboard(safe),
        });
      } catch (err) {
        console.error("toggle-game-plan error:", err);
        socket.emit("error", { message: "Server error" });
      }
    });

    /**
     * edit-games — host or co-host reorders, removes, or adds games during active olympic
     * payload: { code, hostToken, games }
     * Games with an existing _id are kept as-is; games without _id are new entries.
     */
    socket.on("edit-games", async ({ code, hostToken, games }) => {
      try {
        const upperCode = code.toUpperCase();
        const olympic = await Olympic.findOne({ code: upperCode });
        if (!olympic)
          return socket.emit("error", { message: "Olympic not found" });
        if (olympic.hostToken !== hostToken)
          return socket.emit("error", { message: "Unauthorized" });
        if (!Array.isArray(games) || games.length === 0)
          return socket.emit("error", {
            message: "At least one game required",
          });

        // Validate each entry: must have a non-empty title
        const validGames = games.filter(
          (g) => g && typeof g.title === "string" && g.title.trim().length > 0,
        );
        if (validGames.length === 0)
          return socket.emit("error", { message: "No valid games provided" });

        olympic.games = validGames;
        // Clamp currentGameIndex to valid range
        if (olympic.currentGameIndex >= validGames.length) {
          olympic.currentGameIndex = validGames.length - 1;
        }
        await olympic.save();

        const safe = olympic.toObject();
        delete safe.hostToken;
        io.to(upperCode).emit("room-update", {
          olympic: safe,
          leaderboard: computeLeaderboard(safe),
        });
      } catch (err) {
        console.error("edit-games error:", err);
        socket.emit("error", { message: "Server error" });
      }
    });

    /**
     * kick-player — host or co-host removes a player from the lobby
     * payload: { code, hostToken, playerName }
     */
    socket.on("kick-player", async ({ code, hostToken, playerName }) => {
      try {
        const upperCode = code.toUpperCase();
        const olympic = await Olympic.findOne({ code: upperCode });
        if (!olympic)
          return socket.emit("error", { message: "Olympic not found" });
        if (olympic.hostToken !== hostToken)
          return socket.emit("error", { message: "Unauthorized" });

        // Prevent the host from kicking their own participant slot
        if (
          olympic.hostParticipates &&
          olympic.hostPlayerName &&
          olympic.hostPlayerName === playerName
        ) {
          return socket.emit("error", { message: "Cannot kick yourself" });
        }

        olympic.participants = olympic.participants.filter(
          (p) => p.name !== playerName,
        );
        await olympic.save();

        // Notify the kicked player's socket to leave
        const sockets = await io.in(upperCode).fetchSockets();
        for (const s of sockets) {
          if (s.data.name === playerName && !s.data.isHost) {
            s.emit("kicked", { playerName });
            s.leave(upperCode);
          }
        }

        const safe = olympic.toObject();
        delete safe.hostToken;
        io.to(upperCode).emit("room-update", {
          olympic: safe,
          leaderboard: computeLeaderboard(safe),
        });
      } catch (err) {
        console.error("kick-player error:", err);
        socket.emit("error", { message: "Server error" });
      }
    });
  });
}
