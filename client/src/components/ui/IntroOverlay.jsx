import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, X, Crown, Trophy, TrendingUp, Medal, Flag } from "lucide-react";
import { AVATAR_GRADIENTS } from "../Header.jsx";
import { getSocket } from "../../socket/socket.js";
import CompactPlayerCard from "./CompactPlayerCard.jsx";

const SCORING_MODES = [
  {
    id: "linear",
    title: "Linear",
    subtitle: "Klassisch & fair",
    Icon: TrendingUp,
    accent: "#22d3ee",
    desc: "Mehr Spieler = mehr Punkte. Bei N Spielern bekommt P1 = N, P2 = N−1, … P_letzte = 1.",
    example: [
      { place: 1, points: 5 },
      { place: 2, points: 4 },
      { place: 3, points: 3 },
      { place: 4, points: 2 },
      { place: 5, points: 1 },
    ],
  },
  {
    id: "top3",
    title: "Top 3",
    subtitle: "Nur das Podium zählt",
    Icon: Medal,
    accent: "#facc15",
    desc: "Punkte gibt's nur für die ersten 3 Plätze. Schnell, brutal, perfekt für lange Olympiaden.",
    example: [
      { place: 1, points: 3 },
      { place: 2, points: 2 },
      { place: 3, points: 1 },
      { place: 4, points: 0 },
      { place: 5, points: 0 },
    ],
  },
  {
    id: "f1",
    title: "Formel 1",
    subtitle: "Wie der Motorsport",
    Icon: Flag,
    accent: "#ec4899",
    desc: "Klassische F1-Verteilung: 10-8-6-5-4-3-2-1. Belohnt konstante Performance.",
    example: [
      { place: 1, points: 10 },
      { place: 2, points: 8 },
      { place: 3, points: 6 },
      { place: 4, points: 5 },
      { place: 5, points: 4 },
    ],
  },
];

