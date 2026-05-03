import { AVATAR_GRADIENTS } from "../Header.jsx";

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, #ec4899, #8b5cf6)",
  "linear-gradient(135deg, #8b5cf6, #3b82f6)",
  "linear-gradient(135deg, #22d3ee, #3b82f6)",
  "linear-gradient(135deg, #22c55e, #14b8a6)",
  "linear-gradient(135deg, #f97316, #ec4899)",
  "linear-gradient(135deg, #eab308, #f97316)",
  "linear-gradient(135deg, #f43f5e, #8b5cf6)",
  "linear-gradient(135deg, #6366f1, #22d3ee)",
];

const COMPACT_STATS = [
  { key: "iq",      label: "IQ",  color: "#22d3ee" },
  { key: "shooter", label: "SHO", color: "#ec4899" },
  { key: "racing",  label: "RAC", color: "#f59e0b" },
  { key: "party",   label: "PTY", color: "#a78bfa" },
  { key: "troll",   label: "TRL", color: "#4ade80" },
];

function MiniStatBar({ value, color }) {
  return (
    <div className="w-full flex flex-col-reverse" style={{ gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          style={{
            height: 3,
            width: "100%",
            borderRadius: 2,
            background: i < value ? color : "rgba(255,255,255,0.12)",
            boxShadow: i < value ? `0 0 5px ${color}99` : "none",
          }}
        />
      ))}
    </div>
  );
}

export default function CompactPlayerCard({
  name,
  avatarColor = null,
  cardImage = null,
  playerCard = null,
  isMe = false,
  isHost = false,
  fallbackIndex = 0,
}) {
  const grad =
    avatarColor !== null
      ? AVATAR_GRADIENTS[avatarColor] ?? AVATAR_GRADIENTS[0]
      : FALLBACK_GRADIENTS[fallbackIndex % FALLBACK_GRADIENTS.length];

  const borderGrad = isMe
    ? "linear-gradient(135deg, #ec4899, #f472b6, #a78bfa)"
    : grad;

  return (
    <div
      className="animate-fade-in"
      style={{
        background: borderGrad,
        padding: "1.5px",
        borderRadius: "14px",
        boxShadow: isMe
          ? "0 0 18px rgba(236,72,153,0.5)"
          : "0 2px 12px rgba(0,0,0,0.35)",
      }}
    >
      <div
        style={{
          width: 120,
          borderRadius: "13px",
          overflow: "hidden",
          background: "linear-gradient(165deg, #08061a 0%, #0d082a 100%)",
        }}
      >
        {/* Art section — square */}
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{ height: 120, background: cardImage ? "transparent" : grad }}
        >
          {cardImage ? (
            <img
              src={cardImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <>
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(5,3,15,0.25) 0%, rgba(5,3,15,0.45) 100%)",
                }}
              />
              <span
                className="relative z-10 font-black text-white select-none"
                style={{ fontSize: 38, textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
              >
                {name?.[0]?.toUpperCase()}
              </span>
            </>
          )}

          {/* HOST pill */}
          {isHost && (
            <span
              className="absolute top-1.5 left-1.5 z-20 text-[7px] font-black uppercase leading-none px-1.5 rounded-full"
              style={{
                background: "rgba(234,179,8,0.88)",
                color: "#1a0f00",
                backdropFilter: "blur(4px)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
                paddingTop: 3,
                paddingBottom: 3,
              }}
            >
              Host
            </span>
          )}

          {/* DU pill */}
          {isMe && (
            <span
              className="absolute top-1.5 z-20 text-[7px] font-black uppercase leading-none px-1.5 rounded-full"
              style={{
                right: isHost ? "1.5px" : undefined,
                left: isHost ? undefined : "1.5px",
                background: "rgba(236,72,153,0.88)",
                color: "white",
                backdropFilter: "blur(4px)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
                paddingTop: 3,
                paddingBottom: 3,
              }}
            >
              Du
            </span>
          )}

          {/* Online dot */}
          <span
            className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full z-20"
            style={{
              background: "#22c55e",
              border: "1.5px solid #080618",
              boxShadow: "0 0 6px rgba(34,197,94,0.5)",
            }}
          />

          {/* Fade into card background when stats are shown */}
          {playerCard && (
            <div
              className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
              style={{
                height: 24,
                background: "linear-gradient(to bottom, transparent, #08061a)",
              }}
            />
          )}
        </div>

        {/* Name section */}
        <div
          className="px-1.5 py-1.5 text-center"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
          <span
            className="block text-[11px] font-bold text-white truncate leading-tight"
            title={name}
          >
            {name}
          </span>
        </div>

        {/* Stats section */}
        {playerCard && (
          <div
            className="px-2 pb-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex gap-1 pt-1.5">
              {COMPACT_STATS.map(({ key, label, color }) => {
                const val = Number(playerCard[key]) || 0;
                return (
                  <div key={key} className="flex flex-col flex-1">
                    <MiniStatBar value={val} color={color} />
                    <span
                      className="text-white/40 font-bold mt-0.5 text-center"
                      style={{ fontSize: 7, letterSpacing: "0.02em" }}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
