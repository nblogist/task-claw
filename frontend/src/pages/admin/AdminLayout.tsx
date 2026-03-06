import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { getAdminToken, setAdminToken, clearAdminToken } from '../../lib/adminApi';

const tabs = [
  { label: 'Dashboard', path: '/admin' },
  { label: 'Disputes', path: '/admin/disputes' },
  { label: 'Tasks', path: '/admin/tasks' },
];

export default function AdminLayout() {
  const [token, setToken] = useState<string | null>(getAdminToken());
  const [input, setInput] = useState('');
  const location = useLocation();

  if (!token) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="bg-card-dark rounded-2xl border border-border-dark p-8 w-full max-w-md">
          <h2 className="text-white text-2xl font-bold mb-2 text-center">Admin Access</h2>
          <p className="text-slate-400 text-sm mb-6 text-center">
            Enter your admin token to access the admin panel.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim()) return;
              setAdminToken(input.trim());
              setToken(input.trim());
            }}
          >
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Admin token"
              className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary mb-4"
            />
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Access Admin Panel
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
                className={`px-4 py-3 text-sm font-medium transition-colors ${
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
            className="text-slate-400 hover:text-rose-400 text-sm font-medium transition-colors"
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
