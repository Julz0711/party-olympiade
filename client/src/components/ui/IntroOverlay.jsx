import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, X, Crown, Zap, Trophy } from "lucide-react";
import { AVATAR_GRADIENTS } from "../Header.jsx";
import { getSocket } from "../../socket/socket.js";
import CompactPlayerCard from "./CompactPlayerCard.jsx";

const SCORING_LABELS = {
  linear: "Linear (N+1 bis 1)",
  top3: "Top 3 (3-2-1)",
  f1: "Formel 1 (10-8-6-5…)",
};

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
      rules.comebackPenalty && "Comeback-Malus für Gewinner",
      rules.lastPlaceBonus && "Letzter-Platz-Bonus",
      rules.winStreakBonus && "Win-Streak-Bonus",
      rules.finalDoublePoints && "Doppelte Punkte im Finale",
    ].filter(Boolean);

    return (
      <div className="flex flex-col items-center justify-center h-full px-8 gap-6">
        <div className="text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-green-400 mb-2">
            Die Regeln
          </p>
          <Zap size={32} className="text-green-400 mx-auto mb-4" />
        </div>
        <div
          className="w-full max-w-sm rounded-2xl p-5 space-y-3"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40 uppercase tracking-wider font-bold">
              Wertung
            </span>
            <span className="text-sm font-bold text-white">
              {SCORING_LABELS[olympic.scoringMode] || olympic.scoringMode}
            </span>
          </div>
          {activeRules.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              {activeRules.map((r) => (
                <div key={r} className="flex items-center gap-2">
                  <span className="text-green-400 text-xs">✦</span>
                  <span className="text-sm text-white/70">{r}</span>
                </div>
              ))}
            </div>
          )}
          {activeRules.length === 0 && (
            <p className="text-sm text-white/40 pt-2 border-t border-white/5">
              Standard-Regeln
            </p>
          )}
        </div>
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
