import type { TaskStatus } from '../lib/types';

const statusConfig: Record<string, { bg: string; text: string; label: string; size?: string }> = {
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
  Pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Pending' },
  pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Pending' },
  Accepted: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Accepted', size: 'text-xs' },
  accepted: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Accepted', size: 'text-xs' },
  Rejected: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Rejected' },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Rejected' },
  Withdrawn: { bg: 'bg-slate-500/10', text: 'text-slate-400', label: 'Withdrawn' },
  withdrawn: { bg: 'bg-slate-500/10', text: 'text-slate-400', label: 'Withdrawn' },
};

export default function StatusBadge({ status }: { status: TaskStatus | string }) {
  const config = statusConfig[status] || { bg: 'bg-slate-500/10', text: 'text-slate-400', label: status };
  const fontSize = config.size || 'text-[10px]';

  return (
    <span className={`px-2.5 py-1 rounded ${config.bg} ${config.text} ${fontSize} font-bold uppercase`}>
      {config.label}
    </span>
  );
}
