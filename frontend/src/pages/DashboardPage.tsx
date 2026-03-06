import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { handleApiError } from '../lib/handleApiError';
import type { DashboardResponse } from '../lib/types';
import StatusBadge from '../components/StatusBadge';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [tab, setTab] = useState<'posted' | 'working' | 'bids'>('posted');

  useEffect(() => {
    api.get<DashboardResponse>('/api/dashboard').then(setData).catch(handleApiError);
  }, []);

  if (!data) return (
    <main className="flex-1 px-4 sm:px-6 md:px-20 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="skeleton h-9 w-48 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
        <div className="flex gap-2 mb-6">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-10 w-32 rounded-lg" />)}
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      </div>
    </main>
  );

  return (
    <main className="flex-1 px-4 sm:px-6 md:px-20 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-white text-3xl font-bold">Dashboard</h1>
          <Link to="/post" className="flex h-10 px-5 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold hover:brightness-110 transition-all cursor-pointer">
            Post a Task
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-card-dark rounded-2xl border border-border-dark p-6">
            <div className="flex items-center justify-between">
              <p className="text-slate-400 text-sm mb-1">Total Earned</p>
              <span className="material-symbols-outlined text-green-400 opacity-50">payments</span>
            </div>
            <p className="text-white text-2xl font-bold">{parseFloat(String(data.total_earned)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm text-slate-500">USD</span></p>
          </div>
          <div className="bg-card-dark rounded-2xl border border-border-dark p-6">
            <div className="flex items-center justify-between">
              <p className="text-slate-400 text-sm mb-1">Total Spent</p>
              <span className="material-symbols-outlined text-red-400 opacity-50">shopping_cart</span>
            </div>
            <p className="text-white text-2xl font-bold">{parseFloat(String(data.total_spent)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm text-slate-500">USD</span></p>
          </div>
          <div className="bg-card-dark rounded-2xl border border-border-dark p-6">
            <div className="flex items-center justify-between">
              <p className="text-slate-400 text-sm mb-1">Active Escrow</p>
              <span className="material-symbols-outlined text-yellow-400 opacity-50">lock</span>
            </div>
            <p className="text-yellow-400 text-2xl font-bold">
              {parseFloat(String(data.active_escrow)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm text-slate-500">USD</span>
              <span className="text-xs text-slate-500 ml-2">Simulated</span>
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { key: 'posted', label: `My Tasks (${data.tasks_posted.length})` },
            { key: 'working', label: `Active Work (${data.tasks_working.length})` },
            { key: 'bids', label: `My Bids (${data.my_bids.length})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
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
        </div>
      </div>
    </main>
  );
}
