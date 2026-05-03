import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client.js";
import { AVATAR_GRADIENTS } from "../components/Header.jsx";
import { Brain, Crosshair, Car, PartyPopper, Ghost, Star, Share2 } from "lucide-react";

const CARD_CATEGORIES = [
  { key: "iq", label: "IQ", Icon: Brain, color: "#22d3ee" },
  { key: "shooter", label: "Shooter", Icon: Crosshair, color: "#ec4899" },
  { key: "racing", label: "Racing", Icon: Car, color: "#f59e0b" },
  { key: "party", label: "Party", Icon: PartyPopper, color: "#a78bfa" },
  { key: "troll", label: "Troll", Icon: Ghost, color: "#4ade80" },
];

function StarDisplay({ value, size = 15 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          fill={star <= value ? "currentColor" : "none"}
          className={star <= value ? "text-yellow-400" : "text-white/20"}
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
      <div className="w-full animate-slide-up" style={{ maxWidth: 400 }}>
        {/* Trading card */}
        <div
          style={{
            background:
              "linear-gradient(135deg, #8b5cf6 0%, #ec4899 40%, #22d3ee 100%)",
            padding: "1.5px",
            borderRadius: "24px",
            boxShadow:
              "0 0 80px rgba(139,92,246,0.35), 0 0 160px rgba(236,72,153,0.12)",
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

            {/* Art section */}
            <div
              className="relative flex items-center justify-center overflow-hidden"
              style={{ height: 220, background: profile.cardImage ? "transparent" : avatarGrad }}
            >
              {profile.cardImage ? (
                <img
                  src={profile.cardImage}
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
                    {profile.username?.[0]?.toUpperCase()}
                  </div>
                </>
              )}
            </div>

            {/* Name */}
            <div className="px-5 pt-4 pb-4 text-center">
              <h1 className="text-xl font-black text-white">
                {profile.username}
              </h1>
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

            {/* Stats */}
            <div className="px-5 pt-4 pb-5">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 block mb-3">
                Stats
              </span>

              {profile.playerCard ? (
                <div className="space-y-2.5">
                  {CARD_CATEGORIES.map(({ key, label, Icon, color }) => {
                    const val = Number(profile.playerCard[key]) || 0;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <Icon size={13} style={{ color, flexShrink: 0 }} />
                        <span className="text-xs font-semibold text-white/50 w-14 flex-shrink-0">
                          {label}
                        </span>
                        <div className="flex-1">
                          <StarDisplay value={val} size={15} />
                        </div>
                        <span className="text-[11px] font-black text-white/25 w-6 text-right">
                          {val}/5
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-white/30 text-sm">
                    Noch keine Player Card erstellt
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
