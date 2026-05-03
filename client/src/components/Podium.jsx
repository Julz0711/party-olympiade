import { Medal } from "lucide-react";
import CompactPlayerCard from "./ui/CompactPlayerCard.jsx";

const PODIUM_HEIGHTS = ["h-28", "h-20", "h-14"];
const PODIUM_ORDER = [1, 0, 2]; // display order: 2nd, 1st, 3rd
const MEDAL_COLORS = ["#facc15", "#94a3b8", "#cd7f32"];
const DELAY = ["delay-300", "delay-0", "delay-600"];

export default function Podium({ leaderboard = [], participants = [] }) {
  const top3 = leaderboard.slice(0, 3);

  // Pad to 3 slots
  while (top3.length < 3) top3.push(null);

  return (
    <div className="flex items-end justify-center gap-2 sm:gap-6 px-4">
      {PODIUM_ORDER.map((rankIdx, displayIdx) => {
        const entry = top3[rankIdx];
        if (!entry) return <div key={displayIdx} className="w-24 sm:w-32" />;

        const participant = participants.find((p) => p.name === entry.name);
        const animDelay = DELAY[displayIdx];

        return (
          <div
            key={entry.name}
            className={`flex flex-col items-center animate-podium-rise ${animDelay} opacity-0`}
            style={{ animationFillMode: "forwards" }}
          >
            {/* Player card */}
            <div className="mb-2">
              <CompactPlayerCard
                name={entry.name}
                avatarColor={participant?.avatarColor ?? null}
                cardImage={participant?.cardImage ?? null}
                playerCard={participant?.playerCard ?? null}
                fallbackIndex={rankIdx}
              />
            </div>

            {/* Medal */}
            <div className="mb-1">
              <Medal size={28} style={{ color: MEDAL_COLORS[rankIdx] }} />
            </div>

            {/* Points */}
            <div className="text-xs text-muted mb-2">{entry.total} pts</div>

            {/* Podium block */}
            <div
              className={`w-20 sm:w-28 ${PODIUM_HEIGHTS[rankIdx]} rounded-t-xl flex items-center justify-center text-2xl font-black text-white/20`}
              style={{
                background:
                  rankIdx === 0
                    ? "linear-gradient(180deg, #8b5cf6, #6d28d9)"
                    : rankIdx === 1
                      ? "linear-gradient(180deg, rgba(139,92,246,0.6), rgba(109,40,217,0.4))"
                      : "linear-gradient(180deg, rgba(139,92,246,0.3), rgba(109,40,217,0.2))",
              }}
            >
              {rankIdx + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
}
