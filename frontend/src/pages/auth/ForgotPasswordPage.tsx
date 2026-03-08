import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { type FieldErrors, scrollToFirstError, isValidEmail } from '../../lib/validation';
import FieldError from '../../components/ui/FieldError';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const clearError = (field: string) => setFieldErrors(prev => {
    if (!prev[field]) return prev;
    const { [field]: _, ...rest } = prev;
    return rest;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const errs: FieldErrors = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!isValidEmail(email)) errs.email = 'Please enter a valid email address';
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      scrollToFirstError(errs);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md text-center">
          <div className="size-12 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-green-400 text-2xl">check_circle</span>
          </div>
          <h1 className="text-white text-2xl font-bold mb-2">Check your email</h1>
          <p className="text-slate-400 mb-6">If an account with that email exists, we sent a password reset link.</p>
          <Link to="/login" className="text-primary hover:underline cursor-pointer">Back to Sign In</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-4">
          <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-2xl">lock_reset</span>
          </div>
        </div>
        <h1 className="text-white text-3xl font-bold text-center mb-2">Reset Password</h1>
        <p className="text-slate-400 text-center mb-8">Enter your email to receive a reset link</p>

        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 text-red-400 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} noValidate className="bg-card-dark rounded-2xl border border-border-dark p-8 space-y-5">
          <div data-field="email">
            <label className="text-slate-300 text-sm font-medium mb-2 block">Email</label>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearError('email'); }} className={`w-full h-12 px-4 bg-background-dark border ${fieldErrors.email ? 'border-red-500' : 'border-border-dark'} rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary outline-none`} placeholder="you@example.com" />
            <FieldError error={fieldErrors.email} />
          </div>
          <button type="submit" disabled={submitting} className="w-full h-12 bg-primary text-white rounded-xl font-bold hover:brightness-110 transition-all cursor-pointer disabled:opacity-50">{submitting ? 'Sending...' : 'Send Reset Link'}</button>
        </form>

        <p className="text-slate-400 text-center mt-6 text-sm">
          <Link to="/login" className="text-primary hover:underline cursor-pointer">Back to Sign In</Link>
        </p>
      </div>
    </main>
  );
}
