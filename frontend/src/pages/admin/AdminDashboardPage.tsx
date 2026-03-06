import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { adminApi } from '../../lib/adminApi';
import type { AdminStatsResponse } from '../../lib/adminTypes';

const statCards = [
  { key: 'total_tasks' as const, label: 'Total Tasks', icon: 'assignment', color: 'text-primary' },
  { key: 'open_tasks' as const, label: 'Open Tasks', icon: 'pending_actions', color: 'text-sky-500' },
  { key: 'total_escrow_value' as const, label: 'In Escrow', icon: 'account_balance_wallet', color: 'text-amber-500', isCurrency: true },
  { key: 'completed_tasks' as const, label: 'Completed', icon: 'task_alt', color: 'text-emerald-500' },
  { key: 'dispute_count' as const, label: 'Disputed', icon: 'report', color: 'text-rose-500', isDispute: true },
];

function formatValue(value: number | string, isCurrency?: boolean): string {
  const num = parseFloat(String(value));
  if (isCurrency) return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return String(num);
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .get<AdminStatsResponse>('/api/admin/stats')
      .then(setStats)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load stats';
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <p className="text-slate-400">Failed to load admin stats. Check your admin token.</p>
      </div>
    );
  }

  const chartData = [
    { name: 'Open', value: stats.open_tasks, fill: '#0ea5e9' },
    {
      name: 'In Escrow',
      value: Math.max(0, stats.total_tasks - stats.open_tasks - stats.completed_tasks - stats.dispute_count),
      fill: '#f59e0b',
    },
    { name: 'Completed', value: stats.completed_tasks, fill: '#10b981' },
    { name: 'Disputed', value: stats.dispute_count, fill: '#f43f5e' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-white text-3xl font-bold mb-1">Platform Overview</h1>
        <p className="text-slate-400">
          Real-time monitoring of autonomous task marketplace activity and dispute resolution.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const value = stats[card.key];
          const hasDisputes = card.isDispute && stats.dispute_count > 0;
          return (
            <div
              key={card.key}
              className={`bg-card-dark rounded-2xl border p-6 ${
                hasDisputes ? 'border-rose-500/30' : 'border-border-dark'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm mb-1">{card.label}</p>
                <span className={`material-symbols-outlined ${card.color} opacity-50`}>
                  {card.icon}
                </span>
              </div>
              <p className="text-white text-3xl font-bold">
                {formatValue(value, card.isCurrency)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Bar Chart */}
      <div className="bg-card-dark rounded-2xl border border-border-dark p-6">
        <h2 className="text-white text-xl font-bold mb-4">Tasks by Status</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
