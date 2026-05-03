import { Link } from "react-router-dom";
import { AVATAR_GRADIENTS } from "./Header.jsx";

const RANK_STYLES = [
  { bg: "rgba(250,204,21,0.08)", border: "rgba(250,204,21,0.22)", num: "#facc15" },
  { bg: "rgba(148,163,184,0.07)", border: "rgba(148,163,184,0.2)", num: "#94a3b8" },
  { bg: "rgba(205,127,50,0.07)", border: "rgba(205,127,50,0.2)", num: "#cd7f32" },
];

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg,#ec4899,#8b5cf6)",
  "linear-gradient(135deg,#8b5cf6,#3b82f6)",
  "linear-gradient(135deg,#22d3ee,#3b82f6)",
  "linear-gradient(135deg,#22c55e,#14b8a6)",
  "linear-gradient(135deg,#f97316,#ec4899)",
  "linear-gradient(135deg,#eab308,#f97316)",
  "linear-gradient(135deg,#f43f5e,#8b5cf6)",
  "linear-gradient(135deg,#6366f1,#22d3ee)",
];

function PlayerAvatar({ participant, name, index }) {
  const grad =
    participant?.avatarColor != null
      ? AVATAR_GRADIENTS[participant.avatarColor] ?? AVATAR_GRADIENTS[0]
      : FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];

  if (participant?.cardImage) {
    return (
      <div
        className="w-7 h-7 rounded-lg flex-shrink-0 overflow-hidden"
        style={{ background: grad }}
      >
        <img
          src={participant.cardImage}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
      style={{ background: grad }}
    >
      {name[0]?.toUpperCase()}
    </div>
  );
}

export default function Scoreboard({
  leaderboard = [],
  participants = [],
  myName = null,
  compact = false,
}) {
  if (leaderboard.length === 0) {
    return (
      <p className="text-center text-white/25 text-xs py-4">
        Noch keine Punkte
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {/* Column headers */}
      {!compact && (
        <div className="flex items-center gap-2 px-3 pb-1">
          <span className="w-5 flex-shrink-0" />
          <span className="w-7 flex-shrink-0" />
          <span className="flex-1" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/20 w-8 text-right">
            Pts
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/20 w-8 text-right">
            Base
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/20 w-8 text-right">
            +/−
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/20 w-6 text-right">
            W
          </span>
        </div>
      )}

      {leaderboard.map((entry, i) => {
        const participantIdx = participants.findIndex((p) => p.name === entry.name);
        const participant = participants[participantIdx];
        const isMe = entry.name === myName;
        const rankStyle = RANK_STYLES[i];

        return (
          <div
            key={entry.name}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all"
            style={{
              background: isMe
                ? "rgba(139,92,246,0.12)"
                : rankStyle
                  ? rankStyle.bg
                  : "rgba(255,255,255,0.03)",
              border: `1px solid ${
                isMe
                  ? "rgba(139,92,246,0.3)"
                  : rankStyle
                    ? rankStyle.border
                    : "rgba(255,255,255,0.06)"
              }`,
            }}
          >
            {/* Rank */}
            <span
              className="text-xs font-black w-5 flex-shrink-0 text-center font-mono"
              style={{ color: rankStyle ? rankStyle.num : "rgba(255,255,255,0.2)" }}
            >
              {i + 1}
            </span>

            {/* Avatar */}
            <PlayerAvatar
              participant={participant}
              name={entry.name}
              index={participantIdx >= 0 ? participantIdx : i}
            />

            {/* Name */}
            <span className="flex-1 flex items-center gap-1.5 min-w-0">
              {participant?.username ? (
                <Link
                  to={`/user/${encodeURIComponent(participant.username)}`}
                  className={`text-sm font-semibold truncate hover:underline underline-offset-2 ${
                    isMe ? "text-purple-300 hover:text-purple-200" : "text-white/85 hover:text-white"
                  }`}
                >
                  {entry.name}
                </Link>
              ) : (
                <span
                  className={`text-sm font-semibold truncate ${
                    isMe ? "text-purple-300" : "text-white/85"
                  }`}
                >
                  {entry.name}
                </span>
              )}
              {isMe && (
                <span
                  className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background: "rgba(139,92,246,0.35)",
                    border: "1px solid rgba(139,92,246,0.6)",
                    color: "#c4b5fd",
                  }}
                >
                  ich
                </span>
              )}
            </span>

            {/* Total */}
            <span
              className="text-sm font-black w-8 text-right flex-shrink-0"
              style={{ color: isMe ? "#c4b5fd" : "#fff" }}
            >
              {entry.total}
            </span>

            {!compact && (
              <>
                <span className="text-xs text-white/30 w-8 text-right flex-shrink-0">
                  {entry.base}
                </span>
                <span
                  className={`text-xs font-semibold w-8 text-right flex-shrink-0 ${
                    entry.bonus > 0
                      ? "text-green-400"
                      : entry.bonus < 0
                        ? "text-pink-400"
                        : "text-white/20"
                  }`}
                >
                  {entry.bonus > 0 ? `+${entry.bonus}` : entry.bonus}
                </span>
                <span className="text-xs text-white/25 w-6 text-right flex-shrink-0">
                  {entry.wins}
                </span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
