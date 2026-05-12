import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Dices,
  Users,
  Crown,
  Zap,
  Trophy,
  Gamepad2,
  Medal,
  Rocket,
  Brain,
  Crosshair,
  Car,
  PartyPopper,
  Ghost,
  Star,
  Flag,
  Flame,
  TrendingUp,
  TrendingDown,
  Target,
  Timer,
  Sparkles,
  Settings,
  ListChecks,
  ArrowRight,
  CheckCircle2,
  Library,
  Wrench,
  PlayCircle,
  Award,
  Layers,
  Swords,
  UserCheck,
  Eye,
  EyeOff,
  Save,
  Hash,
} from "lucide-react";

const FEATURES = [
  {
    image: "/assets/Erklärung_1.png",
    title: "Spiele-Bibliothek",
    desc: "Vorgefertigte Presets oder eigene Spiele mit Regeln, Modus und Dauer.",
    color: "from-pink-500/20 to-purple-500/10",
    border: "border-pink-500/30",
    glow: "rgba(236,72,153,0.15)",
  },
  {
    image: "/assets/Erklärung_2.png",
    title: "Bis zu 50 Spieler",
    desc: "FFA oder Teams – Lobby per 4-stelligem Code, Spieler joinen in Sekunden.",
    color: "from-cyan-500/20 to-blue-500/10",
    border: "border-cyan-500/30",
    glow: "rgba(34,211,238,0.15)",
  },
  {
    image: "/assets/Erklärung_3.png",
    title: "Live-Leaderboard",
    desc: "Punkte werden in Echtzeit synchronisiert – jeder sieht den aktuellen Stand.",
    color: "from-yellow-500/20 to-orange-500/10",
    border: "border-yellow-500/30",
    glow: "rgba(250,204,21,0.15)",
  },
  {
    image: "/assets/Erklärung_4.png",
    title: "Voll konfigurierbar",
    desc: "3 Punktsysteme, 4 Bonus-Regeln, Tiebreaker, Host-Modi – alles deine Wahl.",
    color: "from-purple-500/20 to-pink-500/10",
    border: "border-purple-500/30",
    glow: "rgba(139,92,246,0.15)",
  },
  {
    image: "/assets/Erklärung_5.png",
    title: "Champion-Show",
    desc: "Animierter Winner-Screen, Stats-Tracking, Verlauf in deinem Profil.",
    color: "from-green-500/20 to-cyan-500/10",
    border: "border-green-500/30",
    glow: "rgba(34,197,94,0.15)",
  },
];

const STEPS = [
  {
    num: "1",
    Icon: Wrench,
    iconColor: "#ec4899",
    title: "Olympiade bauen",
    desc: "Wähle Spiele, lege Regeln & Punktsystem fest – speichere als Draft oder starte sofort.",
    color: "#ec4899",
  },
  {
    num: "2",
    Icon: Hash,
    iconColor: "#22d3ee",
    title: "Code teilen",
    desc: "Teile den 4-stelligen Code – deine Crew joint mit ihrem Namen in der Lobby.",
    color: "#22d3ee",
  },
  {
    num: "3",
    Icon: PlayCircle,
    iconColor: "#8b5cf6",
    title: "Spielen & Punkten",
    desc: "Intro-Präsentation, Spiel für Spiel, live aktualisiertes Leaderboard.",
    color: "#8b5cf6",
  },
  {
    num: "4",
    Icon: Award,
    iconColor: "#facc15",
    title: "Champion küren",
    desc: "Winner-Screen mit Podium, Tiebreaker bei Gleichstand – Ergebnis bleibt im Verlauf.",
    color: "#facc15",
  },
];

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

const SPECIAL_RULES = [
  {
    Icon: TrendingDown,
    color: "#ef4444",
    title: "Comeback-Malus",
    desc: "Der bisherige Leader wird Letzter? −2 Punkte als Strafe (nur FFA).",
  },
  {
    Icon: Sparkles,
    color: "#22d3ee",
    title: "Last-Place-Bonus",
    desc: "Vom Letzten zum Sieger? +1 Punkt extra für die Comeback-Story (nur FFA).",
  },
  {
    Icon: Flame,
    color: "#f97316",
    title: "Win-Streak-Bonus",
    desc: "Zwei FFA-Spiele in Folge gewonnen? +1 Bonus-Punkt für die Gewinn-Serie.",
  },
  {
    Icon: Star,
    color: "#facc15",
    title: "Finale × 2",
    desc: "Das letzte Spiel gibt doppelte Punkte – Spannung bis zum Schluss garantiert.",
  },
];

