import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { connectSocket, getSocket } from "../socket/socket.js";
import useOlympicStore from "../store/useOlympicStore.js";
import api from "../api/client.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import Select from "../components/ui/Select.jsx";
import ConfirmModal from "../components/ui/ConfirmModal.jsx";
import GameCard from "../components/GameCard.jsx";
import Scoreboard from "../components/Scoreboard.jsx";
import ScoreEntry from "../components/ScoreEntry.jsx";
import FloatingRoomNav from "../components/ui/FloatingRoomNav.jsx";
import TiebreakerModal from "../components/ui/TiebreakerModal.jsx";
import IntroOverlay from "../components/ui/IntroOverlay.jsx";
import CompactPlayerCard from "../components/ui/CompactPlayerCard.jsx";
import ActivityFeed from "../components/ui/ActivityFeed.jsx";
import { useAuthStore } from "../store/useAuthStore.js";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Check,
  X,
  ChevronRight,
  Users,
  Crown,
  Gamepad2,
  Medal,
  Trophy,
  Rocket,
  ClipboardList,
  Settings,
  Swords,
  Beer,
  Clock,
  Scale,
  Wrench,
  Save,
  BarChart2,
  FolderOpen,
  Search,
  Plus,
  Pencil,
  Undo2,
  Target,
  Flame,
  Star,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RotateCcw,
  Lock,
} from "lucide-react";

