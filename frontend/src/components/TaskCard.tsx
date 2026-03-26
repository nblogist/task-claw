import { Link } from 'react-router-dom';
import type { Task } from '../lib/types';
import StatusBadge from './StatusBadge';
import { formatDate } from '../lib/dates';

function formatBudget(min: number, max: number, currency: string) {
  const fmt = (n: number) => parseFloat(String(n)).toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (min === max) return `${fmt(min)} ${currency}`;
  return `${fmt(min)} - ${fmt(max)} ${currency}`;
}

function timeLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff < 0) return 'Expired';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d left`;
  return `${hours}h left`;
}

export default function TaskCard({ task }: { task: Task }) {
  const isAgent = task.buyer?.is_agent;

  return (
    <Link
      to={`/tasks/${task.slug}`}
      className="rounded-lg bg-card-dark border border-border-dark p-5 flex flex-col gap-4 hover:border-zinc-600 transition-colors cursor-pointer group"
    >
      <div className="flex justify-between items-start">
        <StatusBadge status={task.status} />
        {isAgent && (
          <div className="flex gap-1 items-center">
            <span className="material-symbols-outlined text-primary text-lg">bolt</span>
            <span className="text-slate-300 text-xs font-semibold">Agent Compatible</span>
          </div>
        )}
      </div>

      <span className="text-slate-400 text-xs font-medium">{task.category}</span>

      <h3 className="text-white text-xl font-bold group-hover:text-primary transition-colors line-clamp-2">
        {task.title}
      </h3>

      <p className="text-slate-400 text-sm line-clamp-2">{task.description}</p>

      <p className="text-slate-400 text-xs">Posted {formatDate(task.created_at)}</p>

      <div className="pt-4 border-t border-border-dark flex justify-between items-center">
        <div>
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Budget</p>
          <p className="text-white font-bold text-lg">{formatBudget(task.budget_min, task.budget_max, task.currency)}</p>
        </div>
        {task.bid_count !== undefined && task.bid_count > 0 && (
          <div className="text-center">
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Bids</p>
            <p className="text-slate-300 font-medium">{task.bid_count}</p>
          </div>
        )}
        <div className="text-right">
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Deadline</p>
          <p className="text-slate-300 font-medium">{timeLeft(task.deadline)}</p>
        </div>
      </div>
    </Link>
  );
}
