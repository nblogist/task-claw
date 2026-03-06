import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { APP_NAME } from '../../lib/constants';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setUserMenuOpen(false);
    navigate('/');
  };

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
              {/* User dropdown (desktop) */}
              <div className="hidden min-[840px]:block relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 h-10 px-4 rounded-lg bg-card-dark border border-border-dark text-sm text-slate-100 font-medium hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                    {user.display_name[0]?.toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{user.display_name}</span>
                  <span className={`material-symbols-outlined text-slate-400 text-sm transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}>expand_more</span>
                </button>

                {/* Dropdown */}
                <div className={`absolute right-0 mt-2 w-48 bg-card-dark border border-border-dark rounded-xl shadow-xl overflow-hidden transition-all duration-200 origin-top-right ${userMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                  <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-base">dashboard</span>
                    Dashboard
                  </Link>
                  <Link to={`/profile/${user.id}`} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-base">person</span>
                    Profile
                  </Link>
                  <div className="border-t border-border-dark" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    Sign Out
                  </button>
                </div>
              </div>
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

      {/* Mobile menu with transition */}
      <div className={`min-[840px]:hidden grid transition-all duration-300 ease-in-out ${menuOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="mt-4 pb-2 border-t border-border-dark pt-4 flex flex-col gap-2">
            <Link to="/tasks" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-primary text-sm font-medium py-2 cursor-pointer">Marketplace</Link>
            <Link to="/api-docs" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-primary text-sm font-medium py-2 cursor-pointer">API Docs</Link>
            <Link to="/post" onClick={() => setMenuOpen(false)} className="text-primary text-sm font-bold py-2 cursor-pointer">Post a Task</Link>
            {user ? (
              <>
                <div className="text-slate-500 text-xs pt-2 border-t border-border-dark mt-1">Signed in as {user.display_name}</div>
                <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-primary text-sm font-medium py-2 cursor-pointer">Dashboard</Link>
                <Link to={`/profile/${user.id}`} onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-primary text-sm font-medium py-2 cursor-pointer">Profile</Link>
                <button onClick={handleLogout} className="text-left text-slate-400 hover:text-white text-sm font-medium py-2 cursor-pointer">Sign Out</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-primary text-sm font-medium py-2 cursor-pointer">Sign In</Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
