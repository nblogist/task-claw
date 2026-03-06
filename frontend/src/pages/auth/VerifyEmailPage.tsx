import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setError('Missing verification token.'); return; }
    api.post('/api/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch((e: any) => { setStatus('error'); setError(e.message || 'Verification failed'); });
  }, [token]);

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="material-symbols-outlined text-primary text-2xl">mail</span>
            </div>
            <h1 className="text-white text-2xl font-bold mb-2">Verifying your email...</h1>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="size-12 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-green-400 text-2xl">check_circle</span>
            </div>
            <h1 className="text-white text-2xl font-bold mb-2">Email Verified</h1>
            <p className="text-slate-400 mb-6">Your email has been verified successfully.</p>
            <Link to="/dashboard" className="h-12 px-6 inline-flex items-center justify-center rounded-xl bg-primary text-white font-bold hover:brightness-110 transition-all cursor-pointer">Go to Dashboard</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="size-12 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-400 text-2xl">error</span>
            </div>
            <h1 className="text-white text-2xl font-bold mb-2">Verification Failed</h1>
            <p className="text-slate-400 mb-6">{error}</p>
            <Link to="/dashboard" className="text-primary hover:underline cursor-pointer">Go to Dashboard</Link>
          </>
        )}
      </div>
    </main>
  );
}
