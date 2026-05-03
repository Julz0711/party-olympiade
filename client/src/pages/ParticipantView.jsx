import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { connectSocket, getSocket } from "../socket/socket.js";
import useOlympicStore from "../store/useOlympicStore.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import Scoreboard from "../components/Scoreboard.jsx";
import FloatingRoomNav from "../components/ui/FloatingRoomNav.jsx";
import TiebreakerModal from "../components/ui/TiebreakerModal.jsx";
import IntroOverlay from "../components/ui/IntroOverlay.jsx";
import {
  Users,
  Gamepad2,
  Crown,
  Medal,
  Swords,
  Check,
  Beer,
  Clock,
  Scale,
  X,
  BarChart2,
  ChevronRight,
  ArrowLeft,
  Play,
  Lock,
} from "lucide-react";
import CompactPlayerCard from "../components/ui/CompactPlayerCard.jsx";
import ActivityFeed from "../components/ui/ActivityFeed.jsx";

export default function ParticipantView() {
  const { code } = useParams();
  const navigate = useNavigate();
  const {
    olympic,
    leaderboard,
    participantName,
    updateFromRoomEvent,
    setConnected,
  } = useOlympicStore();
  const [joined, setJoined] = useState(!!olympic);
  const [socketError, setSocketError] = useState("");
  const [gameInProgress, setGameInProgress] = useState(false);
  const [rulesModal, setRulesModal] = useState(null); // game object or null
  const [tiebreaker, setTiebreaker] = useState(null);
  const [tiebreakerAnswers, setTiebreakerAnswers] = useState({});
  const [tiebreakerResolved, setTiebreakerResolved] = useState(null);
  const [introOlympic, setIntroOlympic] = useState(null);
  const [feedItems, setFeedItems] = useState([]);
  const [chatCooldown, setChatCooldown] = useState(0);

  useEffect(() => {
    if (!code) return;

    // If we already have an olympic in store (came from JoinPage), just listen for updates
    const socket = connectSocket();

    socket.on("room-update", (data) => {
      updateFromRoomEvent(data);
      setConnected(true);
      setJoined(true);
      if (participantName) {
        localStorage.setItem(
          "lastRoom",
          JSON.stringify({ code: code.toUpperCase(), role: "participant" }),
        );
      }
    });

    socket.on("olympic-finished", () => {
      localStorage.removeItem("lastRoom");
      navigate(`/room/${code}/winner`);
    });

    socket.on("olympic-reverted", () => {
      localStorage.removeItem("lastRoom");
      navigate(`/join/${code?.toUpperCase()}?reverted=1`);
    });

    socket.on("kicked", () => {
      localStorage.removeItem("lastRoom");
      navigate(`/join/${code?.toUpperCase()}?kicked=1`);
    });

    socket.on("error", ({ message }) => {
      if (message === "GAME_IN_PROGRESS") {
        setGameInProgress(true);
      } else {
        setSocketError(message);
      }
    });

    socket.on("tiebreaker-start", (data) => {
      setTiebreaker(data);
      setTiebreakerAnswers({});
      setTiebreakerResolved(null);
    });
    socket.on("tiebreaker-answers-update", ({ answers }) =>
      setTiebreakerAnswers(answers),
    );
    socket.on("tiebreaker-resolved", ({ winner }) =>
      setTiebreakerResolved(winner),
    );

    socket.on("intro-start", ({ olympic: o }) => setIntroOlympic(o));
    socket.on("intro-ended", () => setIntroOlympic(null));

    socket.on("chat-message", (msg) =>
      setFeedItems((prev) => [...prev, { type: "chat", ...msg }]),
    );
    socket.on("bonus-events", (events) =>
      setFeedItems((prev) => [
        ...prev,
        ...events.map((e) => ({ type: "bonus", ...e })),
      ]),
    );
    socket.on("chat-cooldown", ({ secsLeft }) => setChatCooldown(secsLeft));

    // If we don't have an olympic yet (direct URL access), try to join as spectator
    if (!olympic) {
      socket.emit("join-room", {
        code: code.toUpperCase(),
        name: participantName || "Guest",
        isHost: false,
      });
    }

    return () => {
      socket.off("room-update");
      socket.off("olympic-finished");
      socket.off("olympic-reverted");
      socket.off("kicked");
      socket.off("error");
      socket.off("tiebreaker-start");
      socket.off("tiebreaker-answers-update");
      socket.off("tiebreaker-resolved");
      socket.off("intro-start");
      socket.off("intro-ended");
      socket.off("chat-message");
      socket.off("bonus-events");
      socket.off("chat-cooldown");
    };
  }, [code]);

  if (gameInProgress) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div
          className="w-full max-w-sm rounded-2xl p-8 text-center animate-slide-up"
          style={{
            background: "rgba(10,10,28,0.97)",
            border: "1px solid rgba(250,204,21,0.3)",
            boxShadow: "0 0 60px rgba(250,204,21,0.08)",
          }}
        >
          <div className="mb-4 flex justify-center text-yellow-400/70">
            <Lock size={44} />
          </div>
          <h2 className="text-xl font-black text-white mb-2">
            Spiel läuft bereits
          </h2>
          <p className="text-sm text-white/50 mb-6">
            Dieser Raum ist nicht mehr beigetreten. Die Olympiade hat bereits
            begonnen — du warst nicht in der Lobby.
          </p>
          <button
            className="btn-secondary w-full"
            onClick={() => navigate("/")}
          >
            Zur Startseite
          </button>
        </div>
      </div>
    );
  }

  if (!olympic || !joined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-muted animate-pulse text-center">
          {socketError || `Connecting to room ${code}…`}
        </div>
        {socketError && (
          <button
            className="btn-secondary"
            onClick={() => navigate(`/join/${code}`)}
          >
            Try joining again
          </button>
        )}
      </div>
    );
  }

  // ── Lobby waiting room ──────────────────────────────────────────────────
  if (olympic.status === "lobby") {
    const playerCount = olympic.participants.length;
    const maxPlayers = olympic.maxPlayers || 20;

    const avatarGradients = [
      "from-pink-500 to-purple-600",
      "from-purple-500 to-blue-600",
      "from-cyan-500 to-blue-500",
      "from-green-400 to-teal-500",
      "from-orange-400 to-pink-500",
      "from-yellow-400 to-orange-500",
      "from-rose-400 to-pink-600",
      "from-indigo-400 to-purple-500",
    ];

    return (
      <>
        <div className="min-h-screen px-4 py-8 flex flex-col items-center">
          <div className="w-full max-w-3xl space-y-6 animate-slide-up">
            {/* ── Waiting hero card ── */}
            <div
              className="relative rounded-2xl p-6 overflow-hidden text-center"
              style={{
                background:
                  "linear-gradient(145deg, rgba(10,10,28,0.97), rgba(16,14,40,0.97))",
                border: "1px solid rgba(139,92,246,0.45)",
                boxShadow: "0 0 60px rgba(139,92,246,0.15)",
              }}
            >
              {/* Ambient decorative dots */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-sm"
                    style={{
                      left: `${8 + i * 12}%`,
                      top: `${12 + (i % 3) * 30}%`,
                      background: ["#ec4899", "#8b5cf6", "#22d3ee", "#facc15"][
                        i % 4
                      ],
                      opacity: 0.5,
                      transform: `rotate(${i * 45}deg)`,
                    }}
                  />
                ))}
              </div>

              <div className="relative">
                {/* Hourglass icon */}
                <div className="flex justify-center mb-3">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.15))",
                      border: "1px solid rgba(139,92,246,0.35)",
                    }}
                  >
                    ⏳
                  </div>
                </div>

                <h2 className="text-xl font-black text-white mb-1">
                  {olympic.name}
                </h2>
                <p className="text-white/45 text-sm mb-5 animate-pulse">
                  Warte darauf, dass der Host das Spiel startet…
                </p>

                {/* Separator */}
                <div className="h-px bg-white/[0.06] mb-4" />

                {/* Joined confirmation */}
                <div className="flex items-center justify-center gap-2">
                  <Users size={14} className="text-purple-400" />
                  <span className="font-bold text-white text-sm">
                    Du bist in der Lobby
                  </span>
                </div>
                {participantName && (
                  <p className="text-white/40 text-xs mt-1">
                    Der Host kann Spiele und Regeln ändern.
                  </p>
                )}
              </div>
            </div>

            {/* ── Player grid ── */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "rgba(10,12,30,0.9)",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Gamepad2 size={14} className="text-purple-400" />
                  <h2 className="font-black text-white text-sm uppercase tracking-wider">
                    Spieler in der Lobby
                  </h2>
                </div>
                <span className="text-sm text-muted">
                  <span className="text-white font-bold">{playerCount}</span> /{" "}
                  {maxPlayers} Spieler
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                {olympic.participants.map((p, i) => {
                  const isMe = p.name === participantName;
                  const isHost = olympic.hostParticipates
                    ? p.name === olympic.hostPlayerName
                    : i === 0;
                  return (
                    <CompactPlayerCard
                      key={p.name}
                      name={p.name}
                      avatarColor={p.avatarColor ?? null}
                      cardImage={p.cardImage ?? null}
                      playerCard={p.playerCard ?? null}
                      isMe={isMe}
                      isHost={isHost}
                      fallbackIndex={i}
                    />
                  );
                })}

                {/* Empty slots */}
                {Array.from({
                  length: Math.min(maxPlayers - playerCount, 8),
                }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    style={{
                      width: 123,
                      height: 152,
                      border: "1.5px dashed rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: 14,
                    }}
                    className="flex items-center justify-center text-white/20 text-2xl font-light"
                  >
                    +
                  </div>
                ))}
              </div>
            </div>

            {/* ── Hint card ── */}
            <div
              className="rounded-2xl px-5 py-4 flex items-start gap-4"
              style={{
                background: "rgba(10,12,30,0.9)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background: "rgba(34,211,238,0.1)",
                  border: "1px solid rgba(34,211,238,0.3)",
                }}
              >
                <span className="text-cyan-400 text-sm">ℹ</span>
              </div>
              <div>
                <h3 className="font-black text-cyan-400 text-sm mb-1">
                  Hinweis
                </h3>
                <p className="text-white/50 text-xs leading-relaxed">
                  Warte hier, bis der Host das Spiel startet.
                  <br />
                  Nur der Host kann Spiele und Regeln ändern.
                </p>
              </div>
            </div>

            {/* ── Leave button ── */}
            <button
              className="w-full py-3 rounded-full font-bold text-sm transition-all hover:scale-[1.02] active:scale-95"
              style={{
                background: "rgba(236,72,153,0.1)",
                border: "1.5px solid rgba(236,72,153,0.5)",
                color: "#f472b6",
                boxShadow: "0 0 20px rgba(236,72,153,0.12)",
              }}
              onClick={() => navigate("/")}
            >
              <span className="flex items-center justify-center gap-1.5">
                <ArrowLeft size={14} /> Lobby verlassen
              </span>
            </button>
          </div>
        </div>
        <FloatingRoomNav code={code} />
      </>
    );
  }

  function sendChat(text) {
    getSocket()?.emit("chat-message", {
      code: code.toUpperCase(),
      name: participantName || "Gast",
      text,
    });
  }

  const currentGame = olympic.games[olympic.currentGameIndex];
  const totalGames = olympic.games.length;
  const scoredCount = olympic.results.length;
  const progress =
    totalGames > 0 ? Math.round((scoredCount / totalGames) * 100) : 0;

  return (
    <>
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* ── Header bar ── */}
          <div
            className="flex items-center justify-between gap-4 rounded-2xl px-6 py-4"
            style={{
              background: "rgba(10,12,30,0.95)",
              border: "1px solid rgba(139,92,246,0.35)",
              boxShadow: "0 0 30px rgba(139,92,246,0.1)",
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Medal size={22} className="text-pink-400 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="font-black text-white text-lg truncate leading-tight">
                  {olympic.name}
                </h1>
                {participantName && (
                  <p className="text-xs text-white/40 mt-0.5">
                    Du spielst als{" "}
                    <span className="text-purple-300 font-semibold">
                      {participantName}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Progress (desktop) */}
            <div className="hidden sm:flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className="text-xs text-white/30">
                {scoredCount} / {totalGames} bewertet
              </span>
              <div className="w-32 h-1.5 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg,#8b5cf6,#ec4899)",
                    boxShadow: "0 0 8px rgba(236,72,153,0.5)",
                  }}
                />
              </div>
            </div>

            <span className="text-sm font-mono text-yellow-400 tracking-widest flex-shrink-0">
              {code?.toUpperCase()}
            </span>
          </div>

          {/* ── Progress bar (mobile) ── */}
          <div
            className="sm:hidden rounded-xl px-4 py-3"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex justify-between text-xs text-white/35 mb-2">
              <span>Fortschritt</span>
              <span>
                {scoredCount} / {totalGames}
              </span>
            </div>
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg,#8b5cf6,#ec4899)",
                }}
              />
            </div>
          </div>

          {/* ── Two-column: 2/3 game | 1/3 scoreboard ── */}
          <div className="grid lg:grid-cols-[2fr_1fr] gap-5 items-start">
            {/* ── Left 2/3: current game ── */}
            <div className="space-y-4">
              {currentGame ? (
                <div
                  className="rounded-2xl p-7"
                  style={{
                    background: "rgba(10,12,30,0.97)",
                    border: "1px solid rgba(139,92,246,0.4)",
                    boxShadow: "0 0 50px rgba(139,92,246,0.12)",
                  }}
                >
                  {/* Game identity */}
                  <div className="flex items-start gap-5 mb-6">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl flex-shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.12))",
                        border: "1px solid rgba(139,92,246,0.32)",
                      }}
                    >
                      {currentGame.icon}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1.5">
                        Spiel {olympic.currentGameIndex + 1} von {totalGames}
                      </p>
                      <h2 className="text-3xl font-black text-white leading-tight mb-2">
                        {currentGame.title}
                      </h2>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="inline-block text-xs font-black uppercase px-3 py-1 rounded-full"
                          style={{
                            background:
                              currentGame.mode === "team"
                                ? "rgba(139,92,246,0.2)"
                                : "rgba(236,72,153,0.2)",
                            color:
                              currentGame.mode === "team"
                                ? "#a78bfa"
                                : "#f472b6",
                            border: `1px solid ${currentGame.mode === "team" ? "rgba(139,92,246,0.4)" : "rgba(236,72,153,0.4)"}`,
                          }}
                        >
                          {currentGame.mode === "team" ? (
                            <div className="flex flex-row items-center gap-1 justify-center">
                              <Users size={11} /> Teams
                            </div>
                          ) : (
                            <div className="flex flex-row items-center gap-1 justify-center">
                              <Swords size={11} /> FFA
                            </div>
                          )}
                        </span>
                        {olympic.results.find(
                          (r) => String(r.gameId) === String(currentGame._id),
                        ) && (
                          <span className="text-green-400 text-sm font-bold flex items-center gap-1">
                            <Check size={13} /> Bewertet
                          </span>
                        )}
                        <span
                          className="inline-flex items-center gap-1 text-xs font-black uppercase px-3 py-1 rounded-full"
                          style={{
                            background: "rgba(250,204,21,0.12)",
                            border: "1px solid rgba(250,204,21,0.3)",
                            color: "#facc15",
                          }}
                        >
                          <ChevronRight size={12} /> Live
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rules */}
                  {currentGame.rules && (
                    <div
                      className="rounded-xl p-5 mb-4"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30 mb-2">
                        Regeln
                      </p>
                      <p className="text-sm text-white/85 whitespace-pre-line leading-relaxed">
                        {currentGame.rules}
                      </p>
                    </div>
                  )}

                  {/* Drinking rules */}
                  {currentGame.addons?.drinkingGame?.enabled && (
                    <div
                      className="rounded-xl p-5 mb-4"
                      style={{
                        background: "rgba(251,146,60,0.06)",
                        border: "1px solid rgba(251,146,60,0.25)",
                      }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-400/70 mb-2 flex items-center gap-1">
                        <Beer size={10} /> Trinkregeln
                      </p>
                      <p className="text-sm text-white/85 whitespace-pre-line leading-relaxed">
                        {currentGame.addons.drinkingGame.rules ||
                          "Aktiviert — frag den Host nach den Regeln."}
                      </p>
                    </div>
                  )}

                  {/* Equipment / handicap / time limit */}
                  {(currentGame.addons?.equipment ||
                    currentGame.addons?.handicap ||
                    currentGame.addons?.timeLimit > 0) && (
                    <div className="flex flex-wrap gap-3 mt-2">
                      {currentGame.addons?.timeLimit > 0 && (
                        <span className="text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-lg border border-white/8 flex items-center gap-1">
                          <Clock size={11} /> {currentGame.addons.timeLimit} Min
                        </span>
                      )}
                      {currentGame.addons?.equipment && (
                        <span className="text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-lg border border-white/8">
                          {currentGame.addons.equipment}
                        </span>
                      )}
                      {currentGame.addons?.handicap && (
                        <span className="text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-lg border border-white/8 flex items-center gap-1">
                          <Scale size={11} /> {currentGame.addons.handicap}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="rounded-2xl p-10 text-center"
                  style={{
                    background: "rgba(10,12,30,0.9)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <p className="text-white/30">Kein Spiel ausgewählt</p>
                </div>
              )}

              {/* ── Activity feed (chat + bonus events) ── */}
              <ActivityFeed
                items={feedItems}
                onSend={sendChat}
                myName={participantName}
                participants={olympic.participants}
                cooldownSecs={chatCooldown}
              />
            </div>

            {/* ── Right 1/3: leaderboard + spielplan (sticky) ── */}
            <div className="lg:sticky lg:top-6 space-y-4">
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "rgba(10,12,30,0.95)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30 mb-4 flex items-center gap-1.5">
                  <BarChart2 size={11} /> Live Tabelle
                </p>
                <Scoreboard
                  leaderboard={leaderboard}
                  participants={olympic.participants}
                  myName={participantName}
                />
              </div>

              {/* Spielplan */}
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "rgba(10,12,30,0.9)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">
                    Spielplan
                  </p>
                  <span className="text-[10px] text-white/25">
                    {olympic.games.length} Spiele
                  </span>
                </div>
                <div className="space-y-1.5">
                  {olympic.games.map((g, i) => {
                    const scored = !!olympic.results.find(
                      (r) => String(r.gameId) === String(g._id),
                    );
                    const isCur = i === olympic.currentGameIndex;
                    const hidden = olympic.hideGamePlan && !isCur && !scored;
                    return (
                      <div
                        key={String(g._id)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                        style={
                          isCur
                            ? {
                                background: "rgba(139,92,246,0.15)",
                                border: "1px solid rgba(139,92,246,0.35)",
                              }
                            : {
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid transparent",
                              }
                        }
                      >
                        <span
                          className="text-xs font-black w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isCur
                              ? "rgba(139,92,246,0.4)"
                              : "rgba(255,255,255,0.05)",
                            color: isCur ? "#c4b5fd" : "#555",
                          }}
                        >
                          {i + 1}
                        </span>
                        {/* Icon — always visible */}
                        <span className="text-sm flex-shrink-0">
                          {hidden ? (
                            <Gamepad2 size={14} className="text-white/30" />
                          ) : (
                            g.icon
                          )}
                        </span>
                        {/* Title — blurred when hidden */}
                        <span
                          className={`flex-1 text-xs font-semibold truncate select-none ${isCur ? "text-white" : "text-white/45"}`}
                          style={
                            hidden
                              ? { filter: "blur(5px)", pointerEvents: "none" }
                              : undefined
                          }
                        >
                          {hidden ? "???????????" : g.title}
                        </span>
                        {scored && !hidden && (
                          <span className="flex-shrink-0">
                            <Check size={13} className="text-green-400" />
                          </span>
                        )}
                        {isCur && (
                          <span className="text-yellow-400 flex-shrink-0">
                            <Play size={9} fill="currentColor" />
                          </span>
                        )}
                        {/* Rules button — visible when not hidden */}
                        {!hidden &&
                          (g.rules ||
                            g.addons?.drinkingGame?.enabled ||
                            g.addons?.equipment ||
                            g.addons?.handicap) && (
                            <button
                              className="text-white/25 hover:text-purple-400 text-xs flex-shrink-0 transition-colors leading-none px-1"
                              onClick={() => setRulesModal(g)}
                              title="Regeln anzeigen"
                            >
                              ℹ
                            </button>
                          )}
                      </div>
                    );
                  })}
                </div>
                {olympic.hideGamePlan && (
                  <p className="text-[10px] text-white/20 text-center mt-3">
                    <span className="flex items-center justify-center gap-1">
                      <Lock size={10} /> Spielplan ausgeblendet
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <FloatingRoomNav code={code} />

      {rulesModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setRulesModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 space-y-4"
            style={{
              background: "rgba(12,10,30,0.98)",
              border: "1px solid rgba(139,92,246,0.3)",
              boxShadow: "0 0 40px rgba(139,92,246,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <span className="text-3xl">{rulesModal.icon}</span>
              <div className="flex-1 min-w-0">
                <h2 className="font-black text-white text-lg leading-tight truncate">
                  {rulesModal.title}
                </h2>
                <span
                  className="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded mt-0.5"
                  style={{
                    background:
                      rulesModal.mode === "team"
                        ? "rgba(139,92,246,0.2)"
                        : "rgba(236,72,153,0.2)",
                    color: rulesModal.mode === "team" ? "#a78bfa" : "#f472b6",
                  }}
                >
                  {rulesModal.mode === "team" ? (
                    <>
                      <Users size={11} /> Teams
                    </>
                  ) : (
                    <>
                      <Swords size={11} /> FFA
                    </>
                  )}
                </span>
              </div>
              <button
                className="text-white/40 hover:text-white flex-shrink-0"
                onClick={() => setRulesModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Rules text */}
            {rulesModal.rules && (
              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30 mb-2">
                  Regeln
                </p>
                <p className="text-sm text-white/85 whitespace-pre-line leading-relaxed">
                  {rulesModal.rules}
                </p>
              </div>
            )}

            {/* Drinking rules */}
            {rulesModal.addons?.drinkingGame?.enabled && (
              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(251,146,60,0.06)",
                  border: "1px solid rgba(251,146,60,0.25)",
                }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-400/70 mb-2 flex items-center gap-1">
                  <Beer size={10} /> Trinkregeln
                </p>
                <p className="text-sm text-white/85 whitespace-pre-line leading-relaxed">
                  {rulesModal.addons.drinkingGame.rules ||
                    "Aktiviert — frag den Host nach den Regeln."}
                </p>
              </div>
            )}

            {/* Equipment / handicap / time */}
            {(rulesModal.addons?.equipment ||
              rulesModal.addons?.handicap ||
              rulesModal.addons?.timeLimit > 0) && (
              <div className="flex flex-wrap gap-2">
                {rulesModal.addons?.timeLimit > 0 && (
                  <span className="text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-lg border border-white/8 flex items-center gap-1">
                    <Clock size={11} /> {rulesModal.addons.timeLimit} Min
                  </span>
                )}
                {rulesModal.addons?.equipment && (
                  <span className="text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-lg border border-white/8">
                    {rulesModal.addons.equipment}
                  </span>
                )}
                {rulesModal.addons?.handicap && (
                  <span className="text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-lg border border-white/8 flex items-center gap-1">
                    <Scale size={11} /> {rulesModal.addons.handicap}
                  </span>
                )}
              </div>
            )}

            <button
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white/50 hover:text-white transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              onClick={() => setRulesModal(null)}
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      {tiebreaker && (
        <TiebreakerModal
          question={tiebreaker.question}
          unit={tiebreaker.unit}
          tiedPlayers={tiebreaker.tiedPlayers}
          answers={tiebreakerAnswers}
          isHost={false}
          isParticipant={tiebreaker.tiedPlayers.includes(participantName)}
          onAnswer={(answer) =>
            getSocket().emit("tiebreaker-answer", {
              code: code.toUpperCase(),
              name: participantName,
              answer,
            })
          }
          onClose={() => setTiebreaker(null)}
          resolved={!!tiebreakerResolved}
          winner={tiebreakerResolved}
        />
      )}
      {introOlympic && (
        <IntroOverlay
          olympic={introOlympic}
          isHost={false}
          hostToken={null}
          onClose={() => setIntroOlympic(null)}
        />
      )}
    </>
  );
}
