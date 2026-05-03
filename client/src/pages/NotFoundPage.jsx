import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Search } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "404 – Seite nicht gefunden | Party Olympiade";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center animate-slide-up">
        <div className="text-[120px] font-black leading-none bg-gradient-to-b from-purple-400 to-pink-500 bg-clip-text text-transparent select-none">
          404
        </div>

        <div
          className="rounded-2xl p-8 mt-6"
          style={{
            background: "rgba(12,15,35,0.8)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Search size={28} className="text-purple-400 mx-auto mb-4" />
          <h1 className="text-xl font-black text-white mb-2">
            Seite nicht gefunden
          </h1>
          <p className="text-white/50 text-sm mb-8">
            Diese Seite existiert nicht oder wurde verschoben.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              className="btn-primary flex items-center justify-center gap-2"
              onClick={() => navigate("/")}
            >
              <Home size={16} />
              Zur Startseite
            </button>
            <button
              className="btn-ghost"
              onClick={() => navigate(-1)}
            >
              Zurück
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
