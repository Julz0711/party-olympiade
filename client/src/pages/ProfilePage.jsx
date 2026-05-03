import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";
import api from "../api/client.js";
import { AVATAR_GRADIENTS } from "../components/Header.jsx";
import {
  Pencil,
  Save,
  Trash2,
  Trophy,
  Crown,
  Gamepad2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ExternalLink,
  Medal,
  Check,
  X,
  Brain,
  Crosshair,
  Car,
  PartyPopper,
  Ghost,
  Star,
  Share2,
  LogOut,
  Camera,
  ImageOff,
} from "lucide-react";

async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_W = 700;
      const MAX_H = 320;
      const scale = Math.min(1, MAX_W / img.width, MAX_H / img.height);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

const STATUS_STYLES = {
  draft: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  lobby: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
  active: "bg-green-500/20 text-green-400 border border-green-500/30",
  finished: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
};

const STATUS_LABEL = {
  draft: "Draft",
  lobby: "Lobby",
  active: "Aktiv",
  finished: "Beendet",
};

const CARD_CATEGORIES = [
  { key: "iq", label: "IQ", Icon: Brain, color: "#22d3ee" },
  { key: "shooter", label: "Shooter", Icon: Crosshair, color: "#ec4899" },
  { key: "racing", label: "Racing", Icon: Car, color: "#f59e0b" },
  { key: "party", label: "Party", Icon: PartyPopper, color: "#a78bfa" },
  { key: "troll", label: "Troll", Icon: Ghost, color: "#4ade80" },
];

const TOTAL_POINTS = 15;

function StarRating({ value, onChange, maxValue = 5, size = 16 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        const clickable = !!onChange && (filled || star <= maxValue);
        return (
          <button
            key={star}
            type="button"
            disabled={!clickable}
            onClick={() => {
              if (!onChange) return;
              // click same star → decrease by 1, otherwise set
              onChange(star === value ? Math.max(0, star - 1) : star);
            }}
            className="transition-colors disabled:opacity-25"
            style={{ cursor: clickable ? "pointer" : "default" }}
          >
            <Star
              size={size}
              fill={filled ? "currentColor" : "none"}
              className={filled ? "text-yellow-400" : "text-white/20"}
            />
          </button>
        );
      })}
    </div>
  );
}

