import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';

export default function AuthModal({ onClose }) {
  const [tab, setTab] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuthStore();

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function set(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setError('');
    };
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (tab === 'signup') {
        await register(form.username.trim(), form.email.trim(), form.password);
      } else {
        await login(form.email.trim(), form.password);
      }
      onClose();
    } catch (err) {
      console.error('Auth error:', err);
      let msg = 'Something went wrong';
      if (err.response?.data?.error) {
        msg = err.response.data.error;
      } else if (err.message === 'Network Error') {
        msg = 'Network error - check your connection';
      } else if (err.code === 'ECONNABORTED') {
        msg = 'Request timeout - please try again';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(7,7,20,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal card */}
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 p-8 animate-slide-up"
        style={{ background: 'rgba(13,16,36,0.97)', boxShadow: '0 0 60px rgba(139,92,246,0.2)' }}
      >
        {/* Tab switcher */}
        <div className="flex rounded-xl bg-white/5 p-1 mb-7">
          {(['login', 'signup']).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                tab === t
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow'
                  : 'text-muted hover:text-white'
              }`}
            >
              {t === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {tab === 'signup' && (
            <div>
              <label className="label">Username</label>
              <input
                className="input-field"
                type="text"
                placeholder="e.g. partyking99"
                maxLength={30}
                autoFocus
                value={form.username}
                onChange={set('username')}
                required
              />
            </div>
          )}

          <div>
            <label className="label">Email</label>
            <input
              className="input-field"
              type="email"
              placeholder="you@example.com"
              autoFocus={tab === 'login'}
              value={form.email}
              onChange={set('email')}
              required
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              className="input-field"
              type="password"
              placeholder={tab === 'signup' ? 'At least 6 characters' : '••••••••'}
              minLength={tab === 'signup' ? 6 : undefined}
              value={form.password}
              onChange={set('password')}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-pink-400 bg-pink-500/10 border border-pink-500/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary w-full mt-2"
            disabled={loading}
          >
            {loading ? '…' : tab === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-white text-lg"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
