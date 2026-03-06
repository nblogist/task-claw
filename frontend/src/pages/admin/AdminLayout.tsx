import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { getAdminToken, setAdminToken, clearAdminToken, adminApi } from '../../lib/adminApi';

const tabs = [
  { label: 'Dashboard', path: '/admin' },
  { label: 'Disputes', path: '/admin/disputes' },
  { label: 'Tasks', path: '/admin/tasks' },
];

export default function AdminLayout() {
  const [token, setToken] = useState<string | null>(getAdminToken());
  const [input, setInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoginError('');
    setVerifying(true);
    setAdminToken(input.trim());
    try {
      await adminApi.get('/api/admin/stats');
      setToken(input.trim());
    } catch {
      clearAdminToken();
      setLoginError('Invalid admin token');
    }
    setVerifying(false);
  };

  if (!token) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="bg-card-dark rounded-2xl border border-border-dark p-8 w-full max-w-md">
          <h2 className="text-white text-2xl font-bold mb-2 text-center">Admin Access</h2>
          <p className="text-slate-400 text-sm mb-6 text-center">
            Enter your admin token to access the admin panel.
          </p>
          {loginError && <p className="text-red-400 text-sm mb-4 text-center">{loginError}</p>}
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Admin token"
              className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary mb-4"
            />
            <button
              type="submit"
              disabled={verifying}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {verifying ? 'Verifying...' : 'Access Admin Panel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-card-dark border-b border-border-dark">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex">
            {tabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className={`cursor-pointer px-4 py-3 text-sm font-medium transition-colors ${
                  isActive(tab.path)
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
          <button
            onClick={() => {
              clearAdminToken();
              setToken(null);
              setInput('');
            }}
            className="cursor-pointer text-slate-400 hover:text-rose-400 text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </div>
    </div>
  );
}
