import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { handleApiError } from '../lib/handleApiError';
import type { DashboardResponse, EarningsResponse, EarningsTransaction, CurrencySummary } from '../lib/types';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../lib/dates';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [tab, setTab] = useState<'posted' | 'working' | 'bids' | 'earnings'>('posted');
  const [earnings, setEarnings] = useState<EarningsResponse | null>(null);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [earningsRole, setEarningsRole] = useState<'all' | 'seller' | 'buyer'>('all');
  const [earningsPage, setEarningsPage] = useState(1);

  const fetchDashboard = () => {
    api.get<DashboardResponse>('/api/dashboard').then(setData).catch(handleApiError);
  };

  useEffect(() => { fetchDashboard(); }, []);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchDashboard(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  useEffect(() => {
    if (tab !== 'earnings') return;
    setEarningsLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(earningsPage));
    params.set('per_page', '20');
    if (earningsRole !== 'all') params.set('role', earningsRole);
    api.get<EarningsResponse>(`/api/earnings?${params}`)
      .then(setEarnings)
      .catch(handleApiError)
      .finally(() => setEarningsLoading(false));
  }, [tab, earningsRole, earningsPage]);

  if (!data) return (
    <main className="flex-1 px-4 sm:px-6 md:px-20 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="skeleton h-9 w-48 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
        <div className="flex gap-2 mb-6">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 w-32 rounded-lg" />)}
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      </div>
    </main>
  );

  const summaries: CurrencySummary[] = earnings?.summary ?? [];

  return (
    <main className="flex-1 px-4 sm:px-6 md:px-20 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-white text-3xl font-bold">Dashboard</h1>
          <Link to="/post" className="flex h-10 px-5 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold hover:brightness-110 transition-all cursor-pointer">
            Post a Task
          </Link>
        </div>

        {/* Per-currency stats when earnings loaded, else aggregate */}
        {summaries.length > 0 ? (
          <div className="space-y-3 mb-10">
            {summaries.map((s) => (
              <div key={s.currency} className="bg-card-dark rounded-2xl border border-border-dark p-5">
                <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-3">{s.currency}</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-green-400 text-xl font-bold">{parseFloat(String(s.total_earned)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-slate-400 text-xs">Earned</p>
                  </div>
                  <div>
                    <p className="text-red-400 text-xl font-bold">{parseFloat(String(s.total_spent)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-slate-400 text-xs">Spent</p>
                  </div>
                  <div>
                    <p className="text-yellow-400 text-xl font-bold">{parseFloat(String(s.in_escrow)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-slate-500">Simulated</span></p>
                    <p className="text-slate-400 text-xs">In Escrow</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <div className="bg-card-dark rounded-2xl border border-border-dark p-6">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm mb-1">Total Earned</p>
                <span className="material-symbols-outlined text-green-400 opacity-50">payments</span>
              </div>
              <p className="text-white text-2xl font-bold">{parseFloat(String(data.total_earned)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              {data.currency_breakdown.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border-dark space-y-1">
                  {data.currency_breakdown.filter(c => parseFloat(String(c.earned)) > 0).map(c => (
                    <div key={c.currency} className="flex justify-between text-xs">
                      <span className="text-slate-500"><span className="inline-block bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded font-medium mr-1">{c.currency}</span></span>
                      <span className="text-green-400 font-medium">{parseFloat(String(c.earned)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-card-dark rounded-2xl border border-border-dark p-6">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm mb-1">Total Spent</p>
                <span className="material-symbols-outlined text-red-400 opacity-50">shopping_cart</span>
              </div>
              <p className="text-white text-2xl font-bold">{parseFloat(String(data.total_spent)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              {data.currency_breakdown.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border-dark space-y-1">
                  {data.currency_breakdown.filter(c => parseFloat(String(c.spent)) > 0).map(c => (
                    <div key={c.currency} className="flex justify-between text-xs">
                      <span className="text-slate-500"><span className="inline-block bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded font-medium mr-1">{c.currency}</span></span>
                      <span className="text-red-400 font-medium">{parseFloat(String(c.spent)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-card-dark rounded-2xl border border-border-dark p-6">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm mb-1">Active Escrow</p>
                <span className="material-symbols-outlined text-yellow-400 opacity-50">lock</span>
              </div>
              <p className="text-yellow-400 text-2xl font-bold">
                {parseFloat(String(data.active_escrow)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-xs text-slate-500 ml-2">Simulated</span>
              </p>
              {data.currency_breakdown.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border-dark space-y-1">
                  {data.currency_breakdown.filter(c => parseFloat(String(c.in_escrow)) > 0).map(c => (
                    <div key={c.currency} className="flex justify-between text-xs">
                      <span className="text-slate-500"><span className="inline-block bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded font-medium mr-1">{c.currency}</span></span>
                      <span className="text-yellow-400 font-medium">{parseFloat(String(c.in_escrow)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { key: 'posted', label: `My Tasks (${data.tasks_posted.length})` },
            { key: 'working', label: `Active Work (${data.tasks_working.length})` },
            { key: 'bids', label: `My Bids (${data.my_bids.length})` },
            { key: 'earnings', label: 'Earnings' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`flex-shrink-0 px-5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                tab === t.key ? 'bg-primary text-white' : 'bg-card-dark text-slate-300 border border-border-dark'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-[200px]">
        {tab === 'posted' && (
          <div className="space-y-3 animate-fade-in">
            {data.tasks_posted.length === 0 ? (
              <p className="text-slate-400">No tasks posted yet.</p>
            ) : data.tasks_posted.map((task) => (
              <Link key={task.id} to={`/tasks/${task.slug}`} className="block bg-card-dark rounded-xl border border-border-dark p-5 hover:border-primary/40 cursor-pointer">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-white font-semibold truncate">{task.title}</h3>
                  <StatusBadge status={task.status} />
                </div>
                <p className="text-slate-400 text-sm mt-1">{task.category} &middot; {parseFloat(String(task.budget_min))}-{parseFloat(String(task.budget_max))} {task.currency}</p>
              </Link>
            ))}
          </div>
        )}

        {tab === 'working' && (
          <div className="space-y-3 animate-fade-in">
            {data.tasks_working.length === 0 ? (
              <p className="text-slate-400">No active work.</p>
            ) : data.tasks_working.map((task) => (
              <Link key={task.id} to={`/tasks/${task.slug}`} className="block bg-card-dark rounded-xl border border-border-dark p-5 hover:border-primary/40 cursor-pointer">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-white font-semibold truncate">{task.title}</h3>
                  <StatusBadge status={task.status} />
                </div>
              </Link>
            ))}
          </div>
        )}

        {tab === 'bids' && (
          <div className="space-y-3 animate-fade-in">
            {data.my_bids.length === 0 ? (
              <p className="text-slate-400">No bids yet.</p>
            ) : data.my_bids.map((bid) => (
              <Link key={bid.id} to={`/tasks/${bid.task_slug || bid.task_id}`} className="block bg-card-dark rounded-xl border border-border-dark p-5 hover:border-primary/40 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    {bid.task_title && <p className="text-white font-semibold">{bid.task_title}</p>}
                    <p className="text-primary font-semibold">{parseFloat(String(bid.price)).toLocaleString()} {bid.currency}</p>
                  </div>
                  <StatusBadge status={bid.status} />
                </div>
                <p className="text-slate-400 text-sm mt-1">{bid.pitch}</p>
              </Link>
            ))}
          </div>
        )}

        {tab === 'earnings' && (
          <div className="animate-fade-in">
            <div className="flex gap-3 mb-6">
              <select
                value={earningsRole}
                onChange={(e) => { setEarningsRole(e.target.value as typeof earningsRole); setEarningsPage(1); }}
                aria-label="Filter by role"
                className="h-10 px-3 bg-card-dark border border-border-dark rounded-lg text-sm text-slate-100 cursor-pointer [color-scheme:dark]"
              >
                <option value="all">All Transactions</option>
                <option value="seller">Earnings (as Seller)</option>
                <option value="buyer">Spending (as Buyer)</option>
              </select>
            </div>

            {earningsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
              </div>
            ) : !earnings || earnings.transactions.length === 0 ? (
              <p className="text-slate-400">No transactions yet.</p>
            ) : (
              <>
                <p className="text-slate-500 text-sm mb-4">{earnings.total} transaction{earnings.total !== 1 ? 's' : ''}</p>
                <div className="space-y-3">
                  {earnings.transactions.map((tx: EarningsTransaction) => (
                    <Link key={tx.id} to={`/tasks/${tx.task_id}`} className="block bg-card-dark rounded-xl border border-border-dark p-5 hover:border-primary/40 cursor-pointer">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate">{tx.task_title}</p>
                          <p className="text-slate-400 text-sm mt-1">
                            {tx.role === 'seller' ? 'From' : 'To'} {tx.counterparty_name} &middot; {formatDate(tx.released_at || tx.locked_at, true)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`font-bold text-lg ${tx.role === 'seller' ? 'text-green-400' : 'text-red-400'}`}>
                            {tx.role === 'seller' ? '+' : '-'}{parseFloat(String(tx.amount)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {tx.currency}
                          </p>
                          <p className="text-slate-500 text-xs capitalize">{tx.status}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {earnings.total > earnings.per_page && (
                  <div className="flex justify-center gap-2 mt-6">
                    <button
                      onClick={() => setEarningsPage(p => Math.max(1, p - 1))}
                      disabled={earningsPage === 1}
                      className="size-10 rounded-lg text-sm font-bold bg-card-dark text-slate-300 border border-border-dark hover:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">chevron_left</span>
                    </button>
                    <span className="flex items-center text-slate-400 text-sm px-3">
                      Page {earningsPage} of {Math.ceil(earnings.total / earnings.per_page)}
                    </span>
                    <button
                      onClick={() => setEarningsPage(p => p + 1)}
                      disabled={earningsPage >= Math.ceil(earnings.total / earnings.per_page)}
                      className="size-10 rounded-lg text-sm font-bold bg-card-dark text-slate-300 border border-border-dark hover:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">chevron_right</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        </div>
      </div>
    </main>
  );
}
