import type { TaskStatus } from '../lib/types';

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Open' },
  Open: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Open' },
  bidding: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Bidding' },
  Bidding: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Bidding' },
  in_escrow: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', label: 'In Escrow' },
  InEscrow: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', label: 'In Escrow' },
  delivered: { bg: 'bg-purple-500/10', text: 'text-purple-500', label: 'Delivered' },
  Delivered: { bg: 'bg-purple-500/10', text: 'text-purple-500', label: 'Delivered' },
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Completed' },
  Completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Completed' },
  disputed: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Disputed' },
  Disputed: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Disputed' },
  cancelled: { bg: 'bg-slate-500/10', text: 'text-slate-400', label: 'Cancelled' },
  Cancelled: { bg: 'bg-slate-500/10', text: 'text-slate-400', label: 'Cancelled' },
  expired: { bg: 'bg-slate-500/10', text: 'text-slate-400', label: 'Expired' },
  Expired: { bg: 'bg-slate-500/10', text: 'text-slate-400', label: 'Expired' },
};

export default function StatusBadge({ status }: { status: TaskStatus | string }) {
  const config = statusConfig[status] || { bg: 'bg-slate-500/10', text: 'text-slate-400', label: status };

  return (
    <span className={`px-2 py-1 rounded ${config.bg} ${config.text} text-[10px] font-bold uppercase cursor-pointer`}>
      {config.label}
    </span>
  );
}