const CARD_CATEGORIES = [
  { Icon: Brain, label: "IQ", color: "#22d3ee", val: 4 },
  { Icon: Crosshair, label: "Shooter", color: "#ec4899", val: 3 },
  { Icon: Car, label: "Racing", color: "#f59e0b", val: 2 },
  { Icon: PartyPopper, label: "Party", color: "#a78bfa", val: 5 },
  { Icon: Ghost, label: "Troll", color: "#4ade80", val: 1 },
];

function PreviewBar({ value, color }) {
  return (
    <div className="flex gap-0.5 flex-1">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: 5,
            background: i < value ? color : "rgba(255,255,255,0.08)",
            boxShadow: i < value ? `0 0 6px ${color}99` : "none",
          }}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState("linear");

  useEffect(() => {
    document.title = "Party Olympiade – Spiele, Punkte & Champions";
  }, []);

  const currentMode = SCORING_MODES.find((m) => m.id === activeMode);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[360px] sm:min-h-[420px] lg:min-h-[calc(100vh-56px)]">
        {/* Full-bleed background: Banner image anchored left */}
        <img
          src="/assets/Banner_1.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover hidden md:block"
          style={{ objectPosition: "left center" }}
        />

        {/* Fade-to-right overlay — image fades into the page background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(7,7,20,0) 20%, rgba(7,7,20,0.55) 42%, rgba(7,7,20,0.88) 58%, rgba(7,7,20,0.97) 72%, rgba(7,7,20,1) 85%)",
          }}
        />

        {/* Bottom fade so the section merges into the next section */}
        <div
          className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgba(7,7,20,1), transparent)",
          }}
        />

        {/* Dynamic purple/pink glow behind the text area */}
        <div
          className="absolute inset-y-0 right-0 w-2/3 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 90% at 80% 45%, rgba(139,92,246,0.22) 0%, rgba(236,72,153,0.12) 50%, transparent 75%)",
          }}
        />

        {/* Text content — right side, vertically centred */}
        <div className="relative z-10 flex items-center justify-end min-h-[360px] sm:min-h-[420px] lg:min-h-[calc(100vh-56px)]">
          <div className="w-full md:w-[60%] lg:w-[52%] px-6 sm:px-10 lg:px-14 xl:px-20 py-10 animate-slide-up">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-pink-500/50 bg-pink-500/12 text-pink-300 text-[10px] font-black uppercase tracking-[0.2em] mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
              Die ultimative Party Challenge
            </div>

            {/* Headline — large, tight */}
            <h1
              className="font-black tracking-tight leading-[0.95] mb-4"
              style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)" }}
            >
              <span className="text-white drop-shadow-[0_2px_20px_rgba(255,255,255,0.15)]">
                SPIELE.
              </span>
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(90deg, #ec4899, #8b5cf6, #22d3ee)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 24px rgba(139,92,246,0.6))",
                }}
              >
                PUNKTE.
              </span>
              <br />
              <span className="text-white drop-shadow-[0_2px_20px_rgba(255,255,255,0.15)]">
                WERDE{" "}
              </span>
              <span
                style={{
                  background: "linear-gradient(90deg, #facc15, #f97316)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 20px rgba(250,204,21,0.55))",
                }}
              >
                CHAMPION.
              </span>
            </h1>

            <p className="text-white/60 text-sm leading-relaxed mb-7 max-w-xs">
              Erstelle deine eigene Olympiade, lade die Crew per 4-stelligem
              Code ein, und wir tracken Punkte, Tiebreaker und den Champion für
              dich – in Echtzeit.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                className="btn-primary !px-6 !py-3 !rounded-2xl text-sm gap-2.5"
                style={{
                  boxShadow:
                    "0 0 40px rgba(236,72,153,0.5), 0 0 80px rgba(139,92,246,0.25)",
                }}
                onClick={() => navigate("/create")}
              >
                <Rocket size={15} />
                <div className="text-left">
                  <div className="font-black text-sm">Olympiade erstellen</div>
                  <div className="text-[11px] font-normal opacity-70">
                    In 2 Minuten startbereit
                  </div>
                </div>
              </button>
              <button
                className="btn-secondary !px-6 !py-3 !rounded-2xl text-sm gap-2.5 !border-cyan-500/70 !text-cyan-300 hover:!bg-cyan-500/15"
                style={{ boxShadow: "0 0 30px rgba(34,211,238,0.2)" }}
                onClick={() => navigate("/join")}
              >
                <Users size={15} />
                <div className="text-left">
                  <div className="font-black text-sm">Lobby beitreten</div>
                  <div className="text-[11px] font-normal opacity-70">
                    Mit 4-stelligem Code
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY SECTION ─────────────────────────────────────────── */}
      <section className="px-6 sm:px-12 lg:px-20 py-16">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-white/40 mb-3">
            Warum Party Olympiade?
          </h2>
          <p className="text-2xl sm:text-3xl font-black text-white max-w-2xl mx-auto">
            Alles, was du für ein{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #ec4899, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              episches Event
            </span>{" "}
            brauchst.
          </p>
          <div className="w-16 h-0.5 mx-auto bg-gradient-to-r from-pink-500 to-purple-500 rounded-full mt-4" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
          {FEATURES.map(({ image, title, desc, color, border, glow }) => (
            <div
              key={title}
              className={`relative rounded-2xl pt-1 pb-3 px-4 border bg-gradient-to-br ${color} ${border} flex flex-col items-center text-center gap-0 transition-transform duration-200 hover:scale-105 hover:-translate-y-1`}
              style={{ boxShadow: `0 8px 32px ${glow}` }}
            >
              <img
                src={image}
                alt={title}
                className="w-36 h-36 object-contain"
              />
              <div>
                <h3 className="font-bold text-white text-sm mb-1">{title}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SCORING SYSTEMS ─────────────────────────────────────── */}
      <section className="px-6 sm:px-12 lg:px-20 py-20">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-white/40 mb-3">
            Punktsysteme
          </h2>
          <p className="text-2xl sm:text-3xl font-black text-white max-w-2xl mx-auto">
            Drei Modi.{" "}
            <span style={{ color: "#22d3ee" }}>Wähle deinen Stil.</span>
          </p>
          <div className="w-16 h-0.5 mx-auto bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full mt-4" />
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Mode tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {SCORING_MODES.map((m) => {
              const isActive = m.id === activeMode;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMode(m.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: isActive
                      ? `${m.accent}25`
                      : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isActive ? m.accent : "rgba(255,255,255,0.08)"}`,
                    color: isActive ? m.accent : "rgba(255,255,255,0.6)",
                    boxShadow: isActive ? `0 0 24px ${m.accent}30` : "none",
                  }}
                >
                  <m.Icon size={16} />
                  {m.title}
                </button>
              );
            })}
          </div>

          {/* Active mode card */}
          {currentMode && (
            <div
              className="rounded-3xl p-6 sm:p-8 grid md:grid-cols-2 gap-6 items-center"
              style={{
                background: `linear-gradient(135deg, ${currentMode.accent}10, rgba(10,12,30,0.7))`,
                border: `1px solid ${currentMode.accent}40`,
                boxShadow: `0 0 40px ${currentMode.accent}15`,
              }}
            >
              <div>
                <div
                  className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                  style={{
                    background: `${currentMode.accent}20`,
                    color: currentMode.accent,
                    border: `1px solid ${currentMode.accent}50`,
                  }}
                >
                  <currentMode.Icon size={11} />
                  {currentMode.subtitle}
                </div>
                <h3 className="text-3xl font-black text-white mb-3">
                  {currentMode.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {currentMode.desc}
                </p>
              </div>

              {/* Visual leaderboard preview */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">
                  Beispiel · 5 Spieler
                </p>
                {currentMode.example.map((row, i) => {
                  const maxPts = currentMode.example[0].points || 1;
                  const widthPct =
                    row.points > 0
                      ? Math.max(6, (row.points / maxPts) * 100)
                      : 0;
                  const placeColors = [
                    "#facc15",
                    "#cbd5e1",
                    "#fb923c",
                    "rgba(255,255,255,0.35)",
                    "rgba(255,255,255,0.35)",
                  ];
                  return (
                    <div key={i} className="flex items-center gap-2.5">
                      {/* Place badge */}
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                        style={{
                          background: `${placeColors[i]}18`,
                          color: placeColors[i],
                          border: `1px solid ${placeColors[i]}33`,
                        }}
                      >
                        {row.place}
                      </div>
                      {/* Name — fixed width, never overlaps bar */}
                      <span className="text-xs font-semibold text-white/60 w-16 flex-shrink-0">
                        Spieler {row.place}
                      </span>
                      {/* Bar track */}
                      <div className="flex-1 h-2 rounded-full bg-white/[0.05] relative overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                          style={{
                            width: `${widthPct}%`,
                            background: `linear-gradient(90deg, ${currentMode.accent}, ${currentMode.accent}80)`,
                          }}
                        />
                      </div>
                      {/* Points */}
                      <span
                        className="font-black text-sm tabular-nums w-12 text-right flex-shrink-0"
                        style={{
                          color:
                            row.points > 0
                              ? currentMode.accent
                              : "rgba(255,255,255,0.2)",
                        }}
                      >
                        {row.points} Pkt
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── SPECIAL RULES ───────────────────────────────────────── */}
      <section className="px-6 sm:px-12 lg:px-20 py-20">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-white/40 mb-3">
            Bonus-Regeln
          </h2>
          <p className="text-2xl sm:text-3xl font-black text-white max-w-2xl mx-auto">
            Würze, die jedes Spiel{" "}
            <span style={{ color: "#facc15" }}>spannender</span> macht.
          </p>
          <p className="text-sm text-white/40 mt-3 max-w-xl mx-auto">
            Aktiviere Bonus-Regeln beim Erstellen – sie greifen automatisch.
          </p>
          <div className="w-16 h-0.5 mx-auto bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mt-4" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {SPECIAL_RULES.map(({ Icon, color, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl p-5 transition-all hover:-translate-y-1"
              style={{
                background: `linear-gradient(165deg, ${color}10, rgba(10,12,30,0.5))`,
                border: `1px solid ${color}33`,
                boxShadow: `0 6px 24px ${color}10`,
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                style={{
                  background: `${color}20`,
                  border: `1px solid ${color}40`,
                  color,
                }}
              >
                <Icon size={20} />
              </div>
              <h3 className="font-black text-white text-sm mb-1.5">{title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── GAME MODES ──────────────────────────────────────────── */}
      <section className="px-6 sm:px-12 lg:px-20 py-20">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-white/40 mb-3">
            Spielmodi
          </h2>
          <p className="text-2xl sm:text-3xl font-black text-white max-w-2xl mx-auto">
            <span style={{ color: "#ec4899" }}>Solo</span> oder{" "}
            <span style={{ color: "#22d3ee" }}>im Team</span> – beides geht.
          </p>
          <div className="w-16 h-0.5 mx-auto bg-gradient-to-r from-pink-500 to-cyan-500 rounded-full mt-4" />
        </div>

        <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {/* FFA */}
          <div
            className="rounded-3xl p-6 sm:p-8 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(165deg, rgba(236,72,153,0.12), rgba(10,12,30,0.7))",
              border: "1px solid rgba(236,72,153,0.35)",
              boxShadow: "0 0 40px rgba(236,72,153,0.1)",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{
                background: "rgba(236,72,153,0.2)",
                border: "1px solid rgba(236,72,153,0.5)",
                color: "#ec4899",
              }}
            >
              <Swords size={22} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">
              Free for All
            </h3>
            <p className="text-sm text-white/60 mb-5 leading-relaxed">
              Jeder gegen jeden. Punkte werden basierend auf der Platzierung
              vergeben.
            </p>
            <ul className="space-y-2">
              {[
                "Platzierungs-basiertes Scoring",
                "Funktioniert mit allen 3 Punktsystemen",
                "Bonus-Regeln greifen voll (Comeback, Streak, …)",
                "Tiebreaker bei Gleichstand",
              ].map((t) => (
                <li
                  key={t}
                  className="flex items-center gap-2 text-xs text-white/70"
                >
                  <CheckCircle2
                    size={13}
                    className="text-pink-400 flex-shrink-0"
                  />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Team */}
          <div
            className="rounded-3xl p-6 sm:p-8 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(165deg, rgba(34,211,238,0.12), rgba(10,12,30,0.7))",
              border: "1px solid rgba(34,211,238,0.35)",
              boxShadow: "0 0 40px rgba(34,211,238,0.1)",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{
                background: "rgba(34,211,238,0.2)",
                border: "1px solid rgba(34,211,238,0.5)",
                color: "#22d3ee",
              }}
            >
              <Users size={22} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Team-Modus</h3>
            <p className="text-sm text-white/60 mb-5 leading-relaxed">
              Bildet Teams – das Sieger-Team verteilt seine Punkte unter den
              Mitgliedern.
            </p>
            <ul className="space-y-2">
              {[
                "Beliebige Team-Anzahl & -größen",
                "Punkte = halber Max-Score des Modus",
                "Perfekt für Mannschaftsspiele wie Beer Pong",
                "Mische FFA- und Team-Spiele frei in einer Olympiade",
              ].map((t) => (
                <li
                  key={t}
                  className="flex items-center gap-2 text-xs text-white/70"
                >
                  <CheckCircle2
                    size={13}
                    className="text-cyan-400 flex-shrink-0"
                  />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── PLAYER CARDS ────────────────────────────────────────── */}
      <section className="px-6 sm:px-12 lg:px-20 py-20">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-white/40 mb-3">
            Player Cards
          </h2>
          <p className="text-2xl sm:text-3xl font-black text-white max-w-2xl mx-auto">
            Deine{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #a78bfa, #ec4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Trading-Card
            </span>{" "}
            für die Olympiade.
          </p>
          <p className="text-sm text-white/40 mt-3 max-w-xl mx-auto">
            Verteile 15 Punkte auf 5 Kategorien und zeig, wo du dominierst.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-[auto_1fr] gap-10 items-center">
          {/* Card preview */}
          <div className="mx-auto" style={{ maxWidth: 280 }}>
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
                  background:
                    "linear-gradient(165deg, #08061a 0%, #0d082a 100%)",
                  borderRadius: "23px",
                  overflow: "hidden",
                }}
              >
                {/* Top label */}
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
                </div>
                {/* Art */}
                <div
                  className="relative flex items-center justify-center"
                  style={{
                    height: "120px",
                    background:
                      "linear-gradient(135deg, #f472b6, #a78bfa, #22d3ee)",
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(5,3,15,0.35), rgba(5,3,15,0.5))",
                    }}
                  />
                  <div
                    className="relative z-10 rounded-2xl flex items-center justify-center font-black text-white"
                    style={{
                      width: 70,
                      height: 70,
                      background: "rgba(0,0,0,0.3)",
                      backdropFilter: "blur(8px)",
                      border: "2px solid rgba(255,255,255,0.25)",
                      fontSize: 28,
                    }}
                  >
                    A
                  </div>
                </div>
                {/* Name */}
                <div className="px-5 pt-3 pb-2 text-center">
                  <h4 className="text-base font-black text-white">Alex</h4>
                </div>
                {/* Stats */}
                <div className="px-5 pb-4 space-y-1.5">
                  {CARD_CATEGORIES.map(({ Icon, label, color, val }) => (
                    <div key={label} className="flex items-center gap-2">
                      <Icon size={11} style={{ color, flexShrink: 0 }} />
                      <span className="text-[10px] font-semibold text-white/50 w-12 flex-shrink-0">
                        {label}
                      </span>
                      <PreviewBar value={val} color={color} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <ul className="space-y-3">
              {[
                {
                  Icon: Brain,
                  color: "#22d3ee",
                  title: "5 Kategorien",
                  desc: "IQ, Shooter, Racing, Party, Troll – jede 1-5 Sterne.",
                },
                {
                  Icon: Target,
                  color: "#ec4899",
                  title: "15 Punkte zu verteilen",
                  desc: "Spezialist oder Allrounder? Du entscheidest, wo du stark bist.",
                },
                {
                  Icon: Eye,
                  color: "#a78bfa",
                  title: "Öffentliches Profil",
                  desc: "Jeder kann deine Karte unter einer eigenen URL ansehen.",
                },
                {
                  Icon: Sparkles,
                  color: "#facc15",
                  title: "8 Avatar-Farben",
                  desc: "Holographic-Border passt sich deiner gewählten Farbe an.",
                },
              ].map(({ Icon, color, title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `${color}15`,
                      border: `1px solid ${color}40`,
                      color,
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-0.5">
                      {title}
                    </h4>
                    <p className="text-xs text-white/55 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <button
              className="btn-secondary !px-6 !py-3 !rounded-xl text-sm mt-6 !border-purple-500/40 !text-purple-300 hover:!bg-purple-500/10 gap-2"
              onClick={() => navigate("/profile")}
            >
              <UserCheck size={14} />
              Eigene Karte erstellen
            </button>
          </div>
        </div>
      </section>

      {/* ── HIGHLIGHT FEATURES ──────────────────────────────────── */}
      <section className="px-6 sm:px-12 lg:px-20 py-20">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-white/40 mb-3">
            Mehr als nur ein Punktezähler
          </h2>
          <div className="w-16 h-0.5 mx-auto bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full mt-4" />
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {/* Tiebreaker */}
          <div
            className="rounded-2xl p-6"
            style={{
              background:
                "linear-gradient(165deg, rgba(34,211,238,0.08), rgba(10,12,30,0.6))",
              border: "1px solid rgba(34,211,238,0.25)",
            }}
          >
            <Timer size={28} className="text-cyan-400 mb-3" />
            <h3 className="font-black text-white text-base mb-2">
              Tiebreaker mit 45s-Timer
            </h3>
            <p className="text-xs text-white/55 leading-relaxed">
              Bei Gleichstand: Schätzfrage erscheint, Spieler haben 45 Sekunden,
              Host wählt die nähere Antwort. Aus 100+ Fragen.
            </p>
          </div>

          {/* Intro slides */}
          <div
            className="rounded-2xl p-6"
            style={{
              background:
                "linear-gradient(165deg, rgba(236,72,153,0.08), rgba(10,12,30,0.6))",
              border: "1px solid rgba(236,72,153,0.25)",
            }}
          >
            <Layers size={28} className="text-pink-400 mb-3" />
            <h3 className="font-black text-white text-base mb-2">
              Intro-Präsentation
            </h3>
            <p className="text-xs text-white/55 leading-relaxed">
              Stilvoller Start: Host steuert Slides mit Spielregeln, Teilnehmern
              und der Olympiade-Übersicht – wie ein TV-Show-Opening.
            </p>
          </div>

          {/* Host modes */}
          <div
            className="rounded-2xl p-6"
            style={{
              background:
                "linear-gradient(165deg, rgba(139,92,246,0.08), rgba(10,12,30,0.6))",
              border: "1px solid rgba(139,92,246,0.25)",
            }}
          >
            <EyeOff size={28} className="text-purple-400 mb-3" />
            <h3 className="font-black text-white text-base mb-2">Host-Modi</h3>
            <p className="text-xs text-white/55 leading-relaxed">
              Host kann mitspielen (mit oder ohne Punkte als „Ghost") oder rein
              moderieren. Spielplan optional verstecken für Überraschung.
            </p>
          </div>

          {/* Drafts */}
          <div
            className="rounded-2xl p-6"
            style={{
              background:
                "linear-gradient(165deg, rgba(250,204,21,0.08), rgba(10,12,30,0.6))",
              border: "1px solid rgba(250,204,21,0.25)",
            }}
          >
            <Save size={28} className="text-yellow-400 mb-3" />
            <h3 className="font-black text-white text-base mb-2">
              Drafts speichern
            </h3>
            <p className="text-xs text-white/55 leading-relaxed">
              Plane deine Olympiade in Ruhe vor. Speichere als Draft und starte
              sie später, wenn alle bereit sind.
            </p>
          </div>

          {/* Live updates */}
          <div
            className="rounded-2xl p-6"
            style={{
              background:
                "linear-gradient(165deg, rgba(34,197,94,0.08), rgba(10,12,30,0.6))",
              border: "1px solid rgba(34,197,94,0.25)",
            }}
          >
            <Zap size={28} className="text-green-400 mb-3" />
            <h3 className="font-black text-white text-base mb-2">
              Echtzeit-Sync
            </h3>
            <p className="text-xs text-white/55 leading-relaxed">
              Jede Punkt-Änderung erscheint sofort bei allen – über WebSockets.
              Kein Reload, keine Verzögerung.
            </p>
          </div>

          {/* History */}
          <div
            className="rounded-2xl p-6"
            style={{
              background:
                "linear-gradient(165deg, rgba(167,139,250,0.08), rgba(10,12,30,0.6))",
              border: "1px solid rgba(167,139,250,0.25)",
            }}
          >
            <ListChecks size={28} className="text-violet-400 mb-3" />
            <h3 className="font-black text-white text-base mb-2">
              Verlauf & Stats
            </h3>
            <p className="text-xs text-white/55 leading-relaxed">
              Alle deine gehosteten und gespielten Olympiaden bleiben im Profil
              – mit Platzierung, Datum und Endstand.
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <section className="px-6 sm:px-12 lg:px-20 py-20">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-white/40 mb-3">
            So funktioniert's
          </h2>
          <p className="text-2xl sm:text-3xl font-black text-white max-w-2xl mx-auto">
            Von der Idee zum Champion in{" "}
            <span style={{ color: "#facc15" }}>4 Schritten</span>.
          </p>
          <div className="w-16 h-0.5 mx-auto bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full mt-4" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto relative">
          {/* Connector line */}
          <div
            className="absolute top-8 left-[12.5%] right-[12.5%] h-px hidden lg:block"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(139,92,246,0.4) 20%, rgba(34,211,238,0.4) 50%, rgba(139,92,246,0.4) 80%, transparent)",
            }}
          />

          {STEPS.map(({ num, Icon, iconColor, title, desc, color }) => (
            <div
              key={num}
              className="relative flex flex-col items-center text-center gap-3 glass rounded-2xl p-5 border-white/[0.08]"
            >
              {/* Step circle */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-black text-xl border-2 relative z-10"
                style={{
                  borderColor: color,
                  background: `${color}22`,
                  color,
                  boxShadow: `0 0 20px ${color}44`,
                }}
              >
                {num}
              </div>
              <div style={{ color: iconColor }}>
                <Icon size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm mb-1">{title}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ──────────────────────────────────────────── */}
      <section className="px-6 sm:px-12 lg:px-20 py-20 text-center">
        <div
          className="max-w-2xl mx-auto rounded-3xl p-10 border border-purple-500/20 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.08))",
            boxShadow: "0 0 80px rgba(139,92,246,0.1)",
          }}
        >
          {/* Background glow blobs */}
          <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-pink-500/10 blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <Medal size={52} className="mx-auto mb-4 text-yellow-400/80" />
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Bereit für die{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #ec4899, #8b5cf6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Olympiade?
              </span>
            </h2>
            <p className="text-white/50 mb-8 max-w-sm mx-auto">
              Kein Setup, keine Account-Pflicht zum Hosten. Nur Spiele, Punkte
              und ein Champion.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                className="btn-primary !px-10 !py-4 !rounded-2xl text-base shadow-[0_0_40px_rgba(139,92,246,0.4)]"
                onClick={() => navigate("/create")}
              >
                <span className="flex items-center justify-center gap-2">
                  <Rocket size={16} /> Jetzt starten
                </span>
              </button>
              <button
                className="btn-secondary !px-10 !py-4 !rounded-2xl text-base !border-white/20 !text-white/70 hover:!bg-white/5"
                onClick={() => navigate("/library")}
              >
                <span className="flex items-center justify-center gap-2">
                  <Library size={16} /> Spiele-Bibliothek
                  <ArrowRight size={14} />
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-8 text-center border-t border-white/[0.06]">
        <p className="text-white/25 text-xs">
          © {new Date().getFullYear()} Party Olympiade &nbsp;·&nbsp;
          <Link
            to="/datenschutz"
            className="hover:text-white/50 transition-colors underline underline-offset-2"
          >
            Datenschutz
          </Link>
        </p>
      </footer>
    </div>
  );
}
