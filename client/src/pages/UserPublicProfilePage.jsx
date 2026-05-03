import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client.js";
import { AVATAR_GRADIENTS } from "../components/Header.jsx";
import { Brain, Crosshair, Car, PartyPopper, Ghost, Share2 } from "lucide-react";

const CARD_CATEGORIES = [
  { key: "iq", label: "IQ", Icon: Brain, color: "#22d3ee" },
  { key: "shooter", label: "Shooter", Icon: Crosshair, color: "#ec4899" },
  { key: "racing", label: "Racing", Icon: Car, color: "#f59e0b" },
  { key: "party", label: "Party", Icon: PartyPopper, color: "#a78bfa" },
  { key: "troll", label: "Troll", Icon: Ghost, color: "#4ade80" },
];

function StatBar({ value, max = 5, color }) {
  return (
    <div className="flex gap-0.5 flex-1">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: 6,
            background: i < value ? color : "rgba(255,255,255,0.08)",
            boxShadow: i < value ? `0 0 8px ${color}99` : "none",
          }}
        />
      ))}
    </div>
  );
}

export default function UserPublicProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = username
      ? `${username} | Party Olympiade`
      : "Spieler | Party Olympiade";
    api
      .get(`/auth/user/${encodeURIComponent(username)}`)
      .then(({ data }) => setProfile(data))
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [username]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/40 animate-pulse">Laden…</p>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-2xl font-black text-white/20 mb-2">404</p>
          <p className="text-white/50 text-sm">Spieler nicht gefunden</p>
        </div>
      </div>
    );
  }

  const avatarGrad =
    AVATAR_GRADIENTS[profile.avatarColor ?? 0] || AVATAR_GRADIENTS[0];

  return (
    <div className="min-h-screen px-4 py-10 flex items-start justify-center">
      <div className="w-full animate-slide-up" style={{ maxWidth: 360 }}>
        {/* Trading card */}
        <div
          style={{
            background:
              "linear-gradient(135deg, #8b5cf6 0%, #ec4899 40%, #22d3ee 100%)",
            padding: "1.5px",
            borderRadius: "24px",
            boxShadow:
              "0 0 60px rgba(139,92,246,0.3), 0 0 120px rgba(236,72,153,0.15), 0 24px 64px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              background: "radial-gradient(ellipse 130% 55% at 50% 0%, rgba(139,92,246,0.12) 0%, transparent 65%), linear-gradient(165deg, #08061a 0%, #0d082a 100%)",
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
              <button
                className="p-1.5 rounded-lg text-white/25 hover:text-white/60 transition-colors"
                onClick={copyLink}
                title="Link kopieren"
              >
                {copied ? (
                  <span className="text-[10px] text-green-400 font-bold">
                    Kopiert!
                  </span>
                ) : (
                  <Share2 size={13} />
                )}
              </button>
            </div>

            {/* Art section — full width */}
            <div
              className="relative flex items-center justify-center overflow-hidden"
              style={{ height: 200, background: profile.cardImage ? "transparent" : avatarGrad }}
            >
              {profile.cardImage ? (
                <img src={profile.cardImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(5,3,15,0.2) 0%, rgba(5,3,15,0.55) 100%)" }} />
                  <div
                    className="relative z-10 rounded-2xl flex items-center justify-center font-black text-white"
                    style={{ width: 76, height: 76, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)", border: "2px solid rgba(255,255,255,0.2)", fontSize: 30, textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
                  >
                    {profile.username?.[0]?.toUpperCase()}
                  </div>
                </>
              )}

              {/* Diagonal shine */}
              <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 45%, rgba(255,255,255,0.03) 100%)" }} />

              {/* Corner brackets */}
              <div className="absolute top-3 left-3 z-10 pointer-events-none" style={{ width: 14, height: 14, borderTop: "1.5px solid rgba(255,255,255,0.3)", borderLeft: "1.5px solid rgba(255,255,255,0.3)", borderTopLeftRadius: 2 }} />
              <div className="absolute top-3 right-3 z-10 pointer-events-none" style={{ width: 14, height: 14, borderTop: "1.5px solid rgba(255,255,255,0.3)", borderRight: "1.5px solid rgba(255,255,255,0.3)", borderTopRightRadius: 2 }} />
              <div className="absolute bottom-10 left-3 z-10 pointer-events-none" style={{ width: 14, height: 14, borderBottom: "1.5px solid rgba(255,255,255,0.15)", borderLeft: "1.5px solid rgba(255,255,255,0.15)", borderBottomLeftRadius: 2 }} />
              <div className="absolute bottom-10 right-3 z-10 pointer-events-none" style={{ width: 14, height: 14, borderBottom: "1.5px solid rgba(255,255,255,0.15)", borderRight: "1.5px solid rgba(255,255,255,0.15)", borderBottomRightRadius: 2 }} />

              {/* Fade into card background */}
              <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none" style={{ height: 80, background: "linear-gradient(to bottom, transparent 0%, rgb(8,6,26) 100%)" }} />
            </div>

            {/* Name */}
            <div className="px-5 pt-4 pb-2 text-center">
              <h1 className="text-xl font-black text-white" style={{ textShadow: "0 0 24px rgba(139,92,246,0.4)" }}>{profile.username}</h1>
            </div>

            {/* Bio — optional, 2 lines max */}
            {profile.bio && (
              <div className="px-5 pb-3">
                <p
                  className="text-xs text-white/45 leading-relaxed text-center"
                  style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                >
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Divider */}
            <div className="mx-5" style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.4), rgba(236,72,153,0.3), transparent)" }} />

            {/* Stats — full width bars */}
            <div className="px-5 pt-4 pb-5">
              {profile.playerCard && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1" style={{ height: 1, background: "linear-gradient(to right, transparent, rgba(139,92,246,0.25))" }} />
                  <span className="text-[9px] font-black uppercase tracking-[0.35em] text-white/30">Stats</span>
                  <div className="flex-1" style={{ height: 1, background: "linear-gradient(to left, transparent, rgba(139,92,246,0.25))" }} />
                </div>
              )}
              {profile.playerCard ? (
                <div className="space-y-2.5">
                  {CARD_CATEGORIES.map(({ key, label, Icon, color }) => {
                    const val = Number(profile.playerCard[key]) || 0;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <Icon size={13} style={{ color, flexShrink: 0 }} />
                        <span className="text-xs font-semibold text-white/50 w-14 flex-shrink-0">{label}</span>
                        <div className="flex-1">
                          <StatBar value={val} max={5} color={color} />
                        </div>
                        <span className="text-[11px] font-black text-white/25 w-6 text-right">{val}/5</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-white/30 text-sm text-center py-2">Noch keine Player Card erstellt</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
