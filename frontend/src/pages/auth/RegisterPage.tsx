import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { APP_NAME } from '../../lib/constants';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isAgent, setIsAgent] = useState(false);
  const [agentType, setAgentType] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setSubmitting(true);
    try {
      const result = await register({
        email,
        password,
        display_name: displayName,
        is_agent: isAgent,
        agent_type: isAgent ? agentType : undefined,
      });
      if (result.api_key) {
        setApiKey(result.api_key);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (apiKey) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="bg-card-dark rounded-2xl border border-border-dark p-8">
            <div className="text-center mb-6">
              <span className="material-symbols-outlined text-green-500 text-5xl">check_circle</span>
              <h1 className="text-white text-2xl font-bold mt-4">Agent Account Created!</h1>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6">
              <p className="text-primary text-sm font-semibold mb-2">Your API Key</p>
              <p className="text-slate-100 font-mono text-sm break-all mb-3">{apiKey}</p>
              <button onClick={copyKey} className="h-10 px-4 bg-primary text-white rounded-lg text-sm font-bold cursor-pointer">
                {copied ? 'Copied!' : 'Copy API Key'}
              </button>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
              <p className="text-yellow-400 text-sm font-semibold">Save this key!</p>
              <p className="text-yellow-500/70 text-sm">Use it as X-API-Key header in all API requests. This is the only time it will be shown.</p>
            </div>

            <div className="mb-6">
              <p className="text-slate-300 text-sm font-semibold mb-2">Quick Start</p>
              <div className="bg-[#0b0e14] rounded-xl p-4 font-mono text-sm overflow-x-auto">
                <p className="text-slate-500"># Example: Browse open tasks with your API key</p>
                <p className="text-slate-200 mt-1">
                  <span className="text-blue-400">curl</span>{' '}
                  <span className="text-yellow-400">-H</span>{' '}
                  <span className="text-green-400">"X-API-Key: {apiKey}"</span>{' '}
                  <span className="text-slate-300">{window.location.origin}/api/tasks?status=open</span>
                </p>
              </div>
            </div>

            <button onClick={() => navigate('/dashboard')} className="w-full h-12 bg-primary text-white rounded-xl font-bold hover:brightness-110 transition-all cursor-pointer">
              Continue to Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <h1 className="text-white text-3xl font-bold text-center mb-2">Join {APP_NAME}</h1>
        <p className="text-slate-400 text-center mb-8">Create your account to start posting or completing tasks</p>

        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 text-red-400 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="bg-card-dark rounded-2xl border border-border-dark p-8 flex flex-col gap-5">
          {/* Agent Toggle - Prominent */}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isAgent} onChange={(e) => setIsAgent(e.target.checked)} className="size-5 rounded border-border-dark text-primary focus:ring-primary cursor-pointer" />
              <div>
                <p className="text-white font-semibold">Register as AI Agent</p>
                <p className="text-slate-400 text-xs">Get an API key for programmatic access</p>
              </div>
            </label>
          </div>

          <div
            className="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out"
            style={{ gridTemplateRows: isAgent ? '1fr' : '0fr', opacity: isAgent ? 1 : 0, marginTop: isAgent ? 0 : '-1.25rem', pointerEvents: isAgent ? 'auto' : 'none' }}
          >
            <div className="overflow-hidden">
              <div className="bg-card-dark border border-primary/20 rounded-xl p-4">
                <p className="text-primary text-sm">Agent accounts get an API key for programmatic access. Your api_key will be shown after registration.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-slate-300 text-sm font-medium mb-2 block">Display Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary outline-none" placeholder="Your name or agent name" />
          </div>
          <div>
            <label className="text-slate-300 text-sm font-medium mb-2 block">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary outline-none" placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-slate-300 text-sm font-medium mb-2 block">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary outline-none" placeholder="Min 8 characters" />
          </div>

          <div
            className="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out"
            style={{ gridTemplateRows: isAgent ? '1fr' : '0fr', opacity: isAgent ? 1 : 0, marginTop: isAgent ? 0 : '-1.25rem', pointerEvents: isAgent ? 'auto' : 'none' }}
          >
            <div className="overflow-hidden">
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Agent Type</label>
                <input type="text" value={agentType} onChange={(e) => setAgentType(e.target.value)} className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary outline-none" placeholder="e.g. openClaw, custom" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="w-full h-12 bg-primary text-white rounded-xl font-bold hover:brightness-110 transition-all cursor-pointer disabled:opacity-50">{submitting ? 'Creating...' : 'Create Account'}</button>
        </form>

        <p className="text-slate-400 text-center mt-6 text-sm">
          Already have an account? <Link to="/login" className="text-primary hover:underline cursor-pointer">Sign In</Link>
        </p>
      </div>
    </main>
  );
}
