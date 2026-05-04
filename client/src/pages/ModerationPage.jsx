import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";
import api from "../api/client.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Swords,
  Users,
  Beer,
  Wrench,
  AlertTriangle,
  Hourglass,
  Gamepad2,
} from "lucide-react";

function formatMinutes(min) {
  if (!min || min <= 0) return null;
  if (min < 60) return `~${min} Min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
}

export default function ModerationPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState(null);
  const [actionError, setActionError] = useState("");

  const [rejectModal, setRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    document.title = "Moderation | Party Olympiade";
  }, []);

  const isMod = user?.role === "moderator" || user?.role === "admin";

  useEffect(() => {
    if (!isMod) return;
    fetchPending();
  }, [isMod]);

  async function fetchPending() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/game-presets/pending");
      setPresets(data);
    } catch {
      setError("Moderation-Queue konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  async function approve(id) {
    setActing(id);
    setActionError("");
    try {
      await api.patch(`/game-presets/${id}/status`, { status: "approved" });
      setPresets((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setActionError(err.response?.data?.error || "Aktion fehlgeschlagen");
    } finally {
      setActing(null);
    }
  }

  async function reject(id) {
    setActing(id);
    setActionError("");
    try {
      await api.patch(`/game-presets/${id}/status`, {
        status: "rejected",
        rejectionReason: rejectionReason.trim(),
      });
      setPresets((prev) => prev.filter((p) => p._id !== id));
      setRejectModal(null);
      setRejectionReason("");
    } catch (err) {
      setActionError(err.response?.data?.error || "Aktion fehlgeschlagen");
    } finally {
      setActing(null);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard className="max-w-sm w-full text-center py-8">
          <Shield size={36} className="mx-auto mb-3 text-white/30" />
          <p className="text-white font-bold mb-1">Anmeldung erforderlich</p>
          <p className="text-sm text-muted">Du musst angemeldet sein.</p>
        </GlassCard>
      </div>
    );
  }

  if (!isMod) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard className="max-w-sm w-full text-center py-8">
          <Shield size={36} className="mx-auto mb-3 text-pink-400/60" />
          <p className="text-white font-bold mb-1">Kein Zugriff</p>
          <p className="text-sm text-muted">Diese Seite ist nur für Moderatoren.</p>
          <button className="btn-secondary mt-5 text-sm" onClick={() => navigate("/")}>
            Zurück zur Startseite
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10">
      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div
            className="w-full max-w-md rounded-2xl p-6 space-y-4"
            style={{
              background: "rgba(10,12,30,0.98)",
              border: "1px solid rgba(236,72,153,0.3)",
              boxShadow: "0 0 40px rgba(236,72,153,0.12)",
            }}
          >
            <h3 className="text-white font-bold text-lg">Preset ablehnen</h3>
            <p className="text-sm text-muted">
              Ablehnungsgrund (optional — wird dem Ersteller angezeigt):
            </p>
            <textarea
              className="textarea-field h-24 w-full"
              placeholder="z.B. Zu vage beschrieben, bitte Regeln präzisieren."
              maxLength={300}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            {actionError && (
              <p className="text-pink-400 text-sm flex items-center gap-1.5">
                <AlertTriangle size={13} /> {actionError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                className="btn-secondary flex-1 text-sm"
                onClick={() => {
                  setRejectModal(null);
                  setRejectionReason("");
                }}
              >
                Abbrechen
              </button>
              <button
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-pink-600/30 text-pink-300 border border-pink-500/40 hover:bg-pink-600/50 transition-colors"
                onClick={() => reject(rejectModal)}
                disabled={acting === rejectModal}
              >
                {acting === rejectModal ? "…" : "Ablehnen"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Shield size={28} className="text-purple-400" /> Moderation
          </h1>
          <p className="text-sm text-muted mt-1">
            Eingereichte Presets prüfen und freigeben
          </p>
        </div>

        {loading && (
          <p className="text-muted text-sm text-center py-10 animate-pulse">
            Lade ausstehende Presets…
          </p>
        )}

        {error && (
          <p className="text-pink-400 text-sm bg-pink-500/10 border border-pink-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </p>
        )}

        {!loading && presets.length === 0 && !error && (
          <GlassCard className="text-center py-12">
            <CheckCircle size={40} className="mx-auto mb-3 text-green-400/40" />
            <p className="text-white font-semibold mb-1">Alles erledigt!</p>
            <p className="text-sm text-muted">Keine ausstehenden Presets.</p>
          </GlassCard>
        )}

        {!loading && (
          <div className="space-y-4">
            {presets.map((preset) => (
              <div
                key={preset._id}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(10,12,30,0.95)",
                  border: "1px solid rgba(234,179,8,0.2)",
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
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-yellow-500/15 text-yellow-400">
                        <Hourglass size={9} /> Ausstehend
                      </span>
                    </div>
                  </div>
                </div>

                {preset.rules && (
                  <div className="px-4 pb-3">
                    <p className="text-sm text-muted whitespace-pre-line line-clamp-4">
                      {preset.rules}
                    </p>
                  </div>
                )}

                {preset.addons?.equipment && (
                  <div className="px-4 pb-2">
                    <span className="inline-flex items-center gap-1 text-xs text-white/40">
                      <Wrench size={10} /> {preset.addons.equipment}
                    </span>
                  </div>
                )}

                <div
                  className="flex items-center justify-between px-4 py-3 gap-3"
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.04)",
                    background: "rgba(0,0,0,0.12)",
                  }}
                >
                  <span className="text-xs text-white/30">
                    von <span className="text-white/60">{preset.createdByUsername}</span>
                    {" · "}
                    {new Date(preset.createdAt).toLocaleDateString("de-DE")}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-pink-600/20 text-pink-300 border border-pink-500/30 hover:bg-pink-600/35 transition-colors"
                      onClick={() => {
                        setRejectModal(preset._id);
                        setRejectionReason("");
                        setActionError("");
                      }}
                      disabled={acting === preset._id}
                    >
                      <XCircle size={14} /> Ablehnen
                    </button>
                    <button
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-green-600/20 text-green-300 border border-green-500/30 hover:bg-green-600/35 transition-colors"
                      onClick={() => approve(preset._id)}
                      disabled={acting === preset._id}
                    >
                      {acting === preset._id ? (
                        "…"
                      ) : (
                        <>
                          <CheckCircle size={14} /> Freigeben
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && presets.length > 0 && (
          <p className="text-center text-xs text-white/20 pb-4">
            {presets.length} ausstehende{presets.length !== 1 ? "s" : ""} Preset{presets.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
