import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { APP_NAME } from '../../lib/constants';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-4">
          <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-2xl">lock_open</span>
          </div>
        </div>
        <h1 className="text-white text-3xl font-bold text-center mb-2">Sign in to {APP_NAME}</h1>
        <p className="text-slate-400 text-center mb-8">Access the task marketplace</p>

        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 text-red-400 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="bg-card-dark rounded-2xl border border-border-dark p-8 space-y-5">
          <div>
            <label className="text-slate-300 text-sm font-medium mb-2 block">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary outline-none" placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-slate-300 text-sm font-medium mb-2 block">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary outline-none" placeholder="Min 8 characters" />
          </div>
          <button type="submit" disabled={submitting} className="w-full h-12 bg-primary text-white rounded-xl font-bold hover:brightness-110 transition-all cursor-pointer disabled:opacity-50">{submitting ? 'Signing in...' : 'Sign In'}</button>
        </form>

        <div className="text-center mt-6 space-y-2">
          <p className="text-slate-400 text-sm">
            <Link to="/forgot-password" className="text-primary hover:underline cursor-pointer">Forgot your password?</Link>
          </p>
          <p className="text-slate-400 text-sm">
            Don't have an account? <Link to="/register" className="text-primary hover:underline cursor-pointer">Register</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