function Slide({ olympic, slideIndex, totalSlides }) {
  const participants = olympic.participants || [];
  const hostName = olympic.hostParticipates ? olympic.hostPlayerName : null;

  if (slideIndex === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-6">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
            boxShadow: "0 0 60px rgba(139,92,246,0.5)",
          }}
        >
          <Trophy size={36} className="text-white" />
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-purple-400 mb-3">
            Willkommen bei
          </p>
          <h1
            className="text-4xl font-black text-white leading-tight"
            style={{ textShadow: "0 0 40px rgba(139,92,246,0.6)" }}
          >
            {olympic.name}
          </h1>
        </div>
        <p className="text-white/40 text-sm">
          {olympic.games.length} {olympic.games.length === 1 ? "Spiel" : "Spiele"} ·{" "}
          {participants.length} Teilnehmer
        </p>
      </div>
    );
  }

  if (slideIndex === 1) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-6">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-yellow-400 mb-4">
            Euer Host
          </p>
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-black text-white mx-auto mb-4"
            style={{
              background: "linear-gradient(135deg, #eab308, #f97316)",
              boxShadow: "0 0 60px rgba(234,179,8,0.4)",
            }}
          >
            <Crown size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-white">Host</h2>
          {hostName && (
            <p className="text-white/50 mt-2 text-sm">spielt als {hostName} mit</p>
          )}
        </div>
      </div>
    );
  }

  if (slideIndex === 2) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 gap-5">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-400">
          Die Teilnehmer
        </p>
        <div className="flex flex-wrap gap-3 justify-center max-w-xl">
          {participants.map((p, i) => (
            <CompactPlayerCard
              key={p._id || i}
              name={p.name}
              avatarColor={p.avatarColor ?? null}
              cardImage={p.cardImage ?? null}
              playerCard={p.playerCard ?? null}
              fallbackIndex={i}
            />
          ))}
        </div>
        {participants.length === 0 && (
          <p className="text-white/30 text-sm">Keine Teilnehmer</p>
        )}
      </div>
    );
  }

  if (slideIndex === 3) {
    const rules = olympic.extraRules || {};
    const activeRules = [
      rules.comebackPenalty && "Comeback-Malus",
      rules.lastPlaceBonus && "Letzter-Platz-Bonus",
      rules.winStreakBonus && "Win-Streak-Bonus",
      rules.finalDoublePoints && "Doppelte Punkte im Finale",
    ].filter(Boolean);

    const activeMode = SCORING_MODES.find((m) => m.id === olympic.scoringMode) || SCORING_MODES[0];
    const placeColors = ["#facc15", "#cbd5e1", "#fb923c", "rgba(255,255,255,0.35)", "rgba(255,255,255,0.35)"];
    const maxPts = activeMode.example[0].points || 1;

    return (
      <div className="flex flex-col items-center w-full h-full px-6 pt-2 pb-4 gap-4 overflow-y-auto">
        <div className="text-center flex-shrink-0">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-green-400 mb-1">
            Die Regeln
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 flex-shrink-0">
          {SCORING_MODES.map((mode) => {
            const isActive = mode.id === olympic.scoringMode;
            return (
              <div
                key={mode.id}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: isActive ? `${mode.accent}20` : "rgba(255,255,255,0.05)",
                  border: `1px solid ${isActive ? `${mode.accent}50` : "rgba(255,255,255,0.1)"}`,
                  color: isActive ? mode.accent : "rgba(255,255,255,0.35)",
                }}
              >
                {mode.title}
              </div>
            );
          })}
        </div>

        {/* Active mode card */}
        <div
          className="w-full max-w-sm rounded-2xl p-4 flex-shrink-0"
          style={{
            background: `${activeMode.accent}08`,
            border: `1px solid ${activeMode.accent}25`,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <activeMode.Icon size={16} style={{ color: activeMode.accent }} />
            <div>
              <p className="text-sm font-black text-white leading-tight">{activeMode.title}</p>
              <p className="text-[10px]" style={{ color: `${activeMode.accent}99` }}>{activeMode.subtitle}</p>
            </div>
          </div>

          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            Beispiel · 5 Spieler
          </p>

          <div className="space-y-1.5">
            {activeMode.example.map((row, i) => {
              const widthPct = row.points > 0 ? Math.max(6, (row.points / maxPts) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center font-black text-[10px] flex-shrink-0"
                    style={{
                      background: `${placeColors[i]}18`,
                      color: placeColors[i],
                      border: `1px solid ${placeColors[i]}33`,
                    }}
                  >
                    {row.place}
                  </div>
                  <span className="text-[10px] font-semibold text-white/50 w-12 flex-shrink-0">
                    Spieler {row.place}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${widthPct}%`,
                        background: `linear-gradient(90deg, ${activeMode.accent}, ${activeMode.accent}80)`,
                      }}
                    />
                  </div>
                  <span
                    className="font-black text-xs tabular-nums w-10 text-right flex-shrink-0"
                    style={{ color: row.points > 0 ? activeMode.accent : "rgba(255,255,255,0.2)" }}
                  >
                    {row.points} Pkt
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bonus rules */}
        {activeRules.length > 0 && (
          <div className="w-full max-w-sm flex-shrink-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Bonus-Regeln aktiv</p>
            <div className="flex flex-wrap gap-1.5">
              {activeRules.map((r) => (
                <span
                  key={r}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                  style={{
                    background: "rgba(34,211,238,0.1)",
                    border: "1px solid rgba(34,211,238,0.25)",
                    color: "#22d3ee",
                  }}
                >
                  ✦ {r}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Final slide
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-6">
      <div
        className="text-6xl font-black"
        style={{
          background: "linear-gradient(135deg, #8b5cf6, #ec4899, #22d3ee)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Let's Go!
      </div>
      <p className="text-white/50 text-lg font-semibold">
        Viel Spaß bei {olympic.name}!
      </p>
      <p className="text-white/20 text-xs">Die Olympiade läuft bereits — bereit wenn ihr es seid.</p>
    </div>
  );
}

export default function IntroOverlay({ olympic, isHost, hostToken, onClose }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const totalSlides = 5; // title, host, participants, rules, final

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onSlide = ({ slideIndex: idx }) => setSlideIndex(idx);
    socket.on("intro-slide", onSlide);

    return () => {
      socket.off("intro-slide", onSlide);
    };
  }, []); // eslint-disable-line

  function advance() {
    const next = slideIndex + 1;
    if (next >= totalSlides) {
      getSocket()?.emit("intro-close", { code: olympic.code, hostToken });
      return;
    }
    getSocket()?.emit("intro-next", { code: olympic.code, hostToken, slideIndex: next });
  }

  function retreat() {
    const prev = Math.max(0, slideIndex - 1);
    getSocket()?.emit("intro-next", { code: olympic.code, hostToken, slideIndex: prev });
  }

  function closeIntro() {
    getSocket()?.emit("intro-close", { code: olympic.code, hostToken });
  }

  const isLast = slideIndex >= totalSlides - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: "linear-gradient(165deg, #06041a 0%, #0b0630 50%, #06041a 100%)",
      }}
    >
      {/* Background decorative glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 30% 30%, rgba(139,92,246,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(236,72,153,0.08) 0%, transparent 60%)",
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400">
          ✦ Einführung · Olympiade läuft
        </span>
        <div className="flex items-center gap-3">
          {/* Slide dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: i === slideIndex ? 20 : 6,
                  height: 6,
                  background:
                    i === slideIndex
                      ? "linear-gradient(90deg, #8b5cf6, #ec4899)"
                      : i < slideIndex
                        ? "rgba(139,92,246,0.5)"
                        : "rgba(255,255,255,0.1)",
                }}
              />
            ))}
          </div>
          {isHost && (
            <button
              className="p-1.5 rounded-lg text-white/25 hover:text-white/60 transition-colors"
              onClick={closeIntro}
              title="Überspringen"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Slide content */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <Slide
          olympic={olympic}
          slideIndex={slideIndex}
          totalSlides={totalSlides}
        />
      </div>

      {/* Bottom nav — only host can advance */}
      <div className="relative z-10 flex items-center justify-between px-6 py-6">
        {isHost && slideIndex > 0 ? (
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
            onClick={retreat}
          >
            <ChevronLeft size={16} />
            Zurück
          </button>
        ) : (
          <div />
        )}

        {isHost ? (
          <button
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: isLast
                ? "linear-gradient(135deg, #8b5cf6, #ec4899)"
                : "rgba(139,92,246,0.2)",
              border: "1px solid rgba(139,92,246,0.4)",
              color: isLast ? "white" : "#c4b5fd",
              boxShadow: isLast ? "0 0 30px rgba(139,92,246,0.4)" : "none",
            }}
            onClick={advance}
          >
            {isLast ? "Los geht's!" : "Weiter"}
            {!isLast && <ChevronRight size={16} />}
          </button>
        ) : (
          <div className="text-xs text-white/25 text-center flex-1">
            Der Host führt durch die Präsentation…
          </div>
        )}
      </div>
    </div>
  );
}
