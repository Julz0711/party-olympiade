import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";
import api from "../api/client.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import { AVATAR_GRADIENTS } from "../components/Header.jsx";
import {
  Crown,
  Shield,
  User,
  Search,
  AlertTriangle,
  Check,
  ChevronDown,
} from "lucide-react";

const ROLE_CONFIG = {
  user: { label: "User", color: "text-white/50", bg: "bg-white/5" },
  moderator: { label: "Moderator", color: "text-purple-400", bg: "bg-purple-500/10" },
  admin: { label: "Admin", color: "text-pink-400", bg: "bg-pink-500/10" },
};

function RolePicker({ current, userId, onSave }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function pick(role) {
    if (role === current) { setOpen(false); return; }
    setSaving(true);
    await onSave(userId, role);
    setSaving(false);
    setOpen(false);
  }

  const cfg = ROLE_CONFIG[current] || ROLE_CONFIG.user;

  return (
    <div className="relative">
      <button
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${cfg.bg} ${cfg.color} border-white/10 hover:border-white/20`}
        onClick={() => setOpen((s) => !s)}
        disabled={saving}
      >
        {saving ? "…" : cfg.label}
        <ChevronDown size={11} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1 z-20 w-36 rounded-xl border border-white/10 overflow-hidden"
            style={{
              background: "rgba(13,16,36,0.98)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}
          >
            {Object.entries(ROLE_CONFIG).map(([role, { label, color }]) => (
              <button
                key={role}
                className={`w-full text-left px-3 py-2.5 text-xs font-bold hover:bg-white/5 transition-colors flex items-center justify-between ${color}`}
                onClick={() => pick(role)}
              >
                {label}
                {role === current && <Check size={11} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    document.title = "Admin | Party Olympiade";
  }, []);

  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers("");
  }, [isAdmin]);

  async function fetchUsers(q) {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/auth/admin/users?search=${encodeURIComponent(q)}`);
      setUsers(data);
    } catch {
      setError("Benutzer konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId, role) {
    setSaveError("");
    try {
      const { data } = await api.patch(`/auth/admin/users/${userId}/role`, { role });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: data.user.role } : u))
      );
      setSaved(userId);
      setTimeout(() => setSaved(null), 2000);
    } catch (err) {
      setSaveError(err.response?.data?.error || "Speichern fehlgeschlagen");
    }
  }

  useEffect(() => {
    if (!isAdmin) return;
    const t = setTimeout(() => fetchUsers(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard className="max-w-sm w-full text-center py-8">
          <Crown size={36} className="mx-auto mb-3 text-white/30" />
          <p className="text-white font-bold mb-1">Anmeldung erforderlich</p>
        </GlassCard>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard className="max-w-sm w-full text-center py-8">
          <Crown size={36} className="mx-auto mb-3 text-pink-400/60" />
          <p className="text-white font-bold mb-1">Kein Zugriff</p>
          <p className="text-sm text-muted">Diese Seite ist nur für Admins.</p>
          <button className="btn-secondary mt-5 text-sm" onClick={() => navigate("/")}>
            Zurück zur Startseite
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Crown size={28} className="text-pink-400" /> Admin Panel
          </h1>
          <p className="text-sm text-muted mt-1">Benutzerrollen verwalten</p>
        </div>

        <div className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            className="input-field w-full pl-10"
            placeholder="Benutzer suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {saveError && (
          <p className="text-pink-400 text-sm bg-pink-500/10 border border-pink-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertTriangle size={14} /> {saveError}
          </p>
        )}

        {loading && (
          <p className="text-muted text-sm text-center py-10 animate-pulse">
            Lade Benutzer…
          </p>
        )}

        {error && (
          <p className="text-pink-400 text-sm bg-pink-500/10 border border-pink-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </p>
        )}

        {!loading && users.length === 0 && !error && (
          <GlassCard className="text-center py-10">
            <User size={36} className="mx-auto mb-3 text-white/20" />
            <p className="text-white font-semibold">Keine Benutzer gefunden</p>
          </GlassCard>
        )}

        {!loading && (
          <div className="space-y-2">
            {users.map((u) => {
              const isSelf = u.id === currentUser.id;
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                  style={{
                    background: "rgba(10,12,30,0.95)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: AVATAR_GRADIENTS[u.avatarColor ?? 0] }}
                  >
                    {u.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">
                        {u.username}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] text-white/30 font-bold">
                          (du)
                        </span>
                      )}
                      {saved === u.id && (
                        <span className="text-[10px] text-green-400 font-bold flex items-center gap-0.5">
                          <Check size={10} /> Gespeichert
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted truncate">{u.email}</p>
                  </div>
                  {isSelf ? (
                    <span className="text-xs text-white/25 italic pr-1">Eigenes Konto</span>
                  ) : (
                    <RolePicker
                      current={u.role ?? "user"}
                      userId={u.id}
                      onSave={handleRoleChange}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && users.length > 0 && (
          <p className="text-center text-xs text-white/20 pb-4">
            {users.length} Benutzer
          </p>
        )}
      </div>
    </div>
  );
}
