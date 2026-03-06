import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { APP_NAME } from '../../lib/constants';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-dark bg-background-dark/80 backdrop-blur-md px-4 sm:px-6 md:px-20 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 text-primary cursor-pointer">
          <div className="size-8 flex items-center justify-center bg-primary/10 rounded-lg">
            <span className="material-symbols-outlined text-primary text-2xl">precision_manufacturing</span>
          </div>
          <h2 className="text-slate-100 text-xl font-bold tracking-tight">{APP_NAME}</h2>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden min-[840px]:flex items-center gap-8">
          <Link to="/tasks" className="text-slate-300 hover:text-primary text-sm font-medium transition-colors cursor-pointer">Marketplace</Link>
          <Link to="/api-docs" className="text-slate-300 hover:text-primary text-sm font-medium transition-colors cursor-pointer">API Docs</Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden min-[840px]:inline text-slate-400 text-sm">{user.display_name}</span>
              <Link to="/dashboard" className="hidden min-[840px]:flex h-10 px-5 items-center justify-center rounded-lg bg-card-dark text-slate-100 text-sm font-semibold border border-border-dark hover:bg-slate-800 transition-all cursor-pointer">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="hidden min-[840px]:flex h-10 px-4 items-center justify-center rounded-lg text-slate-400 text-sm font-medium hover:text-white transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" className="hidden min-[840px]:flex h-10 px-5 items-center justify-center rounded-lg bg-card-dark text-slate-100 text-sm font-semibold border border-border-dark hover:bg-slate-800 transition-all cursor-pointer">
              Sign In
            </Link>
          )}
          <Link to="/post" className="hidden min-[840px]:flex h-10 px-5 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20 cursor-pointer">
            Post a Task
          </Link>

          {/* Hamburger button (mobile) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="min-[840px]:hidden flex items-center justify-center size-10 rounded-lg bg-card-dark border border-border-dark text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="min-[840px]:hidden mt-4 pb-2 border-t border-border-dark pt-4 flex flex-col gap-2">
          <Link to="/tasks" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-primary text-sm font-medium py-2 cursor-pointer">Marketplace</Link>
          <Link to="/api-docs" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-primary text-sm font-medium py-2 cursor-pointer">API Docs</Link>
          <Link to="/post" onClick={() => setMenuOpen(false)} className="text-primary text-sm font-bold py-2 cursor-pointer">Post a Task</Link>
          {user ? (
            <>
              <div className="text-slate-500 text-xs pt-2 border-t border-border-dark mt-1">Signed in as {user.display_name}</div>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-primary text-sm font-medium py-2 cursor-pointer">Dashboard</Link>
              <button onClick={handleLogout} className="text-left text-slate-400 hover:text-white text-sm font-medium py-2 cursor-pointer">Sign Out</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-primary text-sm font-medium py-2 cursor-pointer">Sign In</Link>
          )}
        </div>
      )}
    </header>
  );
}
