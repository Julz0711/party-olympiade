import { useState, useEffect, Fragment } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import Input from "../components/ui/Input.jsx";
import Select from "../components/ui/Select.jsx";
import { useAuthStore } from "../store/useAuthStore.js";
import AuthModal from "../components/AuthModal.jsx";
import {
  Crown,
  Gamepad2,
  Users,
  Trophy,
  Swords,
  Lightbulb,
  Clock,
  Beer,
  Wrench,
  Scale,
  FolderOpen,
  Search,
  Target,
  Flame,
  Star,
  Undo2,
  Rocket,
  Save,
  X,
  Check,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Eye,
  CalendarDays,
  Medal,
  Pencil,
  Plus,
  Lock,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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

const STEPS = ["Event Setup", "Spiele", "Vorschau"];

const DEFAULT_ADDONS = {
  drinkingGame: { enabled: false, rules: "" },
  timeLimit: 0,
  equipment: "",
  handicap: "",
  teamSize: 2,
};

// ─── Bonus / Malus rule definitions ───────────────────────────────────────
const BONUS_RULES = [
  {
    key: "comebackPenalty",
    Icon: Undo2,
    iconColor: "text-pink-400",
    label: "COMEBACK MALUS",
    desc: "Vorheriger Sieger wird Letzter (nur FFA)",
    badge: "−2 PT",
    badgeClass: "text-pink-400",
  },
  {
    key: "lastPlaceBonus",
    Icon: Target,
    iconColor: "text-green-400",
    label: "LAST PLACE BONUS",
    desc: "Letzter Platz gewinnt das nächste Spiel (nur FFA)",
    badge: "+1 PT",
    badgeClass: "text-green-400",
  },
  {
    key: "winStreakBonus",
    Icon: Flame,
    iconColor: "text-orange-400",
    label: "WIN STREAK BONUS",
    desc: "Zwei FFA-Siege in Folge",
    badge: "+1 PT",
    badgeClass: "text-green-400",
  },
  {
    key: "finalDoublePoints",
    Icon: Star,
    iconColor: "text-yellow-400",
    label: "FINAL DOUBLE POINTS",
    desc: "Letztes Spiel gibt doppelte Basispunkte",
    badge: "2×",
    badgeClass: "text-yellow-400",
  },
];

// ─── Step 1: Event Setup ───────────────────────────────────────────────────
function StepEventSetup({ data, onChange }) {
  const { user } = useAuthStore();
  return (
    <div className="space-y-5">
      {/* Row 1: Name + Max Players side by side */}
      <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-end">
        <div>
          <label className="label-upper">Olympic Name</label>
          <div className="relative">
            <input
              className="input-field pr-12"
              placeholder="z.B. Summer Gaming Olympics 2025"
              maxLength={60}
              value={data.name}
              onChange={(e) => onChange({ name: e.target.value })}
            />
            <Crown
              size={16}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-500 pointer-events-none"
            />
          </div>
        </div>
        <div className="sm:w-28">
          <label className="label-upper">Max. Spieler</label>
          <div className="relative">
            <input
              type="number"
              className="input-field text-center"
              min={2}
              max={50}
              value={data.maxPlayers}
              onChange={(e) =>
                onChange({
                  maxPlayers: Math.max(2, Math.min(50, Number(e.target.value))),
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Row 2: Scoring + Tie-Breaker side by side */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Select
          label={
            <span className="label-upper" style={{ marginBottom: 0 }}>
              Wertungssystem
            </span>
          }
          value={data.scoringMode}
          onChange={(val) => onChange({ scoringMode: val })}
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
              description: "1.: 3 Pkt. · 2.: 2 Pkt. · 3.: 1 Pkt. · Rest: 0",
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
            <span className="label-upper" style={{ marginBottom: 0 }}>
              Tie-Breaker Regel
            </span>
          }
          value={data.tieRule}
          onChange={(val) => onChange({ tieRule: val })}
          options={[
            { value: "tiebreaker", label: "Tiebreaker Frage entscheidet" },
            { value: "shared_points", label: "Punkte werden aufgeteilt" },
          ]}
        />
      </div>

      {/* Bonus / Malus Rules */}
      <div>
        <p className="label-upper">Optionale Bonus / Malus Regeln</p>
        <div className="grid sm:grid-cols-2 gap-4 mt-3">
          {BONUS_RULES.map(
            ({
              key,
              Icon: RuleIcon,
              iconColor,
              label,
              desc,
              badge,
              badgeClass,
            }) => (
              <label key={key} className="checkbox-card">
                {/* Custom visual checkbox */}
                <div
                  className={`checkbox-dot ${data.extraRules[key] ? "checked" : ""}`}
                  aria-hidden="true"
                >
                  {data.extraRules[key] && (
                    <svg
                      className="w-3 h-3 text-white"
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
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={data.extraRules[key]}
                  onChange={(e) =>
                    onChange({
                      extraRules: {
                        ...data.extraRules,
                        [key]: e.target.checked,
                      },
                    })
                  }
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-black text-white/80 uppercase tracking-wide flex items-center gap-1.5">
                    <RuleIcon size={12} className={iconColor} />
                    {label}
                  </span>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">
                    {desc}
                  </p>
                </div>
                <span
                  className={`text-xs font-black flex-shrink-0 ${badgeClass}`}
                >
                  {badge}
                </span>
              </label>
            ),
          )}
        </div>
      </div>

      {/* Host options */}
      <div>
        <p className="label-upper">Host-Optionen</p>
        <div className="grid sm:grid-cols-2 gap-4 mt-3">
          {/* Host participates */}
          <label
            className="checkbox-card"
            style={{
              borderColor: data.hostParticipates
                ? "rgba(34,211,238,0.3)"
                : undefined,
              background: data.hostParticipates
                ? "rgba(34,211,238,0.05)"
                : undefined,
            }}
          >
            <div
              className={`checkbox-dot ${data.hostParticipates ? "checked-cyan" : ""}`}
              aria-hidden="true"
            >
              {data.hostParticipates && (
                <svg
                  className="w-3 h-3 text-white"
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
            </div>
            <input
              type="checkbox"
              className="sr-only"
              checked={!!data.hostParticipates}
              onChange={(e) =>
                onChange({
                  hostParticipates: e.target.checked,
                  hostGhostMode: false,
                  ...(e.target.checked && !data.hostPlayerName && user?.username
                    ? { hostPlayerName: user.username }
                    : {}),
                })
              }
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black text-white/80 uppercase tracking-wide flex items-center gap-1.5">
                <Gamepad2 size={12} className="text-cyan-400" /> Host spielt mit
              </span>
              <p className="text-xs text-muted mt-0.5">Dein Score zählt mit.</p>
            </div>
          </label>

          {/* Hide game plan */}
          <label
            className="checkbox-card"
            style={{
              borderColor: data.hideGamePlan
                ? "rgba(250,204,21,0.3)"
                : undefined,
              background: data.hideGamePlan
                ? "rgba(250,204,21,0.04)"
                : undefined,
            }}
          >
            <div
              className={`checkbox-dot ${data.hideGamePlan ? "checked" : ""}`}
              aria-hidden="true"
            >
              {data.hideGamePlan && (
                <svg
                  className="w-3 h-3 text-white"
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
            </div>
            <input
              type="checkbox"
              className="sr-only"
              checked={!!data.hideGamePlan}
              onChange={(e) => onChange({ hideGamePlan: e.target.checked })}
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black text-white/80 uppercase tracking-wide flex items-center gap-1.5">
                <Eye size={12} className="text-yellow-400" /> Spielplan
                verstecken
              </span>
              <p className="text-xs text-muted mt-0.5">
                Spieltitel verschwommen bis zum Start.
              </p>
            </div>
            <span className="text-xs font-black flex-shrink-0 text-yellow-400">
              Blur
            </span>
          </label>

          {/* Score / Ghost toggle — spans full width, only when host plays */}
          {data.hostParticipates && (
            <div className="flex gap-2" style={{ gridColumn: "1 / -1" }}>
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all"
                style={
                  !data.hostGhostMode
                    ? {
                        background: "rgba(34,211,238,0.15)",
                        border: "1px solid rgba(34,211,238,0.5)",
                        color: "#22d3ee",
                      }
                    : {
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.35)",
                      }
                }
                onClick={() => onChange({ hostGhostMode: false })}
              >
                Score zählt
              </button>
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all"
                style={
                  data.hostGhostMode
                    ? {
                        background: "rgba(139,92,246,0.15)",
                        border: "1px solid rgba(139,92,246,0.5)",
                        color: "#a78bfa",
                      }
                    : {
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.35)",
                      }
                }
                onClick={() => onChange({ hostGhostMode: true })}
              >
                Ghost Mode
              </button>
            </div>
          )}
        </div>

        {data.hostParticipates && (
          <div className="mt-3">
            <Input
              label="Dein Spielername"
              placeholder="z.B. Alex"
              maxLength={30}
              value={data.hostPlayerName || ""}
              onChange={(e) => onChange({ hostPlayerName: e.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Preview Panel (right column on Step 1) ────────────────────────────────
function PreviewPanel({ data }) {
  const scoringLabels = {
    linear: "Linear",
    top3: "Top 3 Only",
    f1: "F1 Format",
  };
  const tieLabels = {
    tiebreaker: "Tiebreaker Frage entscheidet",
    shared_points: "Punkte aufteilen",
  };

  const activeRules = [
    data.extraRules?.comebackPenalty && {
      label: "Comeback Malus",
      badge: "−2 Punkte",
      cls: "text-pink-400",
    },
    data.extraRules?.lastPlaceBonus && {
      label: "Last Place Bonus",
      badge: "+1 Punkt",
      cls: "text-green-400",
    },
    data.extraRules?.winStreakBonus && {
      label: "Win Streak Bonus",
      badge: "+1 Punkt",
      cls: "text-green-400",
    },
    data.extraRules?.finalDoublePoints && {
      label: "Final Double Points",
      badge: "2× Basispunkte",
      cls: "text-yellow-400",
    },
    data.hostParticipates && {
      label: "Host spielt mit",
      badge: data.hostGhostMode ? "Ghost" : "Score zählt",
      cls: data.hostGhostMode ? "text-purple-400" : "text-cyan-400",
    },
  ].filter(Boolean);

  return (
    <div className="space-y-4 lg:sticky lg:top-20">
      {/* Main preview card */}
      <div className="panel-glass rounded-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-0">
          <p
            className="font-black uppercase tracking-[0.2em] text-xs"
            style={{ color: "#ec4899" }}
          >
            Vorschau
          </p>
        </div>

        {/* Podium illustration */}
        <div
          className="relative mx-5 mt-4 mb-5 h-40 rounded-xl overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(236,72,153,0.08) 60%, rgba(34,211,238,0.06) 100%)",
            border: "1px solid rgba(139,92,246,0.18)",
          }}
        >
          {/* Ambient glow */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-20 rounded-full bg-pink-500/15 blur-2xl pointer-events-none" />
          {/* Podium blocks */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-3 px-10">
            {/* 2nd */}
            <div className="w-1/4 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-cyan-500/30 border border-cyan-500/40 mb-1" />
              <div
                className="w-full h-[52px] rounded-t-lg flex items-end justify-center pb-1.5"
                style={{
                  background:
                    "linear-gradient(to top, rgba(34,211,238,0.28), rgba(34,211,238,0.08))",
                  border: "1px solid rgba(34,211,238,0.22)",
                  borderBottom: "none",
                }}
              >
                <span className="text-cyan-400 font-black text-base">2</span>
              </div>
            </div>
            {/* 1st */}
            <div className="w-1/4 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-yellow-500/30 border border-yellow-500/40 mb-1 ring-2 ring-yellow-400/25" />
              <div
                className="w-full h-[72px] rounded-t-lg flex items-end justify-center pb-1.5"
                style={{
                  background:
                    "linear-gradient(to top, rgba(250,204,21,0.28), rgba(250,204,21,0.08))",
                  border: "1px solid rgba(250,204,21,0.22)",
                  borderBottom: "none",
                }}
              >
                <span className="text-yellow-400 font-black text-xl">1</span>
              </div>
            </div>
            {/* 3rd */}
            <div className="w-1/4 flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-purple-500/30 border border-purple-500/40 mb-1" />
              <div
                className="w-full h-[38px] rounded-t-lg flex items-end justify-center pb-1.5"
                style={{
                  background:
                    "linear-gradient(to top, rgba(139,92,246,0.28), rgba(139,92,246,0.08))",
                  border: "1px solid rgba(139,92,246,0.22)",
                  borderBottom: "none",
                }}
              >
                <span className="text-purple-400 font-black text-sm">3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-5 pb-5 space-y-3.5">
          {[
            {
              icon: <Users size={14} className="text-cyan-400" />,
              label: "Spieler",
              value: data.maxPlayers,
              cls: "text-white font-semibold",
            },
            {
              icon: <Trophy size={14} className="text-yellow-400" />,
              label: "Wertungssystem",
              value: scoringLabels[data.scoringMode] || "Linear",
              cls: "text-white font-semibold",
            },
            {
              icon: <Swords size={14} className="text-pink-400" />,
              label: "Tie-Breaker",
              value: tieLabels[data.tieRule] || data.tieRule,
              cls: "text-white/80 text-xs",
            },
          ].map(({ icon, label, value, cls }) => (
            <div key={label} className="flex items-start gap-3">
              <span className="leading-none mt-0.5 flex-shrink-0">{icon}</span>
              <div className="min-w-0">
                <div className="text-xs text-muted leading-none mb-0.5">
                  {label}
                </div>
                <div className={`text-sm truncate ${cls}`}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active rules */}
      {activeRules.length > 0 && (
        <div className="panel-glass rounded-2xl p-5">
          <p
            className="font-black uppercase tracking-[0.2em] text-xs mb-3"
            style={{ color: "#ec4899" }}
          >
            Aktive Regeln
          </p>
          <div className="space-y-2.5">
            {activeRules.map((rule, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="text-white/70 text-sm">{rule.label}</span>
                <span className={`text-xs font-bold flex-shrink-0 ${rule.cls}`}>
                  {rule.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info box */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "rgba(34,211,238,0.04)",
          border: "1px solid rgba(34,211,238,0.14)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb size={14} className="text-cyan-400" />
          <h4 className="text-cyan-400 text-xs font-black uppercase tracking-widest">
            So funktioniert's
          </h4>
        </div>
        <p className="text-white/45 text-xs leading-relaxed">
          Erstelle deine Lobby, wähle Regeln und lade deine Freunde ein. Sammelt
          Punkte, spielt verrückte Spiele und kürt am Ende den Champion!
        </p>
      </div>
    </div>
  );
}
// ─── Step 2: Games ────────────────────────────────────────────────────────
function SortableGameRow({ game, index, total, onMove, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: game._dndId });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${isDragging ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.06)"}`,
      }}
      className="flex items-center gap-2.5 p-2.5 rounded-xl"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing px-0.5 touch-none"
        tabIndex={-1}
      >
        <GripVertical size={16} />
      </button>
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: "rgba(139,92,246,0.12)" }}
      >
        {game.icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-bold text-white text-sm truncate block">
          {game.title}
        </span>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-black uppercase"
            style={{ color: game.mode === "team" ? "#a78bfa" : "#f472b6" }}
          >
            {game.mode.toUpperCase()}
          </span>
          {game.estimatedMinutes > 0 && (
            <span className="text-[10px] text-cyan-400/50">
              ~{game.estimatedMinutes}m
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-0.5 items-center shrink-0">
        <button
          className="text-white/25 hover:text-white/70 p-0.5 rounded disabled:opacity-20"
          onClick={() => onMove(index, -1)}
          disabled={index === 0}
        >
          <ChevronUp size={14} />
        </button>
        <button
          className="text-white/25 hover:text-white/70 p-0.5 rounded disabled:opacity-20"
          onClick={() => onMove(index, 1)}
          disabled={index === total - 1}
        >
          <ChevronDown size={14} />
        </button>
        <button
          className="text-pink-400/60 hover:text-pink-400 ml-0.5 p-0.5"
          onClick={onRemove}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function StepGames({ games, onChange }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Attach stable dnd IDs
  const gamesWithIds = games.map((g, i) => ({
    ...g,
    _dndId: `game-${i}-${g.title}`,
  }));

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = gamesWithIds.findIndex((g) => g._dndId === active.id);
    const newIdx = gamesWithIds.findIndex((g) => g._dndId === over.id);
    onChange(
      arrayMove(games, oldIdx, newIdx).map((g, i) => ({ ...g, order: i })),
    );
  }

  const [tab, setTab] = useState("create"); // 'create' | 'library'

  // ── Create tab state ──
  const [form, setForm] = useState({
    title: "",
    mode: "ffa",
    icon: "🎮",
    rules: "",
    estimatedMinutes: 0,
    addons: { ...DEFAULT_ADDONS },
  });
  const [showAddons, setShowAddons] = useState(false);

  // ── Library tab state ──
  const [presets, setPresets] = useState([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [presetsError, setPresetsError] = useState("");
  const [search, setSearch] = useState("");

  // Load presets when library tab is first opened
  useEffect(() => {
    if (tab !== "library" || presets.length > 0) return;
    setPresetsLoading(true);
    setPresetsError("");
    api
      .get("/game-presets")
      .then(({ data }) => setPresets(data))
      .catch(() => setPresetsError("Failed to load library"))
      .finally(() => setPresetsLoading(false));
  }, [tab]); // eslint-disable-line

  function addGame() {
    const title = form.title.trim();
    if (!title) return;
    onChange([...games, { ...form, title, order: games.length }]);
    setForm({
      title: "",
      mode: "ffa",
      icon: "🎮",
      rules: "",
      estimatedMinutes: 0,
      addons: { ...DEFAULT_ADDONS },
    });
    setShowAddons(false);
  }

  function addFromLibrary(preset) {
    onChange([
      ...games,
      {
        title: preset.title,
        mode: preset.mode,
        icon: preset.icon,
        rules: preset.rules,
        estimatedMinutes: preset.estimatedMinutes || 0,
        addons: preset.addons || { ...DEFAULT_ADDONS },
        order: games.length,
      },
    ]);
  }

  function moveGame(i, dir) {
    const arr = [...games];
    const swap = i + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[i], arr[swap]] = [arr[swap], arr[i]];
    onChange(arr.map((g, idx) => ({ ...g, order: idx })));
  }

  const filteredPresets = presets.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">
      {/* ── Left column: tabs + form/library ── */}
      <div className="space-y-4">
        {/* ── Tab switcher ── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              key: "create",
              icon: "+",
              label: "Eigenes Spiel erstellen",
              sub: "Individuelle Regeln & Einstellungen",
              pencil: true,
            },
            {
              key: "library",
              icon: "⬡",
              label: "Aus Bibliothek wählen",
              sub: "Bewährte Spiele & Vorlagen",
            },
          ].map(({ key, label, sub }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="text-left p-4 rounded-2xl transition-all duration-200"
              style={
                tab === key
                  ? {
                      background: "rgba(139,92,246,0.12)",
                      border: "1.5px solid rgba(139,92,246,0.55)",
                      boxShadow: "0 0 24px rgba(139,92,246,0.15)",
                    }
                  : {
                      background: "rgba(255,255,255,0.03)",
                      border: "1.5px solid rgba(255,255,255,0.08)",
                    }
              }
            >
              <div
                className={`font-black text-sm mb-0.5 flex items-center gap-1.5 ${tab === key ? "text-white" : "text-muted"}`}
              >
                {key === "create" ? (
                  <Plus size={13} />
                ) : (
                  <FolderOpen size={13} />
                )}
                {label}
                {key === "create" && (
                  <Pencil size={11} className="ml-0.5 opacity-60" />
                )}
              </div>
              <div className="text-xs text-white/35">{sub}</div>
            </button>
          ))}
        </div>

        {/* ── Library tab: single panel, full-width in left column ── */}
        {tab === "library" && (
          <div
            className="rounded-2xl p-4 flex flex-col gap-4"
            style={{
              background: "rgba(10,12,30,0.95)",
              border: "1px solid rgba(139,92,246,0.22)",
            }}
          >
            <div className="flex items-center gap-2">
              <FolderOpen size={14} className="text-purple-400" />
              <h3 className="font-black text-white text-xs uppercase tracking-[0.15em]">
                Spielbibliothek
              </h3>
            </div>

            {/* Search */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                className="input-field pl-9 text-sm"
                placeholder="Spiele suchen…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Mode filter chips */}
            <div className="flex flex-wrap gap-2">
              {["Alle", "Team", "FFA"].map((f) => (
                <button
                  key={f}
                  className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                  style={{
                    background:
                      f === "Alle" ? "#ec4899" : "rgba(255,255,255,0.05)",
                    color: f === "Alle" ? "#fff" : "#b7bbcc",
                    border:
                      "1px solid " +
                      (f === "Alle" ? "transparent" : "rgba(255,255,255,0.08)"),
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {presetsLoading && (
              <p className="text-muted text-sm text-center py-6 animate-pulse">
                Lade Bibliothek…
              </p>
            )}
            {presetsError && (
              <p className="text-pink-400 text-sm text-center py-4">
                {presetsError}
              </p>
            )}
            {!presetsLoading &&
              filteredPresets.length === 0 &&
              !presetsError && (
                <p className="text-muted text-sm text-center py-6">
                  {search
                    ? `Keine Spiele für "${search}"`
                    : "Bibliothek ist leer — sei der Erste!"}
                </p>
              )}

            <div className="space-y-2 overflow-y-auto max-h-[520px] pr-1">
              {filteredPresets.map((preset) => {
                const already = games.some((g) => g.title === preset.title);
                return (
                  <div
                    key={preset._id}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: "rgba(139,92,246,0.12)" }}
                    >
                      {preset.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm truncate">
                          {preset.title}
                        </span>
                        <span
                          className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded"
                          style={{
                            background:
                              preset.mode === "team"
                                ? "rgba(139,92,246,0.2)"
                                : "rgba(236,72,153,0.2)",
                            color:
                              preset.mode === "team" ? "#a78bfa" : "#f472b6",
                          }}
                        >
                          {preset.mode.toUpperCase()}
                        </span>
                      </div>
                      {preset.rules && (
                        <p className="text-xs text-muted mt-0.5 line-clamp-1">
                          {preset.rules}
                        </p>
                      )}
                      <p className="text-xs text-white/25 mt-0.5">
                        by {preset.createdByUsername}
                      </p>
                    </div>
                    <button
                      className="flex-shrink-0 text-xs px-3 py-1.5 rounded-xl font-bold transition-all"
                      style={
                        already
                          ? {
                              background: "rgba(34,197,94,0.15)",
                              color: "#4ade80",
                              cursor: "default",
                            }
                          : {
                              background: "rgba(236,72,153,0.15)",
                              border: "1px solid rgba(236,72,153,0.4)",
                              color: "#f472b6",
                            }
                      }
                      onClick={() => !already && addFromLibrary(preset)}
                      disabled={already}
                    >
                      {already ? (
                        <span className="flex items-center gap-1">
                          <Check size={11} /> Hinzugefügt
                        </span>
                      ) : (
                        "+ Hinzufügen"
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Create tab ── */}
        {tab === "create" && (
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{
              background: "rgba(10,12,30,0.97)",
              border: "1px solid rgba(139,92,246,0.28)",
              boxShadow: "0 0 30px rgba(139,92,246,0.08)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Pencil size={14} className="text-purple-400" />
              <h3 className="font-black text-white text-xs uppercase tracking-[0.15em]">
                Spiel hinzufügen
              </h3>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Spieltitel"
                maxLength={60}
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                className="flex-1"
              />
              <input
                className="input-field w-16 text-center text-xl"
                placeholder="🎮"
                maxLength={2}
                value={form.icon}
                onChange={(e) =>
                  setForm((f) => ({ ...f, icon: e.target.value || "🎮" }))
                }
              />
            </div>

            <div className="flex gap-3">
              {["ffa", "team"].map((m) => (
                <button
                  key={m}
                  onClick={() => setForm((f) => ({ ...f, mode: m }))}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={
                    form.mode === m
                      ? {
                          background:
                            "linear-gradient(90deg, #8b5cf6, #6d28d9)",
                          color: "#fff",
                          border: "1px solid rgba(139,92,246,0.5)",
                          boxShadow: "0 0 16px rgba(139,92,246,0.3)",
                        }
                      : {
                          background: "rgba(255,255,255,0.04)",
                          color: "rgba(255,255,255,0.5)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }
                  }
                >
                  {m === "ffa" ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Swords size={13} />
                      FFA
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <Users size={13} />
                      Teams
                    </span>
                  )}
                </button>
              ))}
            </div>

            <textarea
              className="textarea-field h-24"
              placeholder="Regeln (optional, max 1000 Zeichen)"
              maxLength={1000}
              value={form.rules}
              onChange={(e) =>
                setForm((f) => ({ ...f, rules: e.target.value }))
              }
            />

            <div>
              <label className="label flex items-center gap-1.5">
                <Clock size={12} className="text-cyan-400/70" /> Geschätzte
                Dauer (Min, optional)
              </label>
              <input
                type="number"
                className="input-field"
                min={0}
                placeholder="z.B. 30"
                value={form.estimatedMinutes || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    estimatedMinutes: Number(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <button
              className="text-sm text-purple-light hover:text-purple transition-colors"
              onClick={() => setShowAddons((s) => !s)}
            >
              <span className="flex items-center gap-1.5">
                {showAddons ? (
                  <ChevronUp size={13} />
                ) : (
                  <ChevronDown size={13} />
                )}
                {showAddons
                  ? "Add-ons ausblenden"
                  : "Add-ons anzeigen (optional)"}
              </span>
            </button>

            {showAddons && (
              <div className="space-y-3 pt-1">
                <label className="flex items-center gap-3 text-sm text-white">
                  <input
                    type="checkbox"
                    className="accent-purple w-4 h-4"
                    checked={form.addons.drinkingGame.enabled}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        addons: {
                          ...f.addons,
                          drinkingGame: {
                            ...f.addons.drinkingGame,
                            enabled: e.target.checked,
                          },
                        },
                      }))
                    }
                  />
                  <Beer size={14} className="text-orange-400" />{" "}
                  Trinkspiel-Modus
                </label>
                {form.addons.drinkingGame.enabled && (
                  <textarea
                    className="textarea-field h-16 text-sm"
                    placeholder="Trinkregeln…"
                    maxLength={500}
                    value={form.addons.drinkingGame.rules}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        addons: {
                          ...f.addons,
                          drinkingGame: {
                            ...f.addons.drinkingGame,
                            rules: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label flex items-center gap-1.5">
                      <Clock size={12} className="text-cyan-400/70" /> Zeitlimit
                      (min, 0=∞)
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      min={0}
                      value={form.addons.timeLimit}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          addons: {
                            ...f.addons,
                            timeLimit: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                  {form.mode === "team" && (
                    <div>
                      <label className="label flex items-center gap-1.5">
                        <Users size={12} className="text-purple-400/70" />{" "}
                        Teamgröße
                      </label>
                      <input
                        type="number"
                        className="input-field"
                        min={1}
                        value={form.addons.teamSize}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            addons: {
                              ...f.addons,
                              teamSize: Number(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                  )}
                </div>
                <Input
                  label={
                    <span className="flex items-center gap-1.5">
                      <Wrench size={12} className="text-white/50" />
                      Benötigtes Equipment
                    </span>
                  }
                  placeholder="z.B. Controller, 2 TVs"
                  maxLength={200}
                  value={form.addons.equipment}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      addons: { ...f.addons, equipment: e.target.value },
                    }))
                  }
                />
                <Input
                  label={
                    <span className="flex items-center gap-1.5">
                      <Scale size={12} className="text-white/50" />
                      Handicap-Regeln
                    </span>
                  }
                  placeholder="z.B. Bester Spieler nutzt Tastatur"
                  maxLength={200}
                  value={form.addons.handicap}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      addons: { ...f.addons, handicap: e.target.value },
                    }))
                  }
                />
              </div>
            )}

            <button
              className="btn-primary w-full"
              onClick={addGame}
              disabled={!form.title.trim()}
            >
              + Spiel hinzufügen
            </button>
          </div>
        )}

        {/* end left column */}
      </div>

      {/* ── Right column: persistent selected games ── */}
      <div
        className="rounded-2xl p-4 flex flex-col gap-3 lg:sticky lg:top-6"
        style={{
          background: "rgba(10,12,30,0.97)",
          border: "1px solid rgba(236,72,153,0.28)",
          boxShadow: "0 0 24px rgba(236,72,153,0.07)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 size={14} className="text-pink-400" />
            <h3 className="font-black text-white text-xs uppercase tracking-[0.15em]">
              Ausgewählte Spiele
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {(() => {
              const total = games.reduce(
                (sum, g) => sum + (g.estimatedMinutes || 0),
                0,
              );
              if (!total) return null;
              const h = Math.floor(total / 60);
              const m = total % 60;
              return (
                <span className="text-[10px] text-cyan-400/60 font-semibold flex items-center gap-1">
                  <Clock size={10} /> ~{h > 0 ? `${h}h ` : ""}
                  {m > 0 ? `${m}m` : ""}
                </span>
              );
            })()}
            {games.length > 0 && (
              <span
                className="text-xs font-black px-2 py-0.5 rounded-full"
                style={{ background: "#ec4899", color: "#fff" }}
              >
                {games.length}
              </span>
            )}
          </div>
        </div>

        {games.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-10 text-center">
            <div>
              <Gamepad2 size={36} className="text-white/15 mb-2" />
              <p className="text-white/25 text-xs leading-relaxed">
                Hier erscheinen die Spiele deiner Olympiade.
              </p>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={gamesWithIds.map((g) => g._dndId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 overflow-y-auto max-h-[540px] pr-0.5">
                {gamesWithIds.map((g, i) => (
                  <SortableGameRow
                    key={g._dndId}
                    game={g}
                    index={i}
                    total={games.length}
                    onMove={moveGame}
                    onRemove={() =>
                      onChange(games.filter((_, idx) => idx !== i))
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Preview ──────────────────────────────────────────────────────
function StepPreview({ data }) {
  const scoringLabels = {
    linear: "Linear",
    top3: "Top 3 Only",
    f1: "F1 Format",
  };
  const tieLabels = {
    tiebreaker: "Tiebreaker Frage entscheidet",
    shared_points: "Punkte aufteilen",
  };

  const activeRuleLabels = {
    comebackPenalty: "Comeback Malus aktiv",
    lastPlaceBonus: "Last Place Bonus aktiv",
    winStreakBonus: "WinStreak Bonus aktiv",
    finalDoublePoints: "Final Double Points aktiv",
  };

  const activeRules = Object.entries(data.extraRules)
    .filter(([, v]) => v)
    .map(([k]) => activeRuleLabels[k] || k);

  const panelStyle = {
    background: "rgba(10,12,30,0.97)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "16px",
  };

  return (
    <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-4">
      {/* ── Left column ── */}
      <div className="space-y-3">
        {/* Deine Lobby */}
        <div style={panelStyle} className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Crown size={14} className="text-purple-400" />
            <h3 className="font-black text-white text-xs uppercase tracking-[0.18em]">
              Deine Lobby
            </h3>
          </div>

          <p className="text-white text-xl font-black mb-4">
            {data.name || "—"}
          </p>

          <div className="space-y-3">
            {[
              {
                icon: <Users size={14} className="text-cyan-400" />,
                label: "Max. Spieler",
                value: data.maxPlayers,
              },
              {
                icon: <Trophy size={14} className="text-yellow-400" />,
                label: "Wertungssystem",
                value: scoringLabels[data.scoringMode] || "Linear",
              },
              {
                icon: <Swords size={14} className="text-pink-400" />,
                label: "Tie-Breaker",
                value: tieLabels[data.tieRule] || data.tieRule,
              },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="flex-shrink-0">{icon}</span>
                <div>
                  <div className="text-xs text-white/45">{label}</div>
                  <div className="text-white text-sm font-semibold">
                    {value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {activeRules.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {activeRules.map((r) => (
                <span
                  key={r}
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{
                    background: "rgba(139,92,246,0.18)",
                    border: "1px solid rgba(139,92,246,0.35)",
                    color: "#a78bfa",
                  }}
                >
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Spiele */}
        <div style={panelStyle} className="p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Gamepad2 size={14} className="text-purple-400" />
              <h3 className="font-black text-white text-xs uppercase tracking-[0.18em]">
                Spiele ({data.games.length})
              </h3>
            </div>
            {(() => {
              const total = data.games.reduce(
                (sum, g) => sum + (g.estimatedMinutes || 0),
                0,
              );
              if (!total) return null;
              const h = Math.floor(total / 60);
              const m = total % 60;
              return (
                <span className="text-[10px] text-cyan-400/60 font-semibold flex items-center gap-1">
                  <Clock size={10} /> ~{h > 0 ? `${h}h ` : ""}
                  {m > 0 ? `${m}m` : ""}
                </span>
              );
            })()}
          </div>

          {data.games.length === 0 ? (
            <p className="text-muted text-sm py-2">
              Noch keine Spiele hinzugefügt.
            </p>
          ) : (
            <div className="space-y-3">
              {data.games.map((g, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-white/30 text-xs w-4 flex-shrink-0">
                    {i + 1}.
                  </span>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: "rgba(139,92,246,0.12)" }}
                  >
                    {g.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-semibold text-sm truncate">
                      {g.title}
                    </div>
                    {g.rules && (
                      <div className="text-xs text-muted line-clamp-1">
                        {g.rules}
                      </div>
                    )}
                  </div>
                  <span
                    className="text-[10px] font-black uppercase ml-auto flex-shrink-0 px-1.5 py-0.5 rounded"
                    style={{
                      background:
                        g.mode === "team"
                          ? "rgba(139,92,246,0.2)"
                          : "rgba(236,72,153,0.2)",
                      color: g.mode === "team" ? "#a78bfa" : "#f472b6",
                    }}
                  >
                    {g.mode.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Room code info */}
        <div
          style={{
            background: "rgba(34,211,238,0.04)",
            border: "1px solid rgba(34,211,238,0.18)",
            borderRadius: "16px",
          }}
          className="p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-cyan-400" />
            <h4 className="font-black text-cyan-400 text-xs uppercase tracking-[0.15em]">
              Spieler treten per Room Code bei
            </h4>
          </div>
          <p className="text-white/45 text-sm leading-relaxed">
            Nach dem Start erhältst du einen teilbaren Room Code. Bis zu{" "}
            {data.maxPlayers} Spieler können der Lobby beitreten, bevor das
            Event startet.
          </p>
        </div>
      </div>

      {/* ── Right column: Vorschau ── */}
      <div
        style={{
          background: "rgba(10,12,30,0.97)",
          border: "1px solid rgba(236,72,153,0.2)",
          borderRadius: "16px",
        }}
        className="p-5 flex flex-col gap-5"
      >
        <div className="flex items-center gap-2">
          <Eye size={14} className="text-pink-400" />
          <h3 className="font-black text-white text-xs uppercase tracking-[0.18em]">
            Vorschau
          </h3>
        </div>

        {/* Podium illustration */}
        <div
          className="relative rounded-xl overflow-hidden flex-1 min-h-[180px]"
          style={{
            background:
              "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.08), rgba(34,211,238,0.06))",
            border: "1px solid rgba(139,92,246,0.15)",
          }}
        >
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-1/4 w-32 h-20 rounded-full bg-pink-500/15 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-24 h-16 rounded-full bg-purple-500/15 blur-3xl" />
          </div>
          {/* Podium */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-2 px-8">
            {/* 2nd */}
            <div className="w-1/4 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 mb-1 flex items-center justify-center text-white font-black text-sm border-2 border-white/10">
                2
              </div>
              <div
                className="w-full h-[60px] rounded-t-xl flex items-end justify-center pb-1.5"
                style={{
                  background:
                    "linear-gradient(to top, rgba(34,211,238,0.3), rgba(34,211,238,0.05))",
                  border: "1px solid rgba(34,211,238,0.2)",
                  borderBottom: "none",
                }}
              >
                <span className="text-cyan-400 font-black text-lg">2</span>
              </div>
            </div>
            {/* 1st */}
            <div className="w-1/4 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 mb-1 flex items-center justify-center text-white font-black text-lg border-2 border-white/20 ring-2 ring-yellow-400/30">
                1
              </div>
              <div
                className="w-full h-[88px] rounded-t-xl flex items-end justify-center pb-1.5"
                style={{
                  background:
                    "linear-gradient(to top, rgba(250,204,21,0.3), rgba(250,204,21,0.05))",
                  border: "1px solid rgba(250,204,21,0.25)",
                  borderBottom: "none",
                }}
              >
                <span className="text-yellow-400 font-black text-2xl">1</span>
              </div>
            </div>
            {/* 3rd */}
            <div className="w-1/4 flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 mb-1 flex items-center justify-center text-white font-black text-sm border-2 border-white/10">
                3
              </div>
              <div
                className="w-full h-[44px] rounded-t-xl flex items-end justify-center pb-1.5"
                style={{
                  background:
                    "linear-gradient(to top, rgba(139,92,246,0.3), rgba(139,92,246,0.05))",
                  border: "1px solid rgba(139,92,246,0.2)",
                  borderBottom: "none",
                }}
              >
                <span className="text-purple-400 font-black">3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          {[
            {
              icon: <Users size={14} className="text-cyan-400" />,
              label: "Max. Spieler",
              value: data.maxPlayers,
            },
            {
              icon: <Trophy size={14} className="text-yellow-400" />,
              label: "Wertungssystem",
              value: scoringLabels[data.scoringMode] || "Linear",
            },
            {
              icon: <Swords size={14} className="text-pink-400" />,
              label: "Tie-Breaker",
              value: tieLabels[data.tieRule] || data.tieRule,
            },
            {
              icon: <Gamepad2 size={14} className="text-purple-400" />,
              label: "Spiele",
              value: data.games.length,
            },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="flex-shrink-0">{icon}</span>
              <div>
                <div className="text-xs text-white/40">{label}</div>
                <div className="text-white font-semibold text-sm">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main CreatePage ───────────────────────────────────────────────────────
export default function CreatePage() {
  const navigate = useNavigate();
  const { code: editCode } = useParams(); // present when route is /edit/:code
  const isEditMode = Boolean(editCode);
  const { user } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingDraft, setFetchingDraft] = useState(isEditMode);
  const [apiError, setApiError] = useState("");

  const [eventData, setEventData] = useState({
    name: "",
    tieRule: "tiebreaker",
    scoringMode: "linear",
    scoringEnabled: true,
    hostParticipates: false,
    hostGhostMode: false,
    hostPlayerName: "",
    hideGamePlan: false,
    extraRules: {
      comebackPenalty: false,
      lastPlaceBonus: false,
      winStreakBonus: false,
      finalDoublePoints: false,
    },
    maxPlayers: 12,
  });
  const [games, setGames] = useState([]);

  useEffect(() => {
    document.title = isEditMode
      ? "Olympiade bearbeiten | Party Olympiade"
      : "Olympiade erstellen | Party Olympiade";
  }, [isEditMode]);

  // In edit mode, load existing draft data
  useEffect(() => {
    if (!isEditMode) return;
    api
      .get(`/olympics/${editCode}`)
      .then(({ data }) => {
        setEventData({
          name: data.name,
          tieRule: data.tieRule,
          scoringMode: data.scoringMode || "linear",
          scoringEnabled: data.scoringEnabled !== false,
          hostParticipates: !!data.hostParticipates,
          hostGhostMode: !!data.hostGhostMode,
          hostPlayerName: data.hostPlayerName || "",
          hideGamePlan: !!data.hideGamePlan,
          extraRules: data.extraRules,
          maxPlayers: data.maxPlayers,
        });
        setGames(data.games || []);
      })
      .catch(() => setApiError("Failed to load Olympic. Does it exist?"))
      .finally(() => setFetchingDraft(false));
  }, [editCode, isEditMode]);

  function canProceed() {
    if (step === 0) return eventData.name.trim().length > 0;
    if (step === 1) return games.length >= 1;
    return true;
  }

  const payload = {
    name: eventData.name,
    tieRule: eventData.tieRule,
    scoringMode: eventData.scoringMode,
    scoringEnabled: eventData.scoringEnabled,
    hostParticipates: eventData.hostParticipates,
    hostGhostMode: eventData.hostGhostMode,
    hostPlayerName: eventData.hostPlayerName,
    hideGamePlan: eventData.hideGamePlan,
    extraRules: eventData.extraRules,
    maxPlayers: eventData.maxPlayers,
    games,
  };

  async function save() {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setLoading(true);
    setApiError("");
    try {
      if (isEditMode) {
        await api.patch(`/olympics/${editCode}`, payload);
      } else {
        const { data } = await api.post("/olympics", payload);
        localStorage.setItem(`hostToken_${data.code}`, data.hostToken);
      }
      navigate("/profile");
    } catch (err) {
      setApiError(
        err.response?.data?.error ||
          (isEditMode
            ? "Speichern fehlgeschlagen."
            : "Erstellen fehlgeschlagen. Läuft der Server?"),
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveAndLaunch() {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setLoading(true);
    setApiError("");
    try {
      let code = editCode;
      if (!isEditMode) {
        const { data } = await api.post("/olympics", payload);
        localStorage.setItem(`hostToken_${data.code}`, data.hostToken);
        code = data.code;
      } else {
        await api.patch(`/olympics/${editCode}`, payload);
      }
      const { data } = await api.post(`/olympics/${code}/launch`);
      if (data?.hostToken) {
        localStorage.setItem(`hostToken_${code}`, data.hostToken);
      }
      navigate(`/room/${code}/host`);
    } catch (err) {
      setApiError(
        err.response?.data?.error ||
          "Starten fehlgeschlagen. Bitte versuche es erneut.",
      );
    } finally {
      setLoading(false);
    }
  }

  // Auth gate
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard className="max-w-sm w-full text-center py-8">
          <div className="mb-3 flex justify-center text-white/40">
            <Lock size={36} />
          </div>
          <h2 className="font-bold text-white mb-1">Anmeldung erforderlich</h2>
          <p className="text-sm text-muted mb-5">
            Du benötigst ein Konto, um Olympics zu erstellen
          </p>
          <button
            className="btn-primary w-full"
            onClick={() => setShowAuthModal(true)}
          >
            Anmelden / Registrieren
          </button>
        </GlassCard>
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </div>
    );
  }

  if (fetchingDraft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted animate-pulse">Lade Entwurf…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-60px)] flex flex-col">
      {/* ── Page header ── */}
      <div className="flex-grow relative flex items-end justify-center px-4 pt-8 pb-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-1">
            <Medal size={26} className="text-pink-400" />
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              <span className="text-white">LOBBY </span>
              <span
                style={{
                  background: "linear-gradient(90deg, #ec4899, #8b5cf6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {isEditMode ? "BEARBEITEN" : "ERSTELLEN"}
              </span>
            </h1>
          </div>
          <p className="text-muted text-sm">
            {isEditMode
              ? `Bearbeite: ${eventData.name || editCode}`
              : "Erstelle deine Olympiade und lade deine Freunde ein!"}
          </p>
        </div>
      </div>

      {/* ── Step progress ── */}
      <div className="flex items-start justify-center gap-0 px-4 mt-4 mb-12">
        {STEPS.map((label, i) => (
          <Fragment key={label}>
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all duration-300 ${
                  i === step
                    ? "border-pink-500 bg-pink-500/20 text-white"
                    : i < step
                      ? "border-purple-500/60 bg-purple-500/20 text-purple-400"
                      : "border-white/15 bg-white/[0.04] text-muted"
                }`}
                style={
                  i === step
                    ? { boxShadow: "0 0 18px rgba(236,72,153,0.4)" }
                    : undefined
                }
              >
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span
                className={`text-xs font-semibold whitespace-nowrap ${i === step ? "text-white" : "text-muted"}`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-16 sm:w-28 h-px mt-[18px] transition-colors duration-300 ${
                  i < step ? "bg-purple-500/50" : "bg-white/10"
                }`}
              />
            )}
          </Fragment>
        ))}
      </div>

      {/* ── Step content ── */}
      {step === 0 && (
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-[3fr_2fr] gap-5">
          {/* Form panel */}
          <div className="panel-glass rounded-2xl p-6">
            <div className="flex items-center gap-2.5 mb-6">
              <CalendarDays size={16} className="text-pink-500" />
              <h2 className="text-sm font-black uppercase tracking-[0.15em] text-white">
                Event Setup
              </h2>
            </div>
            <StepEventSetup
              data={eventData}
              onChange={(patch) => setEventData((d) => ({ ...d, ...patch }))}
            />
          </div>
          {/* Preview panel */}
          <PreviewPanel data={eventData} />
        </div>
      )}

      {step === 1 && (
        <div className="max-w-6xl mx-auto px-4">
          <StepGames games={games} onChange={setGames} />
        </div>
      )}

      {step === 2 && (
        <div className="max-w-6xl mx-auto px-4">
          <StepPreview data={{ ...eventData, games }} />
        </div>
      )}

      {apiError && (
        <div className="max-w-6xl mx-auto mt-4 px-4">
          <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400 text-sm">
            {apiError}
          </div>
        </div>
      )}

      {/* ── Sticky bottom nav ── */}
      <div
        className="px-4 pt-6 pb-4 z-10"
        style={{
          background:
            "linear-gradient(to top, rgba(7,7,20,0.97) 55%, transparent)",
        }}
      >
        <div className="flex items-center justify-between gap-4 max-w-6xl mx-auto pt-8 mb-3">
          <button
            className="btn-secondary !px-4 !py-2.5 !rounded-xl font-bold text-sm"
            onClick={() => navigate(isEditMode ? "/profile" : "/")}
          >
            <X size={14} /> Abbrechen
          </button>

          {/* Center: game count for step 2 */}
          {step === 1 && (
            <span className="text-white/40 text-sm font-semibold">
              {games.length}/20 Spiele ausgewählt
            </span>
          )}

          {step < STEPS.length - 1 ? (
            <div className="flex items-center gap-3">
              <button
                className="btn-secondary !px-4 !py-2.5 !rounded-xl font-bold text-sm"
                onClick={save}
                disabled={loading || !eventData.name.trim()}
                title="Als Entwurf speichern"
              >
                {loading ? (
                  "…"
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Save size={14} />
                    Entwurf
                  </span>
                )}
              </button>

              <div>
                {step > 0 ? (
                  <button
                    className="btn-secondary !px-4 !py-2.5 !rounded-xl font-bold text-sm"
                    onClick={() => setStep((s) => s - 1)}
                  >
                    <ArrowLeft size={14} /> Zurück
                  </button>
                ) : (
                  <div />
                )}
              </div>

              <button
                className="btn-primary !px-14 !py-3.5 !rounded-2xl font-black tracking-widest text-base"
                style={
                  canProceed()
                    ? { boxShadow: "0 0 40px rgba(236,72,153,0.4)" }
                    : undefined
                }
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
              >
                <span className="flex items-center gap-2">
                  WEITER <ArrowRight size={16} />
                </span>
              </button>
            </div>
          ) : isEditMode ? (
            <div className="flex items-center gap-3">
              <button
                className="btn-secondary !px-5 !py-3 !rounded-2xl font-bold text-sm"
                onClick={save}
                disabled={loading || !canProceed()}
              >
                {loading ? (
                  "…"
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Save size={14} />
                    Als Entwurf
                  </span>
                )}
              </button>
              <button
                className="btn-primary !px-7 !py-3.5 !rounded-2xl font-black text-base"
                style={
                  canProceed() && !loading
                    ? { boxShadow: "0 0 40px rgba(236,72,153,0.4)" }
                    : undefined
                }
                onClick={saveAndLaunch}
                disabled={loading || !canProceed()}
              >
                {loading ? (
                  "Startet…"
                ) : (
                  <span className="flex items-center gap-2">
                    <Rocket size={15} />
                    Starten
                  </span>
                )}
              </button>
            </div>
          ) : (
            /* New Olympic — two options: save draft or launch now */
            <div className="flex items-center gap-3">
              <button
                className="btn-secondary !px-5 !py-3 !rounded-2xl font-bold text-sm"
                onClick={save}
                disabled={loading || !canProceed()}
              >
                {loading ? (
                  "…"
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Save size={14} />
                    Als Entwurf
                  </span>
                )}
              </button>
              <button
                className="btn-primary !px-7 !py-3.5 !rounded-2xl font-black text-base"
                style={
                  canProceed() && !loading
                    ? { boxShadow: "0 0 40px rgba(236,72,153,0.4)" }
                    : undefined
                }
                onClick={saveAndLaunch}
                disabled={loading || !canProceed()}
              >
                {loading ? (
                  "Startet…"
                ) : (
                  <span className="flex items-center gap-2">
                    <Rocket size={15} />
                    Jetzt starten!
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 pb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-pink-500" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
