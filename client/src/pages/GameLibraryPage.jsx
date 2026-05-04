import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore.js";
import api from "../api/client.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import Input from "../components/ui/Input.jsx";
import {
  Pencil,
  Trash2,
  Clock,
  Wrench,
  Search,
  Plus,
  X,
  Swords,
  Users,
  Save,
  AlertTriangle,
  Beer,
  Shield,
  BookOpen,
  Gamepad2,
  CheckCircle,
  XCircle,
  Hourglass,
} from "lucide-react";

const DEFAULT_ADDONS = {
  drinkingGame: { enabled: false, rules: "" },
  timeLimit: 0,
  equipment: "",
  handicap: "",
  teamSize: 2,
};

const BLANK_FORM = {
  title: "",
  mode: "ffa",
  icon: "🎮",
  rules: "",
  estimatedMinutes: 0,
  addons: { ...DEFAULT_ADDONS },
};

function formatMinutes(min) {
  if (!min || min <= 0) return null;
  if (min < 60) return `~${min} Min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
}

function RulesDisplay({ rules }) {
  if (!rules) return null;
  const lines = rules
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length <= 1)
    return <p className="text-sm text-muted leading-relaxed">{rules}</p>;
  return (
    <ul className="space-y-1 text-sm text-muted">
      {lines.slice(0, 5).map((line, i) => (
        <li key={i} className="flex items-start gap-2">
          <span
            className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: "rgba(139,92,246,0.6)" }}
          />
          <span className="leading-relaxed">{line}</span>
        </li>
      ))}
      {lines.length > 5 && (
        <li className="text-white/25 text-xs pl-3.5">
          +{lines.length - 5} weitere Regeln
        </li>
      )}
    </ul>
  );
}

function StatusBadge({ status, rejectionReason }) {
  if (status === "approved") return null;
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-yellow-500/15 text-yellow-400">
        <Hourglass size={9} /> Ausstehend
      </span>
    );
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/15 text-red-400"
      title={rejectionReason || "Abgelehnt"}
    >
      <XCircle size={9} /> Abgelehnt
    </span>
  );
}

export default function GameLibraryPage() {
  const { user } = useAuthStore();

  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const [modeFilter, setModeFilter] = useState("all"); // "all" | "ffa" | "team"
  const [durationFilter, setDurationFilter] = useState("all"); // "all" | "quick" | "medium" | "long"
  const [sortBy, setSortBy] = useState("alpha"); // "alpha" | "newest" | "duration"

  function showDeleteError(msg) {
    setDeleteError(msg);
    setTimeout(() => setDeleteError(""), 4000);
  }

  useEffect(() => {
    document.title = "Spielebibliothek | Party Olympiade";
  }, []);

  useEffect(() => {
    fetchPresets();
  }, []);

  async function fetchPresets() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/game-presets");
      setPresets(data);
    } catch {
      setError("Bibliothek konnte nicht geladen werden. Läuft der Server?");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      setSubmitError("Titel ist erforderlich");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      if (editingPreset) {
        const { data } = await api.patch(
          `/game-presets/${editingPreset._id}`,
          form,
        );
        setPresets((prev) =>
          prev
            .map((p) => (p._id === data._id ? data : p))
            .sort((a, b) => a.title.localeCompare(b.title)),
        );
        setEditingPreset(null);
      } else {
        const { data } = await api.post("/game-presets", form);
        setPresets((prev) =>
          [...prev, data].sort((a, b) => a.title.localeCompare(b.title)),
        );
      }
      setForm({ ...BLANK_FORM });
      setShowForm(false);
    } catch (err) {
      setSubmitError(
        err.response?.data?.error ||
          (editingPreset
            ? "Aktualisierung fehlgeschlagen"
            : "Einreichung fehlgeschlagen"),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(preset) {
    setForm({
      title: preset.title,
      mode: preset.mode,
      icon: preset.icon,
      rules: preset.rules || "",
      estimatedMinutes: preset.estimatedMinutes || 0,
      addons: preset.addons || { ...DEFAULT_ADDONS },
    });
    setEditingPreset(preset);
    setShowForm(true);
    setSubmitError("");
  }

  async function handleDelete(id) {
    setDeleting(id);
    setConfirmDelete(null);
    try {
      await api.delete(`/game-presets/${id}`);
      setPresets((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      showDeleteError(err.response?.data?.error || "Löschen fehlgeschlagen");
    } finally {
      setDeleting(null);
    }
  }

  const filtered = presets
    .filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        p.title.toLowerCase().includes(q) ||
        p.createdByUsername.toLowerCase().includes(q);
      const matchesMode = modeFilter === "all" || p.mode === modeFilter;
      const mins = p.estimatedMinutes || 0;
      const matchesDuration =
        durationFilter === "all" ||
        (durationFilter === "quick" && mins > 0 && mins <= 15) ||
        (durationFilter === "medium" && mins > 15 && mins <= 45) ||
        (durationFilter === "long" && mins > 45) ||
        (durationFilter === "unset" && mins === 0);
      return matchesSearch && matchesMode && matchesDuration;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "duration") {
        const am = a.estimatedMinutes || Infinity;
        const bm = b.estimatedMinutes || Infinity;
        return am - bm;
      }
      return a.title.localeCompare(b.title);
    });

  const showGrouped = sortBy === "alpha";
  const grouped = showGrouped
    ? filtered.reduce((acc, p) => {
        const letter = p.title[0]?.toUpperCase() || "#";
        if (!acc[letter]) acc[letter] = [];
        acc[letter].push(p);
        return acc;
      }, {})
    : {};
  const letters = Object.keys(grouped).sort();

  return (
    <div className="min-h-screen px-4 py-10">
      {deleteError && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-pink-600/90 backdrop-blur-sm text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-2xl border border-pink-400/30 flex items-center gap-2">
            <AlertTriangle size={14} />
            {deleteError}
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3"><BookOpen size={28} className="text-purple-400" /> Game Library</h1>
            <p className="text-sm text-muted mt-1">
              Community Spiel-Vorlagen — direkt in deine Olympiade
            </p>
          </div>
          {user ? (
            <button
              className="flex items-center gap-2 btn-primary !py-2 !px-4 text-sm shrink-0"
              onClick={() => {
                if (showForm && editingPreset) {
                  setEditingPreset(null);
                  setForm({ ...BLANK_FORM });
                  setShowForm(false);
                } else {
                  setEditingPreset(null);
                  setForm({ ...BLANK_FORM });
                  setShowForm((s) => !s);
                }
              }}
            >
              {showForm ? (
                <>
                  <X size={14} /> Abbrechen
                </>
              ) : (
                <>
                  <Plus size={14} /> {(user?.role === "moderator" || user?.role === "admin") ? "Preset hinzufügen" : "Preset einreichen"}
                </>
              )}
            </button>
          ) : (
            <p className="text-xs text-muted bg-white/5 rounded-xl px-3 py-2">
              Einloggen um Presets einzureichen
            </p>
          )}
        </div>

        {/* Submit / Edit form */}
        {showForm && user && (
          <div
            className="rounded-2xl p-6 space-y-5"
            style={{
              background: "rgba(10,12,30,0.97)",
              border: "1px solid rgba(139,92,246,0.35)",
              boxShadow: "0 0 32px rgba(139,92,246,0.08)",
            }}
          >
            <div className="flex items-center gap-2">
              {editingPreset ? (
                <Pencil size={16} className="text-purple-400" />
              ) : (
                <Plus size={16} className="text-purple-400" />
              )}
              <h2 className="font-bold text-white">
                {editingPreset ? "Preset bearbeiten" : "Neues Preset"}
              </h2>
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
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors flex items-center justify-center gap-2"
                  style={
                    form.mode === m
                      ? {
                          borderColor: "rgba(139,92,246,0.6)",
                          background: "rgba(139,92,246,0.15)",
                          color: "#c4b5fd",
                        }
                      : {
                          borderColor: "rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.45)",
                        }
                  }
                >
                  {m === "ffa" ? (
                    <>
                      <Swords size={14} /> FFA
                    </>
                  ) : (
                    <>
                      <Users size={14} /> Teams
                    </>
                  )}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider font-bold mb-1.5">
                Regeln / Beschreibung
              </label>
              <textarea
                className="textarea-field h-32"
                placeholder={
                  "Regeln (optional, max 1000 Zeichen)\n\nTipp: Jede neue Zeile wird ein Bullet Point"
                }
                maxLength={1000}
                value={form.rules}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rules: e.target.value }))
                }
              />
              <p className="text-[10px] text-white/25 mt-1">
                Eine Zeile pro Regel → wird als Aufzählungspunkt angezeigt
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs text-white/50 uppercase tracking-wider font-bold mb-1.5">
                  <Clock size={11} /> Geschätzte Dauer (Min)
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
              <div>
                <label className="flex items-center gap-1.5 text-xs text-white/50 uppercase tracking-wider font-bold mb-1.5">
                  <Clock size={11} /> Zeitlimit im Spiel (0=∞)
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
              <div className="col-span-2">
                <label className="flex items-center gap-1.5 text-xs text-white/50 uppercase tracking-wider font-bold mb-1.5">
                  <Wrench size={11} /> Equipment
                </label>
                <input
                  className="input-field"
                  placeholder="z.B. Controller, 2 Bildschirme"
                  maxLength={200}
                  value={form.addons.equipment}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      addons: { ...f.addons, equipment: e.target.value },
                    }))
                  }
                />
              </div>
            </div>

            {submitError && (
              <p className="text-pink-400 text-sm flex items-center gap-1.5">
                <AlertTriangle size={13} /> {submitError}
              </p>
            )}

            <button
              className="btn-primary w-full flex items-center justify-center gap-2"
              onClick={handleSubmit}
              disabled={submitting || !form.title.trim()}
            >
              <Save size={14} />
              {submitting
                ? editingPreset
                  ? "Speichern…"
                  : "Einreichen…"
                : editingPreset
                  ? "Änderungen speichern"
                  : (user?.role === "moderator" || user?.role === "admin")
                    ? "In Bibliothek hinzufügen"
                    : "Zur Überprüfung einreichen"}
            </button>
          </div>
        )}

        {/* Search + filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              className="input-field w-full pl-10"
              placeholder="Spiele oder Ersteller suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Mode filter */}
            <div className="flex items-center gap-1 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              {[
                { value: "all", label: "Alle Modi" },
                { value: "ffa", label: "FFA" },
                { value: "team", label: "Teams" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setModeFilter(value)}
                  className="px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={
                    modeFilter === value
                      ? { background: "rgba(139,92,246,0.25)", color: "#c4b5fd" }
                      : { color: "rgba(255,255,255,0.35)" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Duration filter */}
            <div className="flex items-center gap-1 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              {[
                { value: "all", label: "Alle Zeiten" },
                { value: "quick", label: "≤15 Min" },
                { value: "medium", label: "15–45 Min" },
                { value: "long", label: ">45 Min" },
                { value: "unset", label: "Keine Angabe" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setDurationFilter(value)}
                  className="px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={
                    durationFilter === value
                      ? { background: "rgba(34,211,238,0.15)", color: "#67e8f9" }
                      : { color: "rgba(255,255,255,0.35)" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1 rounded-xl overflow-hidden ml-auto" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              {[
                { value: "alpha", label: "A–Z" },
                { value: "newest", label: "Neueste" },
                { value: "duration", label: "Kürzeste" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSortBy(value)}
                  className="px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={
                    sortBy === value
                      ? { background: "rgba(236,72,153,0.15)", color: "#f472b6" }
                      : { color: "rgba(255,255,255,0.35)" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && (
          <p className="text-muted text-sm text-center py-10 animate-pulse">
            Bibliothek lädt…
          </p>
        )}
        {error && (
          <p className="text-pink-400 text-sm bg-pink-500/10 border border-pink-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </p>
        )}

        {!loading && filtered.length === 0 && !error && (
          <GlassCard className="text-center py-10">
            <Gamepad2 size={40} className="mx-auto mb-3 text-white/20" />
            <p className="text-white font-semibold mb-1">
              {search || modeFilter !== "all" || durationFilter !== "all"
                ? "Keine Ergebnisse für diese Filter"
                : "Bibliothek ist leer"}
            </p>
            {search || modeFilter !== "all" || durationFilter !== "all" ? (
              <button
                className="text-sm text-purple-400 hover:text-purple-300 mt-1 transition-colors"
                onClick={() => { setSearch(""); setModeFilter("all"); setDurationFilter("all"); }}
              >
                Filter zurücksetzen
              </button>
            ) : user && (
              <p className="text-sm text-muted">
                Sei der Erste und reiche ein Preset ein!
              </p>
            )}
          </GlassCard>
        )}

        {/* Flat list (non-alpha sort) */}
        {!loading && !showGrouped && (
          <div className="space-y-3">
            {filtered.map((preset) => {
              const isOwner = user && String(preset.createdBy) === user.id;
              return (
                    <div
                      key={preset._id}
                      className="rounded-2xl overflow-hidden transition-all hover:border-white/10"
                      style={{
                        background: "rgba(10,12,30,0.95)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                          style={{
                            background: "rgba(139,92,246,0.15)",
                            border: "1px solid rgba(139,92,246,0.2)",
                          }}
                        >
                          {preset.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-base leading-tight">
                            {preset.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md"
                              style={
                                preset.mode === "ffa"
                                  ? { background: "rgba(236,72,153,0.15)", color: "#f472b6" }
                                  : { background: "rgba(139,92,246,0.18)", color: "#a78bfa" }
                              }
                            >
                              {preset.mode === "ffa" ? <Swords size={10} /> : <Users size={10} />}
                              {preset.mode === "ffa" ? "FFA" : "Teams"}
                            </span>
                            {preset.addons?.drinkingGame?.enabled && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-400">
                                <Beer size={10} /> Trinkspiel
                              </span>
                            )}
                            {preset.estimatedMinutes > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-400/70">
                                <Clock size={10} /> {formatMinutes(preset.estimatedMinutes)}
                              </span>
                            )}
                            <StatusBadge status={preset.status} rejectionReason={preset.rejectionReason} />
                          </div>
                        </div>
                        {(isOwner || (user?.role === "moderator" || user?.role === "admin")) && (
                          <div className="flex items-center gap-1 shrink-0">
                            {isOwner && (
                              <button className="p-2 rounded-lg text-purple-400/50 hover:text-purple-400 hover:bg-purple-500/15 transition-colors" onClick={() => startEdit(preset)} title="Bearbeiten">
                                <Pencil size={15} />
                              </button>
                            )}
                            {confirmDelete === preset._id ? (
                              <div className="flex items-center gap-1">
                                <button className="text-xs px-2.5 py-1.5 rounded-lg bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 transition-colors font-semibold" onClick={() => handleDelete(preset._id)} disabled={deleting === preset._id}>
                                  {deleting === preset._id ? "…" : "Löschen"}
                                </button>
                                <button className="p-1.5 rounded-lg bg-white/5 text-muted hover:bg-white/10 transition-colors" onClick={() => setConfirmDelete(null)}>
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <button className="p-2 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-colors" onClick={() => setConfirmDelete(preset._id)} title="Löschen">
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {preset.status === "rejected" && preset.rejectionReason && (isOwner || user?.role === "moderator" || user?.role === "admin") && (
                        <div className="px-4 pb-2">
                          <p className="text-xs text-red-400/80 bg-red-500/10 rounded-lg px-3 py-2">
                            <span className="font-bold">Ablehnungsgrund:</span> {preset.rejectionReason}
                          </p>
                        </div>
                      )}
                      {preset.rules && <div className="px-4 pb-3"><RulesDisplay rules={preset.rules} /></div>}
                      <div className="flex items-center gap-4 px-4 py-2.5 flex-wrap" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.12)" }}>
                        <span className="text-xs text-white/25">von {preset.createdByUsername}</span>
                        {preset.addons?.equipment && <span className="inline-flex items-center gap-1 text-xs text-white/30"><Wrench size={10} /> {preset.addons.equipment}</span>}
                        {preset.addons?.timeLimit > 0 && <span className="inline-flex items-center gap-1 text-xs text-white/30"><Shield size={10} /> {preset.addons.timeLimit} min Limit</span>}
                      </div>
                    </div>
              );
            })}
          </div>
        )}

        {/* Alphabetical groups */}
        {!loading && showGrouped &&
          letters.map((letter) => (
            <div key={letter}>
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="text-sm font-black w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white"
                  style={{
                    background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                  }}
                >
                  {letter}
                </span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              <div className="space-y-3">
                {grouped[letter].map((preset) => {
                  const isOwner = user && String(preset.createdBy) === user.id;
                  return (
                    <div
                      key={preset._id}
                      className="rounded-2xl overflow-hidden transition-all hover:border-white/10"
                      style={{
                        background: "rgba(10,12,30,0.95)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      {/* Card header */}
                      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                          style={{
                            background: "rgba(139,92,246,0.15)",
                            border: "1px solid rgba(139,92,246,0.2)",
                          }}
                        >
                          {preset.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-base leading-tight">
                            {preset.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md"
                              style={
                                preset.mode === "ffa"
                                  ? {
                                      background: "rgba(236,72,153,0.15)",
                                      color: "#f472b6",
                                    }
                                  : {
                                      background: "rgba(139,92,246,0.18)",
                                      color: "#a78bfa",
                                    }
                              }
                            >
                              {preset.mode === "ffa" ? (
                                <Swords size={10} />
                              ) : (
                                <Users size={10} />
                              )}
                              {preset.mode === "ffa" ? "FFA" : "Teams"}
                            </span>
                            {preset.addons?.drinkingGame?.enabled && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-400">
                                <Beer size={10} /> Trinkspiel
                              </span>
                            )}
                            {preset.estimatedMinutes > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-400/70">
                                <Clock size={10} />{" "}
                                {formatMinutes(preset.estimatedMinutes)}
                              </span>
                            )}
                            <StatusBadge status={preset.status} rejectionReason={preset.rejectionReason} />
                          </div>
                        </div>
                        {/* Owner / mod action buttons */}
                        {(isOwner || user?.role === "moderator" || user?.role === "admin") && (
                          <div className="flex items-center gap-1 shrink-0">
                            {isOwner && (
                              <button
                                className="p-2 rounded-lg text-purple-400/50 hover:text-purple-400 hover:bg-purple-500/15 transition-colors"
                                onClick={() => startEdit(preset)}
                                title="Bearbeiten"
                              >
                                <Pencil size={15} />
                              </button>
                            )}
                            {confirmDelete === preset._id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  className="text-xs px-2.5 py-1.5 rounded-lg bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 transition-colors font-semibold"
                                  onClick={() => handleDelete(preset._id)}
                                  disabled={deleting === preset._id}
                                >
                                  {deleting === preset._id ? "…" : "Löschen"}
                                </button>
                                <button
                                  className="p-1.5 rounded-lg bg-white/5 text-muted hover:bg-white/10 transition-colors"
                                  onClick={() => setConfirmDelete(null)}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <button
                                className="p-2 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                onClick={() => setConfirmDelete(preset._id)}
                                title="Löschen"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Rejection reason */}
                      {preset.status === "rejected" && preset.rejectionReason && (isOwner || user?.role === "moderator" || user?.role === "admin") && (
                        <div className="px-4 pb-2">
                          <p className="text-xs text-red-400/80 bg-red-500/10 rounded-lg px-3 py-2">
                            <span className="font-bold">Ablehnungsgrund:</span> {preset.rejectionReason}
                          </p>
                        </div>
                      )}

                      {/* Rules bullet list */}
                      {preset.rules && (
                        <div className="px-4 pb-3">
                          <RulesDisplay rules={preset.rules} />
                        </div>
                      )}

                      {/* Footer meta */}
                      <div
                        className="flex items-center gap-4 px-4 py-2.5 flex-wrap"
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.04)",
                          background: "rgba(0,0,0,0.12)",
                        }}
                      >
                        <span className="text-xs text-white/25">
                          von {preset.createdByUsername}
                        </span>
                        {preset.addons?.equipment && (
                          <span className="inline-flex items-center gap-1 text-xs text-white/30">
                            <Wrench size={10} /> {preset.addons.equipment}
                          </span>
                        )}
                        {preset.addons?.timeLimit > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-white/30">
                            <Shield size={10} /> {preset.addons.timeLimit} min
                            Limit
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

        {!loading && presets.length > 0 && (
          <p className="text-center text-xs text-white/20 pb-4">
            {filtered.length !== presets.length
              ? `${filtered.length} von ${presets.length} Preset${presets.length !== 1 ? "s" : ""}`
              : `${presets.length} Preset${presets.length !== 1 ? "s" : ""} in der Bibliothek`}
          </p>
        )}
      </div>
    </div>
  );
}
