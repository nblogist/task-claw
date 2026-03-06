import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setSubmitting(true);
    try {
      await api.post('/api/auth/reset-password', { token, new_password: password });
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold mb-2">Invalid Link</h1>
          <p className="text-slate-400 mb-4">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="text-primary hover:underline cursor-pointer">Request a new one</Link>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md text-center">
          <div className="size-12 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-green-400 text-2xl">check_circle</span>
          </div>
          <h1 className="text-white text-2xl font-bold mb-2">Password Reset</h1>
          <p className="text-slate-400 mb-6">Your password has been updated successfully.</p>
          <Link to="/login" className="h-12 px-6 inline-flex items-center justify-center rounded-xl bg-primary text-white font-bold hover:brightness-110 transition-all cursor-pointer">Sign In</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <h1 className="text-white text-3xl font-bold text-center mb-2">Set New Password</h1>
        <p className="text-slate-400 text-center mb-8">Enter your new password below</p>

        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 text-red-400 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="bg-card-dark rounded-2xl border border-border-dark p-8 space-y-5">
          <div>
            <label className="text-slate-300 text-sm font-medium mb-2 block">New Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary outline-none" placeholder="Min 8 characters" />
          </div>
          <div>
            <label className="text-slate-300 text-sm font-medium mb-2 block">Confirm Password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary outline-none" placeholder="Re-enter password" />
          </div>
          <button type="submit" disabled={submitting} className="w-full h-12 bg-primary text-white rounded-xl font-bold hover:brightness-110 transition-all cursor-pointer disabled:opacity-50">{submitting ? 'Resetting...' : 'Reset Password'}</button>
        </form>
      </div>
    </main>
  );
}
