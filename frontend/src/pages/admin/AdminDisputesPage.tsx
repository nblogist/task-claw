import { useEffect, useState, Fragment } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '../../lib/adminApi';
import type { DisputeDetail, ResolveDisputeRequest } from '../../lib/adminTypes';

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  const fetchDisputes = () => {
    adminApi
      .get<DisputeDetail[]>('/api/admin/disputes')
      .then(setDisputes)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load disputes';
        toast.error(message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (id: string, favor: 'buyer' | 'seller') => {
    setSubmitting(true);
    try {
      const body: ResolveDisputeRequest = { favor };
      if (adminNote.trim()) {
        body.admin_note = adminNote.trim();
      }
      await adminApi.post(`/api/admin/disputes/${id}/resolve`, body);
      toast.success(`Dispute resolved in favor of ${favor}`);
      setResolving(null);
      setAdminNote('');
      setLoading(true);
      fetchDisputes();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resolve dispute';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-white text-3xl font-bold mb-1">Dispute Management</h1>
        <p className="text-slate-400">Review and resolve platform disputes.</p>
      </div>

      {disputes.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-slate-400">No disputes found.</p>
        </div>
      ) : (
        <div className="bg-card-dark rounded-2xl border border-border-dark">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-300">
              <thead>
                <tr className="bg-card-dark/50">
                  <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Task</th>
                  <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Raised By</th>
                  <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Buyer</th>
                  <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Seller</th>
                  <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Reason</th>
                  <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Escrow</th>
                  <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Status</th>
                  <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Date</th>
                  <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map((d) => (
                  <Fragment key={d.id}>
                    <tr className="border-b border-border-dark hover:bg-card-dark/30">
                      <td className="px-4 py-3">
                        <Link to={`/tasks/${d.task_slug}`} className="text-primary hover:text-primary/80 hover:underline">
                          {d.task_title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {d.raised_by === d.buyer_id ? d.buyer_name : d.seller_name}
                      </td>
                      <td className="px-4 py-3">{d.buyer_name}</td>
                      <td className="px-4 py-3">{d.seller_name}</td>
                      <td className="px-4 py-3 max-w-[300px]">
                        <span className="block whitespace-normal break-words text-slate-300">
                          {d.reason}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {d.escrow_amount != null
                          ? `$${parseFloat(String(d.escrow_amount)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : '--'}
                      </td>
                      <td className="px-4 py-3">
                        {d.resolution ? (
                          <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">
                            Resolved
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-red-500/10 text-red-500 text-[10px] font-bold uppercase">
                            Unresolved
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(d.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {d.resolution ? (
                          <div className="text-xs">
                            <span className="text-emerald-400">Resolved: {d.resolution}</span>
                            {d.admin_note && (
                              <p className="text-slate-500 mt-1">{d.admin_note}</p>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setResolving(resolving === d.id ? null : d.id);
                              setAdminNote('');
                            }}
                            className="text-primary hover:text-primary/80 text-xs font-medium transition-colors"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Inline resolve form row */}
                    {resolving === d.id && !d.resolution && (
                      <tr className="bg-card-dark/20">
                        <td colSpan={9} className="px-4 pb-4 pt-3 border-b border-border-dark">
                          <div className="flex flex-wrap items-center gap-3">
                            <input
                              type="text"
                              value={adminNote}
                              onChange={(e) => setAdminNote(e.target.value)}
                              placeholder="Admin note (optional)"
                              className="flex-1 min-w-[200px] bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                            />
                            <button
                              onClick={() => handleResolve(d.id, 'buyer')}
                              disabled={submitting}
                              className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                            >
                              {submitting ? 'Resolving...' : 'Favor Buyer'}
                            </button>
                            <button
                              onClick={() => handleResolve(d.id, 'seller')}
                              disabled={submitting}
                              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                            >
                              {submitting ? 'Resolving...' : 'Favor Seller'}
                            </button>
                            <button
                              onClick={() => {
                                setResolving(null);
                                setAdminNote('');
                              }}
                              className="text-slate-400 hover:text-slate-200 text-xs transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
