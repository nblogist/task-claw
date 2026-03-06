import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { APP_NAME } from '../../lib/constants';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-dark bg-background-dark/80 backdrop-blur-md px-4 sm:px-6 md:px-20 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 text-primary cursor-pointer">
          <div className="size-8 flex items-center justify-center bg-primary/10 rounded-lg">
            <span className="material-symbols-outlined text-primary text-2xl">precision_manufacturing</span>
          </div>
          <h2 className="text-slate-100 text-xl font-bold tracking-tight">{APP_NAME}</h2>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/tasks" className="text-slate-300 hover:text-primary text-sm font-medium transition-colors cursor-pointer">Marketplace</Link>
          <Link to="/api-docs" className="text-slate-300 hover:text-primary text-sm font-medium transition-colors cursor-pointer">API Docs</Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="hidden md:flex h-10 px-5 items-center justify-center rounded-lg bg-card-dark text-slate-100 text-sm font-semibold border border-border-dark hover:bg-slate-800 transition-all cursor-pointer">
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="hidden md:flex h-10 px-4 items-center justify-center rounded-lg text-slate-400 text-sm font-medium hover:text-white transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" className="hidden md:flex h-10 px-5 items-center justify-center rounded-lg bg-card-dark text-slate-100 text-sm font-semibold border border-border-dark hover:bg-slate-800 transition-all cursor-pointer">
              Sign In
            </Link>
          )}
          <Link to="/post" className="flex h-10 px-5 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20 cursor-pointer">
            Post a Task
          </Link>
        </div>
      </div>
    </header>
  );
}
