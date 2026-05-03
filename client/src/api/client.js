import axios from "axios";

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "") + "/api",
  timeout: 15000,
});

// Attach host token + auth JWT when available
api.interceptors.request.use((config) => {
  // Host token for olympic routes
  const match = config.url?.match(/\/olympics\/([A-Z0-9]{4,6})/i);
  if (match) {
    const code = match[1].toUpperCase();
    const token = localStorage.getItem(`hostToken_${code}`);
    if (token) config.headers["x-host-token"] = token;
  }

  // Auth JWT
  try {
    const raw = localStorage.getItem("auth-storage");
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.state?.token;
      if (token) config.headers["Authorization"] = `Bearer ${token}`;
    }
  } catch (_) {
    /* ignore */
  }

  return config;
});

export default api;