function TradingCard({
  user,
  editing,
  nameInput,
  setNameInput,
  selectedColor,
  setSelectedColor,
  cardValues,
  onOpenEdit,
  onSave,
  onCancel,
  onCardChange,
  saving,
  profileError,
  logout,
  artImage,
  onUploadImage,
  onRemoveImage,
}) {
  const displayCard = editing ? cardValues : user.playerCard;
  const hasCard = !!user.playerCard;

  const pointsUsed = cardValues
    ? CARD_CATEGORIES.reduce((sum, { key }) => sum + (Number(cardValues[key]) || 0), 0)
    : 0;
  const remaining = TOTAL_POINTS - pointsUsed;
  const canSave =
    !editing ||
    (nameInput.trim().length >= 2 &&
      (!cardValues || pointsUsed === TOTAL_POINTS));

  const avatarGrad = AVATAR_GRADIENTS[selectedColor] || AVATAR_GRADIENTS[0];

  return (
    <div
      style={{
        background: avatarGrad,
        padding: "1.5px",
        borderRadius: "24px",
        boxShadow: "0 0 80px rgba(0,0,0,0.4), 0 0 40px rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          background: "linear-gradient(165deg, #08061a 0%, #0d082a 100%)",
          borderRadius: "23px",
          overflow: "hidden",
        }}
      >
        {/* Top label bar */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{
            background: "rgba(139,92,246,0.08)",
            borderBottom: "1px solid rgba(139,92,246,0.15)",
          }}
        >
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400">
            ✦ Player Card
          </span>
          <div className="flex items-center gap-1.5">
            {!editing && (
              <button
                className="p-1.5 rounded-lg text-white/25 hover:text-white/60 transition-colors"
                title="Profil-Link kopieren"
                onClick={() => {
                  navigator.clipboard.writeText(
                    window.location.origin + "/user/" + encodeURIComponent(user.username),
                  );
                }}
              >
                <Share2 size={13} />
              </button>
            )}
            {!editing ? (
              <button
                className="p-1.5 rounded-lg text-white/25 hover:text-purple-400 transition-colors"
                title="Bearbeiten"
                onClick={onOpenEdit}
              >
                <Pencil size={13} />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {cardValues && (
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-lg"
                    style={{
                      background:
                        remaining === 0
                          ? "rgba(34,197,94,0.15)"
                          : remaining > 0
                            ? "rgba(250,204,21,0.15)"
                            : "rgba(239,68,68,0.15)",
                      color:
                        remaining === 0
                          ? "#4ade80"
                          : remaining > 0
                            ? "#facc15"
                            : "#f87171",
                      border: `1px solid ${remaining === 0 ? "rgba(34,197,94,0.3)" : remaining > 0 ? "rgba(250,204,21,0.3)" : "rgba(239,68,68,0.3)"}`,
                    }}
                  >
                    {remaining > 0 ? `+${remaining}` : remaining} Pts
                  </span>
                )}
                <button
                  className="p-1.5 rounded-lg text-white/30 hover:text-white/70 transition-colors"
                  onClick={onCancel}
                  title="Abbrechen"
                >
                  <X size={13} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Art section */}
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{
            height: "220px",
            background: artImage ? "transparent" : avatarGrad,
          }}
        >
          {artImage ? (
            <img
              src={artImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <>
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(5,3,15,0.35) 0%, rgba(5,3,15,0.5) 100%)",
                }}
              />
              <div
                className="relative z-10 rounded-2xl flex items-center justify-center font-black text-white"
                style={{
                  width: 80,
                  height: 80,
                  background: "rgba(0,0,0,0.3)",
                  backdropFilter: "blur(8px)",
                  border: "2px solid rgba(255,255,255,0.25)",
                  fontSize: 32,
                  textShadow: "0 2px 12px rgba(0,0,0,0.5)",
                }}
              >
                {user.username[0].toUpperCase()}
              </div>
            </>
          )}

          {/* Edit overlay */}
          {editing && (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center gap-3"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
            >
              <label
                className="flex items-center gap-1.5 text-xs font-bold text-white cursor-pointer px-3 py-2 rounded-xl transition-all hover:bg-white/10"
                style={{ border: "1px solid rgba(255,255,255,0.25)" }}
              >
                <Camera size={14} />
                {artImage ? "Ändern" : "Hochladen"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) onUploadImage(file);
                    e.target.value = "";
                  }}
                />
              </label>
              {artImage && (
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs font-bold text-pink-300 px-3 py-2 rounded-xl transition-all hover:bg-pink-500/10"
                  style={{ border: "1px solid rgba(236,72,153,0.35)" }}
                  onClick={onRemoveImage}
                >
                  <ImageOff size={14} />
                  Entfernen
                </button>
              )}
            </div>
          )}
        </div>

        {/* Name + color picker */}
        <div className="px-5 pt-4 pb-4 text-center">
          {editing ? (
            <input
              className="w-full bg-white/5 border border-purple-500/40 rounded-xl px-3 py-2 text-white font-bold text-lg text-center focus:outline-none focus:border-purple-400 mb-3"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={30}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Escape") onCancel();
              }}
            />
          ) : (
            <h1 className="text-xl font-black text-white mb-3">
              {user.username}
            </h1>
          )}

          {/* Color picker — only interactive in edit mode */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {AVATAR_GRADIENTS.map((g, i) => (
              <button
                key={i}
                title={editing ? `Farbe ${i + 1}` : undefined}
                disabled={!editing}
                onClick={() => editing && setSelectedColor(i)}
                className="transition-all"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: g,
                  outline:
                    selectedColor === i
                      ? "2px solid white"
                      : "2px solid transparent",
                  outlineOffset: 2,
                  opacity: editing ? 1 : selectedColor === i ? 0.7 : 0.25,
                  cursor: editing ? "pointer" : "default",
                }}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div
          className="mx-5"
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(139,92,246,0.4), rgba(236,72,153,0.3), transparent)",
          }}
        />

        {/* Stats section */}
        <div className="px-5 pt-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">
              Stats
            </span>
            {!editing && !hasCard && (
              <button
                className="text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors"
                onClick={onOpenEdit}
              >
                + Karte erstellen
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {CARD_CATEGORIES.map(({ key, label, Icon, color }) => {
              const val = displayCard ? (Number(displayCard[key]) || 0) : 0;
              const maxVal = editing && cardValues
                ? val + Math.max(0, remaining)
                : 5;
              return (
                <div key={key} className="flex items-center gap-3">
                  <Icon size={13} style={{ color, flexShrink: 0 }} />
                  <span className="text-xs font-semibold text-white/50 w-14 flex-shrink-0">
                    {label}
                  </span>
                  <div className="flex-1">
                    <StarRating
                      value={val}
                      onChange={
                        editing && cardValues
                          ? (v) => {
                              onCardChange({ ...cardValues, [key]: v });
                            }
                          : undefined
                      }
                      maxValue={Math.min(5, maxVal)}
                      size={15}
                    />
                  </div>
                  <span className="text-[11px] font-black text-white/25 w-6 text-right">
                    {val}/5
                  </span>
                </div>
              );
            })}
          </div>

          {/* Edit mode save/cancel */}
          {editing && (
            <div className="flex gap-2 mt-5">
              <button
                className="btn-primary flex-1 !py-2 text-sm flex items-center justify-center gap-1.5"
                disabled={!canSave || saving}
                onClick={onSave}
              >
                <Save size={13} />
                {saving ? "Speichern…" : "Speichern"}
              </button>
              <button
                className="btn-ghost !py-2 !px-3 text-sm text-white/50"
                onClick={onCancel}
                disabled={saving}
              >
                Abbrechen
              </button>
            </div>
          )}

          {profileError && (
            <p className="text-xs text-pink-400 mt-2 text-center">
              {profileError}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(0,0,0,0.2)",
          }}
        >
          <span className="text-[11px] text-white/25 truncate max-w-[60%]">
            {user.email}
          </span>
          <button
            className="flex items-center gap-1.5 text-[11px] text-pink-400/60 hover:text-pink-400 transition-colors"
            onClick={logout}
          >
            <LogOut size={11} />
            Abmelden
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuthStore();

  const [olympics, setOlympics] = useState([]);
  const [participated, setParticipated] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState("");
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [selectedColor, setSelectedColor] = useState(user?.avatarColor ?? 0);
  const [cardValues, setCardValues] = useState(null);
  const [cardImagePreview, setCardImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  useEffect(() => {
    document.title = "Profil | Party Olympiade";
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    setSelectedColor(user.avatarColor ?? 0);
    Promise.all([
      api
        .get("/olympics/mine")
        .then(({ data }) => setOlympics(data))
        .catch(() => {}),
      api
        .get("/olympics/participated")
        .then(({ data }) => setParticipated(data))
        .catch(() => {}),
    ]).finally(() => setDataLoading(false));
  }, [user]); // eslint-disable-line

  const activeOlympics = useMemo(() => {
    const hosted = olympics
      .filter((o) => o.status === "lobby" || o.status === "active")
      .map((o) => ({ ...o, role: "host" }));
    const joined = participated
      .filter((o) => o.status === "lobby" || o.status === "active")
      .map((o) => ({ ...o, role: "participant" }));
    return [...hosted, ...joined];
  }, [olympics, participated]);

  const history = useMemo(() => {
    const hosted = olympics
      .filter((o) => o.status === "finished")
      .map((o) => ({ ...o, role: "host" }));
    const joined = participated
      .filter((o) => o.status === "finished")
      .map((o) => ({ ...o, role: "participant" }));
    return [...hosted, ...joined].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    );
  }, [olympics, participated]);

  const historyToShow = historyExpanded ? history : history.slice(0, 3);

  function openEdit() {
    setNameInput(user.username);
    setSelectedColor(user.avatarColor ?? 0);
    // Only pick known category keys (avoids _id / __v NaN bug)
    const vals = CARD_CATEGORIES.reduce((acc, { key }) => {
      const v = Number(user.playerCard?.[key]);
      acc[key] = Number.isFinite(v) ? v : 3;
      return acc;
    }, {});
    // If no playerCard yet, default to 3/3/3/3/3 = 15 (valid budget)
    setCardValues(vals);
    setCardImagePreview(user.cardImage ?? null);
    setProfileError("");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setCardValues(null);
    setCardImagePreview(null);
    setSelectedColor(user.avatarColor ?? 0);
    setProfileError("");
  }

  async function saveAll() {
    setProfileError("");
    setSaving(true);
    try {
      const changes = {};
      if (nameInput.trim() && nameInput.trim() !== user.username) {
        changes.username = nameInput.trim();
      }
      if (selectedColor !== (user.avatarColor ?? 0)) {
        changes.avatarColor = selectedColor;
      }
      if (cardValues) {
        const sum = CARD_CATEGORIES.reduce(
          (s, { key }) => s + (Number(cardValues[key]) || 0),
          0,
        );
        if (sum === TOTAL_POINTS) {
          changes.playerCard = CARD_CATEGORIES.reduce((acc, { key }) => {
            acc[key] = Number(cardValues[key]) || 0;
            return acc;
          }, {});
        }
      }
      // Only send cardImage if it changed
      const savedImage = user.cardImage ?? null;
      if (cardImagePreview !== savedImage) {
        changes.cardImage = cardImagePreview;
      }
      if (Object.keys(changes).length > 0) {
        await updateProfile(changes);
      }
      setEditing(false);
      setCardValues(null);
      setCardImagePreview(null);
    } catch (err) {
      setProfileError(err.response?.data?.error || "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(code) {
    setDeleting(code);
    setConfirmDelete(null);
    try {
      await api.delete(`/olympics/${code}`);
      setOlympics((prev) => prev.filter((o) => o.code !== code));
    } catch (err) {
      showToast(err.response?.data?.error || "Löschen fehlgeschlagen");
    } finally {
      setDeleting(null);
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-screen px-4 py-10">
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-pink-600/90 backdrop-blur-sm text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-2xl border border-pink-400/30 flex items-center gap-2">
            <AlertTriangle size={14} />
            {toast}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
        {/* Trading Card */}
        <div className="mx-auto" style={{ maxWidth: 400 }}>
          <TradingCard
            user={user}
            editing={editing}
            nameInput={nameInput}
            setNameInput={setNameInput}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            cardValues={cardValues}
            onOpenEdit={openEdit}
            onSave={saveAll}
            onCancel={cancelEdit}
            onCardChange={setCardValues}
            saving={saving}
            profileError={profileError}
            logout={logout}
            artImage={editing ? cardImagePreview : (user.cardImage ?? null)}
            onUploadImage={async (file) => {
              const b64 = await compressImage(file);
              if (b64) setCardImagePreview(b64);
            }}
            onRemoveImage={() => setCardImagePreview(null)}
          />
        </div>

        {/* Active Olympics */}
        {activeOlympics.length > 0 && (
          <div
            className="rounded-2xl p-4 space-y-2"
            style={{
              background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.3)",
              boxShadow: "0 0 24px rgba(34,197,94,0.06)",
            }}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400 mb-3">
              Aktive Olympiaden
            </p>
            {activeOlympics.map((o) => (
              <div
                key={o.code + o.role}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{
                  background: "rgba(34,197,94,0.07)",
                  border: "1px solid rgba(34,197,94,0.15)",
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">
                    {o.name}
                  </p>
                  <p className="text-xs text-green-400/70">
                    <span className="font-mono">{o.code}</span>
                    {" · "}
                    {o.status === "lobby" ? "Lobby" : "Läuft"}
                    {" · "}
                    {o.participants.length} Spieler
                    {o.role === "participant" && (
                      <span className="ml-1 text-green-400/50">
                        (Teilnehmer)
                      </span>
                    )}
                  </p>
                </div>
                <button
                  className="flex items-center gap-1.5 text-xs font-semibold shrink-0 px-3 py-1.5 rounded-xl transition-colors"
                  style={{
                    background: "rgba(34,197,94,0.25)",
                    border: "1px solid rgba(34,197,94,0.5)",
                    color: "#4ade80",
                  }}
                  onClick={() =>
                    navigate(
                      o.role === "host"
                        ? `/room/${o.code}/host`
                        : `/room/${o.code}`,
                    )
                  }
                >
                  <ExternalLink size={11} />
                  Beitreten
                </button>
              </div>
            ))}
          </div>
        )}

        {/* History */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "rgba(10,12,30,0.97)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-white text-sm uppercase tracking-wider">
              Verlauf
            </h2>
            <button
              className="btn-primary !py-1.5 !px-4 text-sm"
              onClick={() => navigate("/create")}
            >
              + Neue Olympiade
            </button>
          </div>

          {dataLoading && (
            <p className="text-muted text-sm text-center py-8 animate-pulse">
              Laden…
            </p>
          )}

          {!dataLoading && history.length === 0 && (
            <div className="text-center py-8">
              <Medal size={36} className="mx-auto mb-2 text-white/20" />
              <p className="text-white/50 text-sm">
                Noch keine abgeschlossenen Olympiaden
              </p>
            </div>
          )}

          <div className="space-y-2">
            {historyToShow.map((o) => {
              const isHost = o.role === "host";
              const lb = o.finalLeaderboard || [];
              const myParticipant = !isHost
                ? o.participants.find((p) => String(p.userId) === user.id)
                : null;
              const myEntry = myParticipant
                ? lb.find((e) => e.name === myParticipant.name)
                : null;
              const myRank = myEntry ? lb.indexOf(myEntry) + 1 : null;
              const rankColor =
                myRank === 1
                  ? "text-yellow-400"
                  : myRank === 2
                    ? "text-slate-300"
                    : myRank === 3
                      ? "text-orange-400"
                      : "text-white/50";

              return (
                <div
                  key={o.code + o.role}
                  className="rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="shrink-0">
                    {isHost ? (
                      <Crown size={16} className="text-yellow-400/70" />
                    ) : (
                      <Gamepad2 size={16} className="text-purple-400/70" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm truncate">
                        {o.name}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_STYLES[o.status] || ""}`}
                      >
                        {STATUS_LABEL[o.status] || o.status}
                      </span>
                      {myRank && (
                        <span className={`text-xs font-bold ${rankColor}`}>
                          #{myRank}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/35 mt-0.5">
                      <span className="font-mono">{o.code}</span>
                      {" · "}
                      {o.games.length}{" "}
                      {o.games.length === 1 ? "Spiel" : "Spiele"}
                      {" · "}
                      {new Date(o.updatedAt).toLocaleDateString("de-DE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <button
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors"
                      style={{
                        background: "rgba(139,92,246,0.15)",
                        border: "1px solid rgba(139,92,246,0.3)",
                        color: "#a78bfa",
                      }}
                      onClick={() => navigate(`/room/${o.code}/winner`)}
                    >
                      <Trophy size={12} />
                      Ergebnis
                    </button>
                    {isHost &&
                      (confirmDelete === o.code ? (
                        <div className="flex gap-1">
                          <button
                            className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 transition-colors"
                            onClick={() => handleDelete(o.code)}
                            disabled={deleting === o.code}
                          >
                            {deleting === o.code ? "…" : <Check size={12} />}
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
                          className="p-1.5 rounded-lg text-pink-400/50 hover:text-pink-400 hover:bg-pink-500/10 transition-colors"
                          onClick={() => setConfirmDelete(o.code)}
                          title="Löschen"
                        >
                          <Trash2 size={13} />
                        </button>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>

          {!dataLoading && history.length > 3 && (
            <button
              className="w-full mt-3 py-2 rounded-xl text-sm font-semibold text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-all flex items-center justify-center gap-1.5"
              onClick={() => setHistoryExpanded((v) => !v)}
            >
              {historyExpanded ? (
                <>
                  <ChevronUp size={14} /> Weniger anzeigen
                </>
              ) : (
                <>
                  <ChevronDown size={14} /> Alle anzeigen ({history.length})
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
