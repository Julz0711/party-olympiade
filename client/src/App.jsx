import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header.jsx";
import HomePage from "./pages/HomePage.jsx";
import CreatePage from "./pages/CreatePage.jsx";
import JoinPage from "./pages/JoinPage.jsx";
import HostRoomPage from "./pages/HostRoomPage.jsx";
import ParticipantView from "./pages/ParticipantView.jsx";
import WinnerPage from "./pages/WinnerPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import GameLibraryPage from "./pages/GameLibraryPage.jsx";
import DraftsPage from "./pages/DraftsPage.jsx";
import ImpressumPage from "./pages/ImpressumPage.jsx";
import DatenschutzPage from "./pages/DatenschutzPage.jsx";
import UserPublicProfilePage from "./pages/UserPublicProfilePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import FloatingRoomNav from "./components/ui/FloatingRoomNav.jsx";

function GlobalRejoin() {
  const location = useLocation();
  if (location.pathname.startsWith("/room/")) return null;
  let lastRoom = null;
  try { lastRoom = JSON.parse(localStorage.getItem("lastRoom")); } catch {}
  if (!lastRoom?.code) return null;
  return <FloatingRoomNav code={lastRoom.code} role={lastRoom.role} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <GlobalRejoin />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/edit/:code" element={<CreatePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/drafts" element={<DraftsPage />} />
        <Route path="/library" element={<GameLibraryPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/join/:code" element={<JoinPage />} />
        <Route path="/room/:code" element={<ParticipantView />} />
        <Route path="/room/:code/host" element={<HostRoomPage />} />
        <Route path="/room/:code/winner" element={<WinnerPage />} />
        <Route path="/user/:username" element={<UserPublicProfilePage />} />
        <Route path="/impressum" element={<ImpressumPage />} />
        <Route path="/datenschutz" element={<DatenschutzPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