function ManageGameRow({
  dndId,
  game,
  index,
  total,
  isCur,
  scored,
  onMoveUp,
  onMoveDown,
  onRemove,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: dndId });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        background: isCur ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${isCur ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.07)"}`,
      }}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing touch-none"
        tabIndex={-1}
      >
        <GripVertical size={16} />
      </button>
      <span className="text-xl w-8 text-center flex-shrink-0">{game.icon}</span>
      <span
        className={`flex-1 text-sm truncate ${isCur ? "text-white font-bold" : "text-white/70"}`}
      >
        {game.title}
      </span>
      {isCur && (
        <ChevronRight size={14} className="text-yellow-400 flex-shrink-0" />
      )}
      {scored && <Check size={14} className="text-green-400 flex-shrink-0" />}
      <button
        className="text-white/25 hover:text-white/80 transition-colors disabled:opacity-20 flex-shrink-0"
        disabled={index === 0}
        onClick={onMoveUp}
      >
        <ChevronUp size={14} />
      </button>
      <button
        className="text-white/25 hover:text-white/80 transition-colors disabled:opacity-20 flex-shrink-0"
        disabled={index === total - 1}
        onClick={onMoveDown}
      >
        <ChevronDown size={14} />
      </button>
      <button
        className="text-pink-400/50 hover:text-pink-400 transition-colors disabled:opacity-20 flex-shrink-0"
        disabled={total <= 1}
        onClick={onRemove}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function HostRoomPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { olympic, leaderboard, updateFromRoomEvent, setConnected } =
    useOlympicStore();
  const { user: hostUser } = useAuthStore();

  const [tab, setTab] = useState("game"); // 'game' | 'score' | 'board' | 'players' | 'manage'
  const [scoreGame, setScoreGame] = useState(null); // game being scored
  const [socketError, setSocketError] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // { title, message, confirmLabel, danger, onConfirm }
  const [managingGames, setManagingGames] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [managingSettings, setManagingSettings] = useState(null); // local copy of settings while modal is open
  const [addGameForm, setAddGameForm] = useState({
    title: "",
    icon: "🎮",
    mode: "ffa",
  });
  const [addGameTab, setAddGameTab] = useState("create"); // "create" | "library"
  const [libraryPresets, setLibraryPresets] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [tiebreaker, setTiebreaker] = useState(null);
  const [tiebreakerAnswers, setTiebreakerAnswers] = useState({});
  const [tiebreakerResolved, setTiebreakerResolved] = useState(null);
  const [introOlympic, setIntroOlympic] = useState(null);
  const [feedItems, setFeedItems] = useState([]);
  const [chatCooldown, setChatCooldown] = useState(0);

  const hostToken = localStorage.getItem(`hostToken_${code?.toUpperCase()}`);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Connect & join room
  useEffect(() => {
    if (!code) return;
    if (!hostToken) {
      navigate("/");
      return;
    }

    localStorage.setItem(
      "lastRoom",
      JSON.stringify({ code: code.toUpperCase(), role: "host" }),
    );

    const socket = connectSocket();

    socket.on("room-update", (data) => {
      updateFromRoomEvent(data);
      setConnected(true);
    });

    socket.on("olympic-finished", () => {
      localStorage.removeItem("lastRoom");
      navigate(`/room/${code}/winner`);
    });

    socket.on("olympic-reverted", () => {
      localStorage.removeItem("lastRoom");
      navigate(`/edit/${code?.toUpperCase()}`);
    });

    socket.on("error", ({ message }) => setSocketError(message));

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

    socket.emit("join-room", {
      code: code.toUpperCase(),
      name: "Host",
      isHost: true,
      hostToken,
      userId: hostUser?.id ?? null,
    });

    return () => {
      socket.off("room-update");
      socket.off("olympic-finished");
      socket.off("olympic-reverted");
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

  useEffect(() => {
    document.title = olympic?.name
      ? `${olympic.name} (Host) | Party Olympiade`
      : "Host | Party Olympiade";
  }, [olympic?.name]);

  // Fetch library presets when library tab in manage modal is opened
  useEffect(() => {
    if (addGameTab !== "library" || libraryPresets.length > 0) return;
    setLibraryLoading(true);
    api
      .get("/game-presets")
      .then(({ data }) => setLibraryPresets(data))
      .catch(() => {})
      .finally(() => setLibraryLoading(false));
  }, [addGameTab]); // eslint-disable-line

  // Sync score panel with current game when navigating
  useEffect(() => {
    if (!olympic || olympic.status !== "active") return;
    const game = olympic.games?.[olympic.currentGameIndex];
    if (game) setScoreGame(game);
  }, [olympic?.currentGameIndex, olympic?.status]); // eslint-disable-line

  function kickPlayer(playerName) {
    getSocket().emit("kick-player", {
      code: code.toUpperCase(),
      hostToken,
      playerName,
    });
  }

  function confirmKick(playerName) {
    setConfirmModal({
      title: "Spieler kicken?",
      message: `${playerName} wird aus der Lobby entfernt.`,
      confirmLabel: (
        <span className="flex items-center justify-center gap-1.5">
          <X size={13} /> Kicken
        </span>
      ),
      danger: true,
      onConfirm: () => {
        setConfirmModal(null);
        kickPlayer(playerName);
      },
    });
  }

  function navigate_game(direction) {
    const socket = getSocket();
    socket.emit("navigate", { code: code.toUpperCase(), direction, hostToken });
  }

  function startOlympic() {
    setStarting(true);
    const socket = getSocket();
    socket.emit("start-olympic", { code: code.toUpperCase(), hostToken });
  }

  function revertToDraft() {
    setConfirmModal({
      title: "Revert to Draft?",
      message:
        "All players will be kicked from the lobby and the Olympic will return to draft status.",
      confirmLabel: (
        <span className="flex items-center justify-center gap-1.5">
          <RotateCcw size={13} /> Zurücksetzen
        </span>
      ),
      danger: false,
      onConfirm: () => {
        setConfirmModal(null);
        setReverting(true);
        getSocket().emit("revert-to-draft", {
          code: code.toUpperCase(),
          hostToken,
        });
      },
    });
  }

  function submitScore(result) {
    const socket = getSocket();
    socket.emit("submit-score", {
      code: code.toUpperCase(),
      result,
      hostToken,
    });
    setScoreGame(null);
    setTab("board");
  }

  function finishOlympic() {
    setConfirmModal({
      title: "End the Olympic?",
      message: "This will reveal the final winner. This cannot be undone.",
      confirmLabel: "End Event",
      danger: true,
      onConfirm: () => {
        setConfirmModal(null);
        setFinishing(true);
        getSocket().emit("finish-olympic", {
          code: code.toUpperCase(),
          hostToken,
        });
      },
    });
  }

  if (!olympic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted animate-pulse">
          Connecting to room {code}…
        </div>
      </div>
    );
  }

  const currentGame = olympic.games[olympic.currentGameIndex];
  const totalGames = olympic.games.length;
  const scoredCount = olympic.results.length;
  const progress =
    totalGames > 0 ? Math.round((scoredCount / totalGames) * 100) : 0;
  const scoringEnabled = olympic.scoringEnabled !== false;

  const existingResult = scoreGame
    ? olympic.results.find((r) => String(r.gameId) === String(scoreGame._id))
    : null;

  // ── Lobby waiting room ──────────────────────────────────────────────────
  if (olympic.status === "lobby") {
    const inviteLink = `${window.location.origin}/join/${code?.toUpperCase()}`;
    const playerCount = olympic.participants.length;
    const maxPlayers = olympic.maxPlayers || 20;
    const canStart = playerCount >= 2;

    // Slot 0 is always reserved for the host
    const hostName = olympic.hostParticipates ? olympic.hostPlayerName : "Host";

    // Avatar colors per index
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
        <div className="min-h-screen px-4 py-10">
          <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
            {/* ── Room code hero card ── */}
            <div
              className="relative rounded-2xl p-6 overflow-hidden"
              style={{
                background:
                  "linear-gradient(145deg, rgba(10,10,28,0.97), rgba(16,14,40,0.97))",
                border: "1px solid rgba(139,92,246,0.45)",
                boxShadow:
                  "0 0 60px rgba(139,92,246,0.18), 0 0 0 1px rgba(255,255,255,0.04)",
              }}
            >
              {/* Confetti dots decorative */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-sm"
                    style={{
                      left: `${10 + i * 9}%`,
                      top: `${15 + (i % 3) * 25}%`,
                      background: [
                        "#ec4899",
                        "#8b5cf6",
                        "#22d3ee",
                        "#facc15",
                        "#f472b6",
                      ][i % 5],
                      opacity: 0.6,
                      transform: `rotate(${i * 37}deg)`,
                    }}
                  />
                ))}
              </div>

              <div className="relative text-center">
                {/* People icon */}
                <div className="flex justify-center mb-2">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.15))",
                      border: "1px solid rgba(139,92,246,0.35)",
                    }}
                  >
                    <Users size={22} className="text-purple-400" />
                  </div>
                </div>

                <h1
                  className="text-2xl font-black mb-1"
                  style={{
                    background: "linear-gradient(90deg, #ec4899, #a78bfa)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Lobby bereit
                </h1>
                <p className="text-white/55 text-sm mb-4">
                  Teile den Code mit deinen Freunden, damit sie beitreten
                  können.
                </p>

                {/* Room code */}
                <div
                  className="text-7xl font-black tracking-[0.15em] mb-5 select-all"
                  style={{
                    background: "linear-gradient(90deg, #facc15, #f59e0b)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: "none",
                    filter: "drop-shadow(0 0 20px rgba(250,204,21,0.4))",
                  }}
                >
                  {code?.toUpperCase()}
                </div>

                {/* Copy button */}
                <button
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.14)",
                  }}
                  onClick={() => navigator.clipboard.writeText(inviteLink)}
                >
                  <ClipboardList size={15} /> Einladungslink kopieren
                </button>
              </div>
            </div>

            {/* ── Players in lobby ── */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "rgba(10,12,30,0.9)",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
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

              {/* Avatar grid — slot 0 always reserved for host */}
              <div className="flex flex-wrap gap-3">
                {/* Host slot (always first, always shown) */}
                <CompactPlayerCard
                  name={hostName || "Host"}
                  avatarColor={hostUser?.avatarColor ?? null}
                  cardImage={hostUser?.cardImage ?? null}
                  playerCard={hostUser?.playerCard ?? null}
                  isHost={true}
                  fallbackIndex={0}
                />

                {/* Participant slots — exclude host when hostParticipates (already shown above) */}
                {olympic.participants
                  .filter(
                    (p) =>
                      !(
                        olympic.hostParticipates &&
                        p.name === olympic.hostPlayerName
                      ),
                  )
                  .map((p, i) => (
                    <div key={p.name} className="relative group">
                      <CompactPlayerCard
                        name={p.name}
                        avatarColor={p.avatarColor ?? null}
                        cardImage={p.cardImage ?? null}
                        playerCard={p.playerCard ?? null}
                        fallbackIndex={i + 1}
                      />
                      {/* Kick button on hover */}
                      <button
                        className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] font-black items-center justify-center hidden group-hover:flex shadow-lg z-30"
                        onClick={() => confirmKick(p.name)}
                        title={`Kick ${p.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}

                {/* Empty slots */}
                {Array.from({
                  length: Math.min(
                    maxPlayers -
                      playerCount -
                      (olympic.hostParticipates ? 0 : 1),
                    12,
                  ),
                }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="flex items-center justify-center text-white/20 text-2xl font-light"
                    style={{
                      width: 123,
                      height: 152,
                      border: "1.5px dashed rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: 14,
                    }}
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
                  Hinweis für Spieler
                </h3>
                <p className="text-white/50 text-xs leading-relaxed">
                  Warte, bis der Host das Spiel startet.
                  <br />
                  Nur der Host kann Spiele und Regeln ändern.
                </p>
              </div>
            </div>

            {socketError && (
              <div className="text-pink-400 text-sm bg-pink-500/10 border border-pink-500/20 rounded-xl px-4 py-3">
                ⚠ {socketError}
              </div>
            )}

            {/* ── Start button ── */}
            <button
              className="w-full py-4 rounded-2xl font-black text-base uppercase tracking-widest transition-all duration-200"
              style={
                canStart && !starting
                  ? {
                      background: "linear-gradient(90deg, #7c3aed, #ec4899)",
                      color: "#fff",
                      boxShadow: "0 0 40px rgba(236,72,153,0.4)",
                    }
                  : {
                      background:
                        "linear-gradient(90deg, rgba(124,58,237,0.35), rgba(236,72,153,0.25))",
                      color: "rgba(255,255,255,0.35)",
                      cursor: "not-allowed",
                    }
              }
              onClick={startOlympic}
              disabled={!canStart || starting}
            >
              {starting ? (
                "Startet…"
              ) : !canStart ? (
                <span className="flex items-center justify-center gap-2">
                  <Users size={16} /> Mindestens 2 Spieler benötigt, um zu
                  starten
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Rocket size={16} /> Olympiade starten mit {playerCount}{" "}
                  Spieler{playerCount !== 1 ? "n" : ""}
                </span>
              )}
            </button>

            {/* Back to draft */}
            <button
              className="w-full py-2 text-sm font-semibold transition-colors"
              style={{ color: "#facc15" }}
              onClick={revertToDraft}
              disabled={reverting}
            >
              {reverting ? (
                "Wird zurückgesetzt…"
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <ArrowLeft size={14} /> Zurück zum Entwurf
                </span>
              )}
            </button>
          </div>
        </div>
        {confirmModal && (
          <ConfirmModal
            title={confirmModal.title}
            message={confirmModal.message}
            confirmLabel={confirmModal.confirmLabel}
            danger={confirmModal.danger}
            onConfirm={confirmModal.onConfirm}
            onCancel={() => setConfirmModal(null)}
          />
        )}
        {introOlympic && (
          <IntroOverlay
            olympic={introOlympic}
            isHost={true}
            hostToken={hostToken}
            onClose={() => setIntroOlympic(null)}
          />
        )}
        <FloatingRoomNav code={code} />
      </>
    );
  }

  // ── Active game view ────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-screen px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* ── Header bar ── */}
          <div
            className="flex items-center justify-between gap-4 rounded-2xl px-6 py-4"
            style={{
              background: "rgba(10,12,30,0.95)",
              border: "1px solid rgba(139,92,246,0.38)",
              boxShadow: "0 0 30px rgba(139,92,246,0.1)",
            }}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Medal size={20} className="text-pink-400" />
                <h1 className="font-black text-white text-xl truncate">
                  {olympic.name}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-yellow-400 tracking-widest">
                  {code?.toUpperCase()}
                </span>
                <button
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `${window.location.origin}/join/${code?.toUpperCase()}`,
                    )
                  }
                >
                  <span className="flex items-center gap-1">
                    <ClipboardList size={12} /> Link kopieren
                  </span>
                </button>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="hidden md:flex flex-col items-center gap-1.5 flex-shrink-0">
              <span className="text-xs text-white/30">
                {scoredCount} / {totalGames} bewertet
              </span>
              <div className="w-36 h-1.5 bg-white/8 rounded-full overflow-hidden">
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

            <div className="flex gap-2.5 flex-shrink-0">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: "rgba(139,92,246,0.12)",
                  border: "1px solid rgba(139,92,246,0.42)",
                  color: "#a78bfa",
                  boxShadow: "0 0 12px rgba(139,92,246,0.12)",
                }}
                onClick={() => {
                  setManagingGames([...olympic.games]);
                  setManagingSettings({
                    name: olympic.name,
                    maxPlayers: olympic.maxPlayers,
                    scoringMode: olympic.scoringMode || "linear",
                    tieRule: olympic.tieRule || "tiebreaker",
                    extraRules: { ...olympic.extraRules },
                    hostParticipates: !!olympic.hostParticipates,
                    hostGhostMode: !!olympic.hostGhostMode,
                    hostPlayerName: olympic.hostPlayerName || "",
                    hideGamePlan: !!olympic.hideGamePlan,
                  });
                  setAddGameForm({ title: "", icon: "🎮", mode: "ffa" });
                  setShowManageModal(true);
                }}
              >
                <Settings size={14} /> Verwalten
              </button>
              <button
                className="btn-primary text-sm !py-2 !px-4 flex items-center gap-2"
                onClick={finishOlympic}
                disabled={finishing}
              >
                {finishing ? (
                  "…"
                ) : (
                  <>
                    <Trophy size={14} /> Beenden
                  </>
                )}
              </button>
            </div>
          </div>

          {socketError && (
            <div className="text-pink-400 text-sm bg-pink-500/10 border border-pink-500/20 rounded-xl px-4 py-3">
              ⚠ {socketError}
            </div>
          )}

          {/* ── Two-column main layout ── */}
          <div className="grid lg:grid-cols-[1fr_380px] gap-5 items-start">
            {/* ── Left column: current game + games list ── */}
            <div className="space-y-4">
              {currentGame ? (
                <div
                  className="rounded-2xl p-6"
                  style={{
                    background: "rgba(10,12,30,0.97)",
                    border: "1px solid rgba(139,92,246,0.4)",
                    boxShadow: "0 0 50px rgba(139,92,246,0.12)",
                  }}
                >
                  {/* Game header */}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.12))",
                          border: "1px solid rgba(139,92,246,0.32)",
                        }}
                      >
                        {currentGame.icon}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">
                          Spiel {olympic.currentGameIndex + 1} von {totalGames}
                        </p>
                        <h2 className="text-2xl font-black text-white leading-tight">
                          {currentGame.title}
                        </h2>
                        <span
                          className="inline-block text-xs font-black uppercase px-2.5 py-0.5 rounded-full mt-1.5"
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
                            <div className="flex items-center gap-2">
                              <Users size={11} /> Teams
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Swords size={11} /> FFA
                            </div>
                          )}
                        </span>
                      </div>
                    </div>
                    {olympic.results.find(
                      (r) => String(r.gameId) === String(currentGame._id),
                    ) && (
                      <Check
                        size={22}
                        className="text-green-400 flex-shrink-0"
                      />
                    )}
                  </div>

                  {currentGame.rules && (
                    <div
                      className="rounded-xl p-4 mb-4"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30 mb-1.5">
                        Regeln
                      </p>
                      <p className="text-sm text-white/80 whitespace-pre-line leading-relaxed">
                        {currentGame.rules}
                      </p>
                    </div>
                  )}

                  {currentGame.addons?.drinkingGame?.enabled &&
                    currentGame.addons.drinkingGame.rules && (
                      <div
                        className="rounded-xl p-4 mb-4"
                        style={{
                          background: "rgba(251,146,60,0.06)",
                          border: "1px solid rgba(251,146,60,0.25)",
                        }}
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-400/70 mb-1.5 flex items-center gap-1">
                          <Beer size={10} /> Trinkregeln
                        </p>
                        <p className="text-sm text-white/80 whitespace-pre-line leading-relaxed">
                          {currentGame.addons.drinkingGame.rules}
                        </p>
                      </div>
                    )}

                  {/* Navigation */}
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      className="btn-secondary flex-1 flex items-center justify-center gap-1.5"
                      onClick={() => navigate_game("prev")}
                      disabled={olympic.currentGameIndex === 0}
                    >
                      <ArrowLeft size={14} /> Zurück
                    </button>
                    <span className="text-white/25 text-sm font-mono whitespace-nowrap">
                      {olympic.currentGameIndex + 1} / {totalGames}
                    </span>
                    <button
                      className="btn-primary flex-1 flex items-center justify-center gap-1.5"
                      onClick={() => navigate_game("next")}
                      disabled={olympic.currentGameIndex >= totalGames - 1}
                    >
                      Weiter <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="glass rounded-2xl p-8 text-center text-muted">
                  Kein Spiel ausgewählt
                </div>
              )}

              {/* Games timeline */}
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "rgba(10,12,30,0.9)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30 mb-4">
                  Spielplan
                </h3>
                <div className="space-y-1.5">
                  {olympic.games.map((g, i) => {
                    const scored = !!olympic.results.find(
                      (r) => String(r.gameId) === String(g._id),
                    );
                    const isCur = i === olympic.currentGameIndex;
                    return (
                      <button
                        key={String(g._id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
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
                        onClick={() => {
                          if (scoringEnabled) setScoreGame(g);
                        }}
                      >
                        <span
                          className="text-xs font-black w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isCur
                              ? "rgba(139,92,246,0.4)"
                              : "rgba(255,255,255,0.05)",
                            color: isCur ? "#c4b5fd" : "#555",
                          }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-base flex-shrink-0">
                          {g.icon}
                        </span>
                        <span
                          className={`flex-1 text-sm font-semibold truncate ${isCur ? "text-white" : "text-white/40"}`}
                        >
                          {g.title}
                        </span>
                        {scored && (
                          <Check
                            size={13}
                            className="text-green-400 flex-shrink-0"
                          />
                        )}
                        {isCur && (
                          <span className="text-yellow-400 text-[10px] font-black uppercase flex-shrink-0 flex items-center gap-0.5">
                            <ChevronRight size={11} /> Aktiv
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Right column: score entry + leaderboard ── */}
            <div className="space-y-4 lg:sticky lg:top-6">
              {scoringEnabled ? (
                <>
                  {/* Score entry */}
                  <div
                    className="rounded-2xl p-5"
                    style={{
                      background: "rgba(10,12,30,0.97)",
                      border: "1px solid rgba(236,72,153,0.35)",
                      boxShadow: "0 0 30px rgba(236,72,153,0.08)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <p
                        className="text-[10px] font-black uppercase tracking-[0.2em]"
                        style={{ color: "#ec4899" }}
                      >
                        <span className="flex items-center gap-1.5">
                          <Pencil size={11} /> Ergebnis eintragen
                        </span>
                      </p>
                      {scoreGame && scoreGame._id !== currentGame?._id && (
                        <button
                          className="text-xs text-white/30 hover:text-white/60 transition-colors"
                          onClick={() => setScoreGame(currentGame)}
                        >
                          <span className="flex items-center gap-1">
                            <ArrowRight size={11} /> Aktuelles Spiel
                          </span>
                        </button>
                      )}
                    </div>

                    <div className="mb-4">
                      <Select
                        value={scoreGame?._id ? String(scoreGame._id) : ""}
                        onChange={(val) => {
                          const g = olympic.games.find(
                            (gm) => String(gm._id) === val,
                          );
                          setScoreGame(g || null);
                        }}
                        options={olympic.games.map((g) => ({
                          value: String(g._id),
                          label: `${g.icon} ${g.title}${olympic.results.find((r) => String(r.gameId) === String(g._id)) ? " ✓" : ""}`,
                        }))}
                      />
                    </div>

                    {scoreGame ? (
                      <ScoreEntry
                        game={scoreGame}
                        participants={olympic.participants}
                        existingResult={olympic.results.find(
                          (r) => String(r.gameId) === String(scoreGame._id),
                        )}
                        onSubmit={submitScore}
                        tieRule={olympic.tieRule}
                      />
                    ) : (
                      <p className="text-white/25 text-sm text-center py-4">
                        <span className="flex items-center justify-center gap-1.5">
                          Spiel auswählen <ArrowUp size={11} />
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Live leaderboard */}
                  <div
                    className="rounded-2xl p-5"
                    style={{
                      background: "rgba(10,12,30,0.9)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30 mb-4 flex items-center gap-1.5">
                      <BarChart2 size={11} /> Live Tabelle
                    </p>
                    <Scoreboard
                      leaderboard={leaderboard}
                      participants={olympic.participants}
                      myName={
                        olympic.hostParticipates
                          ? olympic.hostPlayerName || null
                          : null
                      }
                    />
                  </div>
                </>
              ) : (
                <div
                  className="rounded-2xl p-8 text-center"
                  style={{
                    background: "rgba(10,12,30,0.9)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <p className="text-white/30 text-sm">Wertung deaktiviert</p>
                </div>
              )}
            </div>
          </div>{/* end two-column grid */}

          {/* ── Activity feed ── */}
          <ActivityFeed
            items={feedItems}
            onSend={(text) => {
              getSocket()?.emit("chat-message", {
                code: code.toUpperCase(),
                name: olympic.hostParticipates && olympic.hostPlayerName
                  ? olympic.hostPlayerName
                  : "Host",
                text,
              });
            }}
            myName={olympic.hostParticipates ? olympic.hostPlayerName : "Host"}
            participants={olympic.participants}
            cooldownSecs={chatCooldown}
          />
        </div>
      </div>

      {/* ── Manage Modal ── */}
      {showManageModal && managingSettings && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{
            backdropFilter: "blur(6px)",
            background: "rgba(0,0,0,0.65)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowManageModal(false);
          }}
        >
          <div
            className="relative w-full max-w-5xl animate-slide-up"
            style={{
              background:
                "linear-gradient(145deg, rgba(12,15,35,0.99), rgba(18,22,50,0.99))",
              border: "1px solid rgba(139,92,246,0.45)",
              boxShadow:
                "0 0 80px rgba(139,92,246,0.22), 0 40px 80px rgba(0,0,0,0.6)",
              borderRadius: "24px",
              maxHeight: "92vh",
              overflowY: "auto",
            }}
          >
            {/* Modal header */}
            <div
              className="sticky top-0 flex items-center justify-between px-6 py-4 z-10"
              style={{
                background: "rgba(12,15,35,0.98)",
                borderBottom: "1px solid rgba(139,92,246,0.2)",
                borderRadius: "24px 24px 0 0",
              }}
            >
              <h2 className="font-black text-white text-lg flex items-center gap-2">
                <Settings size={18} /> Olympiade verwalten
              </h2>
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                onClick={() => setShowManageModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-[2fr_3fr] gap-6">
                {/* ── Spieler ── */}
                <div>
                  {(() => {
                    const hostNameNorm = (olympic.hostPlayerName || "").trim().toLowerCase();
                    const visiblePlayers = olympic.participants.filter(
                      (p) =>
                        !(
                          olympic.hostParticipates &&
                          hostNameNorm &&
                          p.name.trim().toLowerCase() === hostNameNorm
                        ),
                    );
                    const gradients = [
                      "from-pink-500 to-purple-600",
                      "from-purple-500 to-blue-600",
                      "from-cyan-500 to-blue-500",
                      "from-green-400 to-teal-500",
                      "from-orange-400 to-pink-500",
                      "from-yellow-400 to-orange-500",
                    ];
                    return (
                      <>
                        <p
                          className="text-[10px] font-black uppercase tracking-[0.2em] mb-3"
                          style={{ color: "#ec4899" }}
                        >
                          Spieler ({visiblePlayers.length})
                        </p>
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {visiblePlayers.length === 0 ? (
                            <p className="text-white/25 text-sm text-center py-3">
                              Keine Spieler
                            </p>
                          ) : (
                            visiblePlayers.map((p, i) => (
                              <div
                                key={p.name}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                                style={{
                                  background: "rgba(255,255,255,0.04)",
                                  border: "1px solid rgba(255,255,255,0.07)",
                                }}
                              >
                                <div
                                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center font-black text-sm text-white flex-shrink-0`}
                                >
                                  {p.name[0]?.toUpperCase()}
                                </div>
                                <span className="flex-1 font-semibold text-white text-sm truncate">
                                  {p.name}
                                </span>
                                <button
                                  className="text-xs px-2.5 py-1 rounded-lg font-bold transition-all flex-shrink-0"
                                  style={{
                                    background: "rgba(236,72,153,0.1)",
                                    color: "#f472b6",
                                    border: "1px solid rgba(236,72,153,0.22)",
                                  }}
                                  onClick={() => confirmKick(p.name)}
                                >
                                  <span className="flex items-center gap-1">
                                    Kick <X size={11} />
                                  </span>
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* ── Spiele ── */}
                <div>
                  <p
                    className="text-[10px] font-black uppercase tracking-[0.2em] mb-3"
                    style={{ color: "#a78bfa" }}
                  >
                    Spiele ({(managingGames ?? olympic.games).length})
                  </p>
                  <DndContext
                    sensors={dndSensors}
                    collisionDetection={closestCenter}
                    onDragEnd={({ active, over }) => {
                      if (!over || active.id === over.id) return;
                      const list = managingGames ?? olympic.games;
                      const oldIdx = list.findIndex(
                        (g, i) =>
                          (g._id ? String(g._id) : `new-${i}`) === active.id,
                      );
                      const newIdx = list.findIndex(
                        (g, i) =>
                          (g._id ? String(g._id) : `new-${i}`) === over.id,
                      );
                      setManagingGames(arrayMove([...list], oldIdx, newIdx));
                    }}
                  >
                    <SortableContext
                      items={(managingGames ?? olympic.games).map((g, i) =>
                        g._id ? String(g._id) : `new-${i}`,
                      )}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2 mb-3 max-h-52 overflow-y-auto pr-1">
                        {(managingGames ?? olympic.games).map((g, i) => {
                          const dndId = g._id ? String(g._id) : `new-${i}`;
                          const scored = !!olympic.results.find(
                            (r) => String(r.gameId) === String(g._id),
                          );
                          const isCur = i === olympic.currentGameIndex;
                          return (
                            <ManageGameRow
                              key={dndId}
                              dndId={dndId}
                              game={g}
                              index={i}
                              total={(managingGames ?? olympic.games).length}
                              isCur={isCur}
                              scored={scored}
                              onMoveUp={() => {
                                const arr = [
                                  ...(managingGames ?? olympic.games),
                                ];
                                [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                                setManagingGames(arr);
                              }}
                              onMoveDown={() => {
                                const arr = [
                                  ...(managingGames ?? olympic.games),
                                ];
                                [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
                                setManagingGames(arr);
                              }}
                              onRemove={() =>
                                setManagingGames(
                                  (managingGames ?? olympic.games).filter(
                                    (_, idx) => idx !== i,
                                  ),
                                )
                              }
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>

                  {/* Add game section with create/library tabs */}
                  <div
                    className="rounded-xl p-3 mb-3 space-y-2"
                    style={{
                      background: "rgba(139,92,246,0.06)",
                      border: "1px solid rgba(139,92,246,0.18)",
                    }}
                  >
                    {/* Tab switcher */}
                    <div className="flex gap-1.5 mb-2">
                      {[
                        {
                          key: "create",
                          label: (
                            <span className="flex items-center gap-1">
                              <Pencil size={11} />
                              Eigenes
                            </span>
                          ),
                        },
                        {
                          key: "library",
                          label: (
                            <span className="flex items-center gap-1">
                              <FolderOpen size={11} />
                              Bibliothek
                            </span>
                          ),
                        },
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                          style={
                            addGameTab === key
                              ? {
                                  background: "rgba(139,92,246,0.35)",
                                  border: "1px solid rgba(139,92,246,0.6)",
                                  color: "#c4b5fd",
                                }
                              : {
                                  background: "rgba(255,255,255,0.04)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  color: "rgba(255,255,255,0.35)",
                                }
                          }
                          onClick={() => setAddGameTab(key)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Create tab */}
                    {addGameTab === "create" && (
                      <div className="flex gap-2">
                        <input
                          className="w-12 text-center rounded-lg px-2 py-1.5 text-base bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500/50"
                          placeholder="🎮"
                          maxLength={2}
                          value={addGameForm.icon}
                          onChange={(e) =>
                            setAddGameForm((f) => ({
                              ...f,
                              icon: e.target.value || "🎮",
                            }))
                          }
                        />
                        <input
                          className="flex-1 rounded-lg px-3 py-1.5 text-sm bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-purple-500/50"
                          placeholder="Spielname…"
                          maxLength={60}
                          value={addGameForm.title}
                          onChange={(e) =>
                            setAddGameForm((f) => ({
                              ...f,
                              title: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && addGameForm.title.trim()) {
                              setManagingGames([
                                ...(managingGames ?? olympic.games),
                                {
                                  ...addGameForm,
                                  title: addGameForm.title.trim(),
                                  order: (managingGames ?? olympic.games)
                                    .length,
                                },
                              ]);
                              setAddGameForm({
                                title: "",
                                icon: "🎮",
                                mode: "ffa",
                              });
                            }
                          }}
                        />
                        {["ffa", "team"].map((m) => (
                          <button
                            key={m}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all"
                            style={
                              addGameForm.mode === m
                                ? {
                                    background: "rgba(139,92,246,0.35)",
                                    border: "1px solid rgba(139,92,246,0.6)",
                                    color: "#c4b5fd",
                                  }
                                : {
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    color: "rgba(255,255,255,0.35)",
                                  }
                            }
                            onClick={() =>
                              setAddGameForm((f) => ({ ...f, mode: m }))
                            }
                          >
                            {m === "ffa" ? (
                              <span className="flex items-center gap-1">
                                <Swords size={10} />
                                FFA
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Users size={10} />
                                Team
                              </span>
                            )}
                          </button>
                        ))}
                        <button
                          className="px-3 py-1.5 rounded-lg text-sm font-bold transition-all disabled:opacity-30"
                          style={{
                            background: "rgba(139,92,246,0.25)",
                            border: "1px solid rgba(139,92,246,0.45)",
                            color: "#c4b5fd",
                          }}
                          disabled={!addGameForm.title.trim()}
                          onClick={() => {
                            setManagingGames([
                              ...(managingGames ?? olympic.games),
                              {
                                ...addGameForm,
                                title: addGameForm.title.trim(),
                                order: (managingGames ?? olympic.games).length,
                              },
                            ]);
                            setAddGameForm({
                              title: "",
                              icon: "🎮",
                              mode: "ffa",
                            });
                          }}
                        >
                          ＋
                        </button>
                      </div>
                    )}

                    {/* Library tab */}
                    {addGameTab === "library" && (
                      <div className="space-y-2">
                        <input
                          className="w-full rounded-lg px-3 py-1.5 text-sm bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-purple-500/50"
                          placeholder="Suchen…"
                          value={librarySearch}
                          onChange={(e) => setLibrarySearch(e.target.value)}
                        />
                        {libraryLoading && (
                          <p className="text-xs text-white/30 text-center py-2 animate-pulse">
                            Lade Bibliothek…
                          </p>
                        )}
                        <div className="space-y-1 max-h-44 overflow-y-auto pr-0.5">
                          {libraryPresets
                            .filter((p) =>
                              p.title
                                .toLowerCase()
                                .includes(librarySearch.toLowerCase()),
                            )
                            .map((preset) => {
                              const curGames = managingGames ?? olympic.games;
                              const already = curGames.some(
                                (g) => g.title === preset.title,
                              );
                              return (
                                <div
                                  key={preset._id}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                                  style={{
                                    background: "rgba(255,255,255,0.02)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                  }}
                                >
                                  <span className="text-base flex-shrink-0">
                                    {preset.icon}
                                  </span>
                                  <span className="flex-1 text-xs text-white/80 truncate">
                                    {preset.title}
                                  </span>
                                  <span
                                    className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded flex-shrink-0"
                                    style={{
                                      background:
                                        preset.mode === "team"
                                          ? "rgba(139,92,246,0.2)"
                                          : "rgba(236,72,153,0.2)",
                                      color:
                                        preset.mode === "team"
                                          ? "#a78bfa"
                                          : "#f472b6",
                                    }}
                                  >
                                    {preset.mode}
                                  </span>
                                  <button
                                    className="px-2 py-0.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 disabled:opacity-40"
                                    style={
                                      already
                                        ? {
                                            background: "rgba(236,72,153,0.15)",
                                            border:
                                              "1px solid rgba(236,72,153,0.4)",
                                            color: "#f472b6",
                                          }
                                        : {
                                            background: "rgba(139,92,246,0.25)",
                                            border:
                                              "1px solid rgba(139,92,246,0.5)",
                                            color: "#c4b5fd",
                                          }
                                    }
                                    disabled={already}
                                    onClick={() => {
                                      if (already) return;
                                      const cur =
                                        managingGames ?? olympic.games;
                                      setManagingGames([
                                        ...cur,
                                        {
                                          title: preset.title,
                                          icon: preset.icon,
                                          mode: preset.mode,
                                          rules: preset.rules,
                                          addons: preset.addons || {},
                                          order: cur.length,
                                        },
                                      ]);
                                    }}
                                  >
                                    {already ? "✓" : "+"}
                                  </button>
                                </div>
                              );
                            })}
                          {!libraryLoading &&
                            libraryPresets.filter((p) =>
                              p.title
                                .toLowerCase()
                                .includes(librarySearch.toLowerCase()),
                            ).length === 0 && (
                              <p className="text-xs text-white/25 text-center py-3">
                                {librarySearch
                                  ? `Keine Ergebnisse für "${librarySearch}"`
                                  : "Bibliothek leer"}
                              </p>
                            )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="btn-secondary flex-1 text-sm !py-2"
                      onClick={() => setManagingGames([...olympic.games])}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <RotateCcw size={13} /> Reset
                      </span>
                    </button>
                    <button
                      className="btn-primary flex-1 text-sm !py-2"
                      onClick={() => {
                        if (!managingGames) return;
                        getSocket().emit("edit-games", {
                          code: code.toUpperCase(),
                          hostToken,
                          games: managingGames,
                        });
                        setManagingGames(null);
                      }}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Save size={14} /> Spiele speichern
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Einstellungen ── */}
              <div>
                <p
                  className="text-[10px] font-black uppercase tracking-[0.2em] mb-4"
                  style={{ color: "#22d3ee" }}
                >
                  Einstellungen
                </p>
                {/* Row 1: Name, Max Players, Scoring Mode, Tie Rule */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/35 block mb-2 leading-none">
                      Event Name
                    </label>
                    <input
                      className="w-full rounded-xl px-4 py-2.5 text-sm bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition-colors"
                      maxLength={60}
                      value={managingSettings.name}
                      onChange={(e) =>
                        setManagingSettings((s) => ({
                          ...s,
                          name: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="w-28 flex-shrink-0">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/35 block mb-2 leading-none">
                      Max. Spieler
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={50}
                      className="w-full rounded-xl px-4 py-2.5 text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                      value={managingSettings.maxPlayers}
                      onChange={(e) =>
                        setManagingSettings((s) => ({
                          ...s,
                          maxPlayers: Math.max(
                            2,
                            Math.min(50, Number(e.target.value)),
                          ),
                        }))
                      }
                    />
                  </div>
                  <Select
                    label={
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/35 block mb-2 leading-none">
                        Wertungssystem
                      </span>
                    }
                    value={managingSettings.scoringMode}
                    onChange={(val) =>
                      setManagingSettings((s) => ({ ...s, scoringMode: val }))
                    }
                    className="flex-1 text-[11px]"
                    options={[
                      {
                        value: "linear",
                        label: "Linear",
                        description:
                          "Jeder Platz gibt Punkte: 1. = n Pkt., letzter = 1 Pkt.",
                      },
                      {
                        value: "top3",
                        label: "Top 3 Only",
                        description:
                          "1.: 3 Pkt. · 2.: 2 Pkt. · 3.: 1 Pkt. · Rest: 0",
                      },
                      {
                        value: "f1",
                        label: "F1 Format",
                        description: "10 · 8 · 6 · 5 · 4 · 3 · 2 · 1 Pkt.",
                      },
                    ]}
                  />
                  <Select
                    label={
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/35 block mb-2 leading-none">
                        Tie-Breaker Regel
                      </span>
                    }
                    value={managingSettings.tieRule}
                    onChange={(val) =>
                      setManagingSettings((s) => ({ ...s, tieRule: val }))
                    }
                    className="flex-1 text-[11px]"
                    options={[
                      {
                        value: "tiebreaker",
                        label: "Tiebreaker Frage entscheidet",
                      },
                      {
                        value: "shared_points",
                        label: "Punkte werden aufgeteilt",
                      },
                    ]}
                  />
                </div>

                {/* Row 2: Bonus/Malus rules – 4-col grid */}
                <div className="mb-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/35 block mb-2 leading-none">
                    Bonus / Malus Regeln
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      {
                        key: "comebackPenalty",
                        Icon: Undo2,
                        iconCls: "text-pink-400",
                        label: "Comeback Malus",
                        badge: "−2 PT",
                        cls: "text-pink-400",
                      },
                      {
                        key: "lastPlaceBonus",
                        Icon: Target,
                        iconCls: "text-green-400",
                        label: "Last Place Bonus",
                        badge: "+1 PT",
                        cls: "text-green-400",
                      },
                      {
                        key: "winStreakBonus",
                        Icon: Flame,
                        iconCls: "text-orange-400",
                        label: "Win Streak Bonus",
                        badge: "+1 PT",
                        cls: "text-green-400",
                      },
                      {
                        key: "finalDoublePoints",
                        Icon: Star,
                        iconCls: "text-yellow-400",
                        label: "Final Double Points",
                        badge: "2×",
                        cls: "text-yellow-400",
                      },
                    ].map(
                      ({ key, Icon: RuleIcon, iconCls, label, badge, cls }) => (
                        <button
                          key={key}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all"
                          style={
                            managingSettings.extraRules?.[key]
                              ? {
                                  background: "rgba(139,92,246,0.1)",
                                  border: "1px solid rgba(139,92,246,0.3)",
                                }
                              : {
                                  background: "rgba(255,255,255,0.03)",
                                  border: "1px solid rgba(255,255,255,0.07)",
                                }
                          }
                          onClick={() =>
                            setManagingSettings((s) => ({
                              ...s,
                              extraRules: {
                                ...s.extraRules,
                                [key]: !s.extraRules?.[key],
                              },
                            }))
                          }
                        >
                          <span className="w-5 flex-shrink-0 flex items-center">
                            <RuleIcon size={12} className={iconCls} />
                          </span>
                          <span className="flex-1 text-xs font-semibold text-white/70 leading-tight">
                            {label}
                          </span>
                          <span
                            className={`text-xs font-black flex-shrink-0 ${cls}`}
                          >
                            {badge}
                          </span>
                          <span
                            className="w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-all"
                            style={
                              managingSettings.extraRules?.[key]
                                ? {
                                    background: "rgba(139,92,246,0.5)",
                                    borderColor: "rgba(139,92,246,0.8)",
                                  }
                                : {
                                    background: "transparent",
                                    borderColor: "rgba(255,255,255,0.2)",
                                  }
                            }
                          >
                            {managingSettings.extraRules?.[key] && (
                              <svg
                                className="w-2.5 h-2.5 text-white"
                                viewBox="0 0 12 12"
                                fill="none"
                              >
                                <path
                                  d="M2 6l3 3 5-5"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {/* Row 3: Toggles + Save button in one flex row */}
                <div className="flex items-center gap-5 flex-wrap">
                  <div className="flex items-center gap-3">
                    <button
                      className="relative w-11 h-[26px] rounded-full transition-all flex-shrink-0"
                      style={{
                        background: managingSettings.hostParticipates
                          ? "rgba(34,211,238,0.5)"
                          : "rgba(255,255,255,0.1)",
                        border: `1px solid ${managingSettings.hostParticipates ? "rgba(34,211,238,0.7)" : "rgba(255,255,255,0.15)"}`,
                      }}
                      onClick={() =>
                        setManagingSettings((s) => ({
                          ...s,
                          hostParticipates: !s.hostParticipates,
                        }))
                      }
                    >
                      <span
                        className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                        style={{
                          background: managingSettings.hostParticipates
                            ? "#22d3ee"
                            : "rgba(255,255,255,0.4)",
                          left: managingSettings.hostParticipates
                            ? "calc(100% - 22px)"
                            : "2px",
                        }}
                      />
                    </button>
                    <p className="text-xs font-semibold text-white/70 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Gamepad2 size={12} /> Host spielt mit
                      </span>
                    </p>
                  </div>
                  {managingSettings.hostParticipates && (
                    <>
                      <input
                        className="rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition-colors w-36"
                        maxLength={30}
                        placeholder="Host Name…"
                        value={managingSettings.hostPlayerName}
                        onChange={(e) =>
                          setManagingSettings((s) => ({
                            ...s,
                            hostPlayerName: e.target.value,
                          }))
                        }
                      />
                      <div className="flex gap-1">
                        <button
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          style={
                            !managingSettings.hostGhostMode
                              ? { background: "rgba(34,211,238,0.15)", border: "1px solid rgba(34,211,238,0.5)", color: "#22d3ee" }
                              : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }
                          }
                          onClick={() => setManagingSettings((s) => ({ ...s, hostGhostMode: false }))}
                        >
                          Score zählt
                        </button>
                        <button
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          style={
                            managingSettings.hostGhostMode
                              ? { background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.5)", color: "#a78bfa" }
                              : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }
                          }
                          onClick={() => setManagingSettings((s) => ({ ...s, hostGhostMode: true }))}
                        >
                          Ghost Mode
                        </button>
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-3">
                    <button
                      className="relative w-11 h-[26px] rounded-full transition-all flex-shrink-0"
                      style={{
                        background: managingSettings.hideGamePlan
                          ? "rgba(250,204,21,0.5)"
                          : "rgba(255,255,255,0.1)",
                        border: `1px solid ${managingSettings.hideGamePlan ? "rgba(250,204,21,0.7)" : "rgba(255,255,255,0.15)"}`,
                      }}
                      onClick={() =>
                        setManagingSettings((s) => ({
                          ...s,
                          hideGamePlan: !s.hideGamePlan,
                        }))
                      }
                    >
                      <span
                        className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                        style={{
                          background: managingSettings.hideGamePlan
                            ? "#facc15"
                            : "rgba(255,255,255,0.4)",
                          left: managingSettings.hideGamePlan
                            ? "calc(100% - 22px)"
                            : "2px",
                        }}
                      />
                    </button>
                    <p className="text-xs font-semibold text-white/70 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Lock size={12} /> Spielplan verstecken
                      </span>
                    </p>
                  </div>
                  <button
                    className="btn-primary text-sm !py-2 !px-5 ml-auto flex-shrink-0"
                    onClick={() => {
                      getSocket().emit("update-settings", {
                        code: code.toUpperCase(),
                        hostToken,
                        settings: managingSettings,
                      });
                    }}
                  >
                    <span className="flex items-center gap-1.5">
                      <Save size={14} /> Einstellungen speichern
                    </span>
                  </button>
                </div>
              </div>

              {/* ── Danger zone ── */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(250,204,21,0.04)",
                  border: "1px solid rgba(250,204,21,0.15)",
                }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400/60 mb-3">
                  Gefahrenzone
                </p>
                <button
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: "rgba(250,204,21,0.07)",
                    color: "#facc15",
                    border: "1px solid rgba(250,204,21,0.18)",
                  }}
                  onClick={() => {
                    setShowManageModal(false);
                    revertToDraft();
                  }}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <RotateCcw size={14} /> Olympiade zurück zum Entwurf
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          danger={confirmModal.danger}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      <FloatingRoomNav code={code} />

      {tiebreaker && (
        <TiebreakerModal
          question={tiebreaker.question}
          unit={tiebreaker.unit}
          tiedPlayers={tiebreaker.tiedPlayers}
          answers={tiebreakerAnswers}
          isHost={true}
          isParticipant={
            olympic.hostParticipates &&
            !olympic.hostGhostMode &&
            tiebreaker.tiedPlayers.includes(olympic.hostPlayerName)
          }
          onAnswer={(answer) =>
            getSocket().emit("tiebreaker-answer", {
              code: code.toUpperCase(),
              name: olympic.hostPlayerName,
              answer,
            })
          }
          onResolve={(winner) =>
            getSocket().emit("tiebreaker-resolve", {
              code: code.toUpperCase(),
              hostToken,
              gameId: tiebreaker.gameId,
              winner,
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
          isHost={true}
          hostToken={hostToken}
          onClose={() => setIntroOlympic(null)}
        />
      )}
    </>
  );
}
