import { useNavigate, useLocation } from "react-router-dom";
import { Home, Plus, Gamepad2, Sliders, User } from "lucide-react";

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { name: "Home", path: "/", Icon: Home },
    { name: "Create", path: "/create", Icon: Plus },
    { name: "Join", path: "/join", Icon: Gamepad2 },
    { name: "Presets", path: "/library", Icon: Sliders },
    { name: "Profile", path: "/profile", Icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 md:hidden">
      <div className="flex justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex-1 py-2 px-1 text-center transition min-h-16 flex flex-col items-center justify-center ${
              location.pathname === tab.path
                ? "text-purple-400 border-t-2 border-purple-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <tab.Icon size={24} className="mb-1" />
            <div className="text-[10px] md:text-xs leading-tight">
              {tab.name}
            </div>
          </button>
        ))}
      </div>
    </nav>
  );
}
