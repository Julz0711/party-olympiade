import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Gamepad2,
  Medal,
  LogIn,
  ArrowLeft,
  X,
  Menu,
  Plus,
} from "lucide-react";

export default function FloatingRoomNav({ code, role }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const roomPath = role === "host" ? `/room/${code}/host` : `/room/${code}`;

  const links = [
    ...(role && code
      ? [
          {
            label: (
              <span className="flex items-center gap-2">
                <ArrowLeft size={13} /> Zurück zu Raum {code.toUpperCase()}
              </span>
            ),
            path: roomPath,
            highlight: true,
          },
        ]
      : []),
    {
      label: (
        <span className="flex items-center gap-2">
          <Home size={13} /> Home
        </span>
      ),
      path: "/",
    },
    {
      label: (
        <span className="flex items-center gap-2">
          <Plus size={13} /> Olympiade erstellen
        </span>
      ),
      path: "/create",
    },
    {
      label: (
        <span className="flex items-center gap-2">
          <LogIn size={13} /> Lobby beitreten
        </span>
      ),
      path: "/join",
    },
    {
      label: (
        <span className="flex items-center gap-2">
          <Gamepad2 size={13} /> Game Library
        </span>
      ),
      path: "/library",
    },
    {
      label: (
        <span className="flex items-center gap-2">
          <Medal size={13} /> Profil
        </span>
      ),
      path: "/profile",
    },
  ];

  return (
    <div className="hidden md:block fixed bottom-5 left-5 z-50">
      {open && (
        <>
          <div className="fixed inset-0 z-0" onClick={() => setOpen(false)} />

          <div
            className="absolute bottom-14 left-0 w-52 rounded-2xl overflow-hidden animate-fade-in"
            style={{
              background: "rgba(12,10,30,0.97)",
              border: "1px solid rgba(139,92,246,0.35)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
            }}
          >
            {code && (
              <div
                className="px-4 py-3 flex items-center gap-2 border-b"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}
              >
                <span className="text-yellow-400 text-xs font-black tracking-widest font-mono">
                  {code.toUpperCase()}
                </span>
                <span className="text-white/30 text-[10px]">aktiver Raum</span>
              </div>
            )}

            {links.map(({ label, path, highlight }) => (
              <button
                key={path}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold transition-all"
                style={
                  highlight
                    ? { color: "#a78bfa", background: "rgba(139,92,246,0.1)" }
                    : { color: "rgba(255,255,255,0.75)" }
                }
                onMouseEnter={(e) => {
                  if (!highlight) e.currentTarget.style.color = "white";
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = highlight
                    ? "#a78bfa"
                    : "rgba(255,255,255,0.75)";
                  e.currentTarget.style.background = highlight
                    ? "rgba(139,92,246,0.1)"
                    : "";
                }}
                onClick={() => {
                  setOpen(false);
                  navigate(path);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95"
        style={{
          background: open ? "rgba(139,92,246,0.25)" : "rgba(12,10,30,0.88)",
          border: `1px solid ${open ? "rgba(139,92,246,0.55)" : "rgba(255,255,255,0.12)"}`,
          color: open ? "#c4b5fd" : "rgba(255,255,255,0.6)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
        title="Navigation"
      >
        {open ? <X size={16} /> : <Menu size={16} />}
        <span className="text-xs tracking-wide">Menü</span>
      </button>
    </div>
  );
}
