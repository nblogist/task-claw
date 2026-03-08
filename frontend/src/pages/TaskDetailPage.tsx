import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Task, Bid, Delivery, MessageWithSender, MessageListResponse } from '../lib/types';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../lib/dates';
import Expand from '../components/ui/Expand';

interface TaskDetail extends Task {
  bid_count: number;
  buyer: { id: string; display_name: string; bio: string | null; is_agent: boolean; avg_rating: number | null; total_ratings: number; tasks_posted: number; tasks_completed: number; member_since: string; agent_type: string | null };
}

type BidWithSeller = Bid;

export default function TaskDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [bids, setBids] = useState<BidWithSeller[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  // Bid form
  const [bidPrice, setBidPrice] = useState('');
  const [bidDays, setBidDays] = useState('');
  const [bidPitch, setBidPitch] = useState('');

  // Delivery form
  const [deliveryMsg, setDeliveryMsg] = useState('');
  const [deliveryUrl, setDeliveryUrl] = useState('');

  // Rating form
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [hasRated, setHasRated] = useState(false);

  // Revision form
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState('');

  // Dispute form
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  // Task edit
  const [showEditForm, setShowEditForm] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBudgetMin, setEditBudgetMin] = useState('');
  const [editBudgetMax, setEditBudgetMax] = useState('');

  // Bid edit
  const [editingBidId, setEditingBidId] = useState<string | null>(null);
  const [editBidPrice, setEditBidPrice] = useState('');
  const [editBidDays, setEditBidDays] = useState('');
  const [editBidPitch, setEditBidPitch] = useState('');

  // Messages
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messagesOpen, setMessagesOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchTask = async () => {
    if (!slug) return;
    try {
      const t = await api.get<TaskDetail>(`/api/tasks/${slug}`);
      setTask(t);
      if ((t as any).my_rating) setHasRated(true);
      const b = await api.get<BidWithSeller[]>(`/api/tasks/${slug}/bids`);
      setBids(b);
      if (t.id) {
        const d = await api.get<Delivery[]>(`/api/tasks/${t.id}/deliveries`).catch(() => []);
        setDeliveries(d);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load task');
    }
    setLoading(false);
  };

  useEffect(() => { fetchTask(); }, [slug]);

  const fetchMessages = async () => {
    if (!task) return;
    try {
      const res = await api.get<MessageListResponse>(`/api/tasks/${task.id}/messages?per_page=100`);
      setMessages(res.messages);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch { /* not a participant or no messages */ }
  };

  useEffect(() => {
    if (task && messagesOpen) fetchMessages();
  }, [task?.id, messagesOpen]);

  const handleSendMessage = async () => {
    if (!task || !newMessage.trim() || submitting) return;
    setSubmitting(true);
    try {
      await api.post(`/api/tasks/${task.id}/messages`, { content: newMessage.trim() });
      setNewMessage('');
      await fetchMessages();
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const isBuyer = user && task && user.id === task.buyer_id;
  const isAcceptedSeller = user && task && bids.some(b => b.seller_id === user.id && b.status === 'accepted');
  const canBid = user && task && user.id !== task.buyer_id && ['open', 'bidding'].includes(task.status);
  const alreadyBid = user && bids.some(b => b.seller_id === user?.id);

  const handleBid = async () => {
    if (!task || submitting) return;
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      await api.post(`/api/tasks/${task.id}/bids`, {
        price: parseFloat(bidPrice),
        currency: task.currency,
        estimated_delivery_days: parseInt(bidDays),
        pitch: bidPitch,
      });
      setSuccess('Bid submitted!');
      setBidPrice(''); setBidDays(''); setBidPitch('');
      fetchTask();
    } catch (e: any) { setError(e.message); } finally { setSubmitting(false); }
  };

  const handleAcceptBid = async (bidId: string) => {
    if (!task || submitting) return;
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      await api.post(`/api/tasks/${task.id}/bids/${bidId}/accept`);
      setSuccess('Bid accepted! Escrow created.');
      fetchTask();
    } catch (e: any) { setError(e.message); } finally { setSubmitting(false); }
  };

  const handleDeliver = async () => {
    if (!task || submitting) return;
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      await api.post(`/api/tasks/${task.id}/deliver`, {
        message: deliveryMsg,
        url: deliveryUrl || null,
      });
      setSuccess('Delivery submitted!');
      setDeliveryMsg(''); setDeliveryUrl('');
      fetchTask();
    } catch (e: any) { setError(e.message); } finally { setSubmitting(false); }
  };

  const handleApprove = async () => {
    if (!task || submitting) return;
    if (!window.confirm('Are you sure you want to approve this delivery and release payment?')) return;
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      await api.post(`/api/tasks/${task.id}/approve`);
      setSuccess('Delivery approved! Payment released.');
      fetchTask();
    } catch (e: any) { setError(e.message); } finally { setSubmitting(false); }
  };

  const handleRevision = async () => {
    if (!task || submitting) return;
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      await api.post(`/api/tasks/${task.id}/revision`, {
        message: revisionMessage.trim() || null,
      });
      setSuccess('Revision requested.');
      setShowRevisionForm(false);
      setRevisionMessage('');
      fetchTask();
    } catch (e: any) { setError(e.message); } finally { setSubmitting(false); }
  };

  const handleDispute = async () => {
    if (!task || !disputeReason.trim() || submitting) return;
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      await api.post(`/api/tasks/${task.id}/dispute`, { reason: disputeReason.trim() });
      setSuccess('Dispute raised.');
      setShowDisputeForm(false);
      setDisputeReason('');
      fetchTask();
    } catch (e: any) { setError(e.message); } finally { setSubmitting(false); }
  };

  const handleWithdrawBid = async (bidId: string) => {
    if (!task || submitting) return;
    if (!window.confirm('Are you sure you want to withdraw this bid? This cannot be undone.')) return;
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      await api.del(`/api/tasks/${task.id}/bids/${bidId}`);
      setSuccess('Bid withdrawn.');
      fetchTask();
    } catch (e: any) { setError(e.message); } finally { setSubmitting(false); }
  };

  const handleRate = async () => {
    if (!task || ratingScore === 0 || submitting) return;
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      await api.post(`/api/tasks/${task.id}/rate`, { score: ratingScore, comment: ratingComment || null });
      setSuccess('Rating submitted!');
      setRatingScore(0);
      setRatingComment('');
      setHasRated(true);
      fetchTask();
    } catch (e: any) { setError(e.message); } finally { setSubmitting(false); }
  };

  const handleEditTask = async () => {
    if (!task || submitting) return;
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      const body: Record<string, unknown> = {};
      if (editTitle.trim() && editTitle !== task.title) body.title = editTitle;
      if (editDescription.trim() && editDescription !== task.description) body.description = editDescription;
      if (editBudgetMin && parseFloat(editBudgetMin) !== parseFloat(String(task.budget_min))) body.budget_min = parseFloat(editBudgetMin);
      if (editBudgetMax && parseFloat(editBudgetMax) !== parseFloat(String(task.budget_max))) body.budget_max = parseFloat(editBudgetMax);
      await api.put(`/api/tasks/${task.id}`, body);
      setSuccess('Task updated.');
      setShowEditForm(false);
      fetchTask();
    } catch (e: any) { setError(e.message); } finally { setSubmitting(false); }
  };

  const handleCancelTask = async () => {
    if (!task || submitting) return;
    if (!window.confirm('Are you sure you want to cancel this task? All bidders will be notified.')) return;
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      await api.del(`/api/tasks/${task.id}`);
      setSuccess('Task cancelled.');
      fetchTask();
    } catch (e: any) { setError(e.message); } finally { setSubmitting(false); }
  };

  const handleEditBid = async (bidId: string) => {
    if (!task || submitting) return;
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      await api.put(`/api/tasks/${task.id}/bids/${bidId}`, {
        price: parseFloat(editBidPrice),
        estimated_delivery_days: parseInt(editBidDays),
        pitch: editBidPitch,
      });
      setSuccess('Bid updated.');
      setEditingBidId(null);
      fetchTask();
    } catch (e: any) { setError(e.message); } finally { setSubmitting(false); }
  };

  const handleRejectBid = async (bidId: string) => {
    if (!task || submitting) return;
    if (!window.confirm('Reject this bid?')) return;
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      await api.post(`/api/tasks/${task.id}/bids/${bidId}/reject`);
      setSuccess('Bid rejected.');
      fetchTask();
    } catch (e: any) { setError(e.message); } finally { setSubmitting(false); }
  };

  if (loading) return (
    <main className="flex-1 px-4 sm:px-6 md:px-20 py-10">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0 space-y-4">
          <div className="skeleton h-6 w-20" />
          <div className="skeleton h-10 w-3/4" />
          <div className="flex gap-2"><div className="skeleton h-6 w-24" /><div className="skeleton h-6 w-16" /></div>
          <div className="skeleton h-40 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
        </div>
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    </main>
  );
  if (!task) return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="bg-card-dark rounded-2xl border border-border-dark p-10 text-center max-w-md">
        <span className="material-symbols-outlined text-5xl text-slate-600 mb-4">search_off</span>
        <h2 className="text-white text-xl font-bold mb-2">Task Not Found</h2>
        <p className="text-slate-400 mb-6">The task you're looking for doesn't exist or may have been removed.</p>
        <Link to="/tasks" className="inline-flex h-10 px-6 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold hover:brightness-110 transition-all cursor-pointer">
          Back to Marketplace
        </Link>
      </div>
    </div>
  );

  const statusStr = task.status;

  return (
    <main className="flex-1 px-4 sm:px-6 md:px-20 py-10">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-4 flex items-center gap-3">
            <StatusBadge status={task.status} />
            {task.buyer?.is_agent && (
              <span className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase">Agent Compatible</span>
            )}
            {task.priority && task.priority !== 'normal' && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                'bg-slate-500/20 text-slate-400'
              }`}>{task.priority}</span>
            )}
            <span className="text-slate-500 text-sm">{task.view_count} views</span>
          </div>

          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-white text-3xl font-bold">{task.title}</h1>
            {isBuyer && (statusStr === 'open' || statusStr === 'bidding') && (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => { setEditTitle(task.title); setEditDescription(task.description); setEditBudgetMin(String(task.budget_min)); setEditBudgetMax(String(task.budget_max)); setShowEditForm(!showEditForm); }}
                  className="h-9 px-4 bg-card-dark text-slate-300 border border-border-dark rounded-lg text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={handleCancelTask}
                  disabled={submitting}
                  className="h-9 px-4 bg-red-600/10 text-red-400 border border-red-600/20 rounded-lg text-xs font-bold hover:bg-red-600/20 cursor-pointer disabled:opacity-50"
                >
                  Cancel Task
                </button>
              </div>
            )}
          </div>

          {/* Edit Task Form */}
          <Expand open={showEditForm}>
            <div className="bg-card-dark rounded-2xl border border-border-dark p-6 mb-6 space-y-4 animate-fade-in">
              <h3 className="text-white font-bold">Edit Task</h3>
              <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} maxLength={120} className="w-full h-10 px-3 bg-background-dark border border-border-dark rounded-lg text-sm text-slate-100 focus:border-primary outline-none" placeholder="Title" />
              <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} maxLength={2000} className="w-full h-24 px-3 py-2 bg-background-dark border border-border-dark rounded-lg text-sm text-slate-100 focus:border-primary outline-none resize-none" placeholder="Description" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={editBudgetMin} onChange={e => setEditBudgetMin(e.target.value)} className="h-10 px-3 bg-background-dark border border-border-dark rounded-lg text-sm text-slate-100 focus:border-primary outline-none" placeholder="Min budget" />
                <input type="number" value={editBudgetMax} onChange={e => setEditBudgetMax(e.target.value)} className="h-10 px-3 bg-background-dark border border-border-dark rounded-lg text-sm text-slate-100 focus:border-primary outline-none" placeholder="Max budget" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleEditTask} disabled={submitting} className="h-10 px-6 bg-primary text-white rounded-lg text-sm font-bold hover:brightness-110 cursor-pointer disabled:opacity-50">Save</button>
                <button onClick={() => setShowEditForm(false)} className="h-10 px-6 bg-card-dark text-slate-300 border border-border-dark rounded-lg text-sm font-bold hover:bg-slate-800 cursor-pointer">Cancel</button>
              </div>
            </div>
          </Expand>

          <div className="flex flex-wrap gap-2 mb-6">
            <span className="px-3 py-1 rounded-lg bg-card-dark border border-border-dark text-slate-300 text-xs font-medium">{task.category}</span>
            {task.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-lg bg-card-dark border border-border-dark text-slate-400 text-xs">{tag}</span>
            ))}
          </div>

          <div className="bg-card-dark rounded-2xl border border-border-dark p-6 mb-8">
            <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{task.description}</p>
          </div>

          {/* Specifications */}
          {task.specifications && Object.keys(task.specifications).length > 0 && (
            <div className="bg-card-dark rounded-2xl border border-border-dark p-6 mb-8">
              <h3 className="text-white font-bold mb-3">Specifications</h3>
              <div className="space-y-2">
                {Object.entries(task.specifications).map(([key, value]) => (
                  <div key={key} className="flex gap-3 text-sm">
                    <span className="text-slate-400 font-medium min-w-[120px]">{key}:</span>
                    <span className="text-slate-200">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dispute Resolved Banner */}
          {statusStr === 'dispute_resolved' && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6 flex items-center gap-3 animate-fade-in">
              <span className="material-symbols-outlined text-orange-400">gavel</span>
              <div>
                <p className="text-orange-400 font-semibold">Dispute Resolved</p>
                {task.dispute_resolved_in_favor_of && (
                  <p className="text-orange-400/70 text-sm">
                    Resolved in favor of the <strong className="text-orange-300">{task.dispute_resolved_in_favor_of}</strong>.
                    {task.dispute_resolved_in_favor_of === 'buyer'
                      ? ' Escrow funds have been refunded.'
                      : ' Escrow funds have been released to the seller.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Escrow Label */}
          {(statusStr === 'in_escrow') && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-yellow-500">lock</span>
              <div>
                <p className="text-yellow-400 font-semibold">Simulated Escrow</p>
                <p className="text-yellow-500/70 text-sm">Funds are tracked in our database ledger. On-chain escrow coming in v2.</p>
              </div>
            </div>
          )}

          {/* Auto-approve countdown banner */}
          {statusStr === 'delivered' && deliveries.length > 0 && (() => {
            const latestDelivery = deliveries[0];
            const deliveredAt = new Date(latestDelivery.created_at).getTime();
            const autoApproveAt = deliveredAt + 72 * 60 * 60 * 1000;
            const now = Date.now();
            const hoursLeft = Math.max(0, Math.ceil((autoApproveAt - now) / (1000 * 60 * 60)));
            const isUrgent = hoursLeft <= 24;
            return (
              <div className={`${isUrgent ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'} border rounded-xl p-4 mb-6 animate-fade-in`}>
                <div className="flex items-start gap-3">
                  <span className={`material-symbols-outlined ${isUrgent ? 'text-red-400' : 'text-amber-400'} mt-0.5`}>schedule</span>
                  <div>
                    <p className={`${isUrgent ? 'text-red-400' : 'text-amber-400'} font-semibold`}>
                      {hoursLeft <= 0 ? 'Auto-approval imminent' : `Auto-approves in ~${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`}
                    </p>
                    <p className={`${isUrgent ? 'text-red-400/70' : 'text-amber-400/70'} text-sm mt-1`}>
                      {isBuyer
                        ? 'If you don\'t approve, request a revision, or raise a dispute before the deadline, the delivery will be automatically approved and payment released from escrow.'
                        : 'The buyer has not yet reviewed your delivery. If no action is taken, the delivery will be auto-approved and payment released.'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Error/Success */}
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 text-red-400 text-sm animate-fade-in">{error}</div>}
          {success && <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4 text-green-400 text-sm animate-fade-in">{success}</div>}

          {/* Bid Form */}
          {canBid && !alreadyBid && (
            <div className="bg-card-dark rounded-2xl border border-border-dark p-6 mb-8 animate-fade-in">
              <h2 className="text-white text-xl font-bold mb-4">Submit a Bid</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <input type="number" placeholder={`Price (${parseFloat(String(task.budget_min)).toLocaleString()} - ${parseFloat(String(task.budget_max)).toLocaleString()})`} value={bidPrice} onChange={(e) => setBidPrice(e.target.value)} className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary outline-none" />
                <input type="number" placeholder="Delivery days (1-365)" min={1} max={365} value={bidDays} onChange={(e) => setBidDays(e.target.value)} className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary outline-none" />
              </div>
              <textarea placeholder="Your pitch (max 500 chars)" value={bidPitch} onChange={(e) => setBidPitch(e.target.value)} className="w-full h-24 px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary outline-none resize-none mb-4" />
              <button onClick={handleBid} disabled={submitting} className="h-12 px-8 bg-primary text-white rounded-xl font-bold hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? 'Submitting...' : 'Submit Bid'}</button>
            </div>
          )}

          {/* Delivery Form (for accepted seller) */}
          {isAcceptedSeller && (statusStr === 'in_escrow') && (
            <div className="bg-card-dark rounded-2xl border border-border-dark p-6 mb-8 animate-fade-in">
              <h2 className="text-white text-xl font-bold mb-4">Submit Delivery</h2>
              <textarea placeholder="Delivery message (max 1000 chars)" value={deliveryMsg} onChange={(e) => setDeliveryMsg(e.target.value)} className="w-full h-24 px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary outline-none resize-none mb-4" />
              <input type="url" placeholder="URL (optional)" value={deliveryUrl} onChange={(e) => setDeliveryUrl(e.target.value)} className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary outline-none mb-4" />
              <button onClick={handleDeliver} disabled={submitting} className="h-12 px-8 bg-primary text-white rounded-xl font-bold hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? 'Submitting...' : 'Submit Delivery'}</button>
            </div>
          )}

          {/* Buyer Approve/Revision */}
          {isBuyer && (statusStr === 'delivered') && (
            <div className="bg-card-dark rounded-2xl border border-border-dark p-6 mb-8 animate-fade-in">
              <h2 className="text-white text-xl font-bold mb-4">Review Delivery</h2>
              {deliveries.length > 0 && (
                <div className="bg-background-dark rounded-xl p-4 mb-4">
                  <p className="text-slate-200">{deliveries[0].message}</p>
                  {deliveries[0].url && <a href={deliveries[0].url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm cursor-pointer">{deliveries[0].url}</a>}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={handleApprove} disabled={submitting} className="w-full sm:w-auto h-12 px-8 bg-green-600 text-white rounded-xl font-bold hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? 'Processing...' : 'Approve & Release Payment'}</button>
                <button onClick={() => setShowRevisionForm(!showRevisionForm)} className="w-full sm:w-auto h-12 px-8 bg-card-dark text-slate-300 border border-border-dark rounded-xl font-bold hover:bg-slate-800 transition-all cursor-pointer">Request Revision</button>
                <button onClick={() => setShowDisputeForm(!showDisputeForm)} className="w-full sm:w-auto h-12 px-8 bg-red-600/20 text-red-400 border border-red-600/30 rounded-xl font-bold hover:bg-red-600/30 transition-all cursor-pointer">Raise Dispute</button>
              </div>
              <Expand open={showRevisionForm}>
                <div className="mt-4 space-y-3">
                  <textarea
                    value={revisionMessage}
                    onChange={(e) => setRevisionMessage(e.target.value)}
                    placeholder="What changes do you need? (optional)"
                    className="w-full h-24 px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary outline-none resize-none"
                  />
                  <div className="flex gap-3">
                    <button onClick={handleRevision} disabled={submitting} className="h-10 px-6 bg-primary text-white rounded-lg text-sm font-bold hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? 'Submitting...' : 'Submit Revision Request'}</button>
                    <button onClick={() => { setShowRevisionForm(false); setRevisionMessage(''); }} className="h-10 px-6 bg-card-dark text-slate-300 border border-border-dark rounded-lg text-sm font-bold hover:bg-slate-800 transition-all cursor-pointer">Cancel</button>
                  </div>
                </div>
              </Expand>
              <Expand open={showDisputeForm}>
                <div className="mt-4 space-y-3">
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Describe the reason for this dispute..."
                    className="w-full h-24 px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500 outline-none resize-none"
                  />
                  <div className="flex gap-3">
                    <button onClick={handleDispute} disabled={!disputeReason.trim() || submitting} className="h-10 px-6 bg-red-600 text-white rounded-lg text-sm font-bold hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? 'Submitting...' : 'Submit Dispute'}</button>
                    <button onClick={() => { setShowDisputeForm(false); setDisputeReason(''); }} className="h-10 px-6 bg-card-dark text-slate-300 border border-border-dark rounded-lg text-sm font-bold hover:bg-slate-800 transition-all cursor-pointer">Cancel</button>
                  </div>
                </div>
              </Expand>
            </div>
          )}

          {/* Seller Dispute Option */}
          {isAcceptedSeller && (statusStr === 'delivered' || statusStr === 'in_escrow') && (
            <div className="mb-6">
              <button onClick={() => setShowDisputeForm(!showDisputeForm)} className="h-10 px-6 bg-red-600/20 text-red-400 border border-red-600/30 rounded-xl text-sm font-bold hover:bg-red-600/30 transition-all cursor-pointer">Raise Dispute</button>
              <Expand open={showDisputeForm}>
                <div className="mt-3 space-y-3">
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Describe the reason for this dispute..."
                    className="w-full h-24 px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500 outline-none resize-none"
                  />
                  <div className="flex gap-3">
                    <button onClick={handleDispute} disabled={!disputeReason.trim() || submitting} className="h-10 px-6 bg-red-600 text-white rounded-lg text-sm font-bold hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? 'Submitting...' : 'Submit Dispute'}</button>
                    <button onClick={() => { setShowDisputeForm(false); setDisputeReason(''); }} className="h-10 px-6 bg-card-dark text-slate-300 border border-border-dark rounded-lg text-sm font-bold hover:bg-slate-800 transition-all cursor-pointer">Cancel</button>
                  </div>
                </div>
              </Expand>
            </div>
          )}

          {/* Deliveries List */}
          {deliveries.length > 0 && (
            <div className="mb-8 animate-fade-in">
              <h2 className="text-white text-xl font-bold mb-4">Deliveries ({deliveries.length})</h2>
              <div className="space-y-3">
                {deliveries.map((d) => (
                  <div key={d.id} className="bg-card-dark rounded-xl border border-border-dark p-5">
                    <p className="text-slate-200 mb-2">{d.message}</p>
                    {d.url && <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm cursor-pointer">{d.url}</a>}
                    {d.revision_of && <p className="text-slate-500 text-xs mt-1">Revision of previous delivery</p>}
                    <p className="text-slate-500 text-xs mt-2">{formatDate(d.created_at, true)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {user && (isBuyer || isAcceptedSeller || (canBid && alreadyBid)) && (
            <div className="mb-8">
              <button
                onClick={() => setMessagesOpen(!messagesOpen)}
                className="flex items-center gap-2 text-white text-xl font-bold mb-4 cursor-pointer hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-xl">{messagesOpen ? 'expand_less' : 'chat'}</span>
                Messages {messages.length > 0 && `(${messages.length})`}
              </button>
              <Expand open={messagesOpen}>
                <div className="bg-card-dark rounded-2xl border border-border-dark p-5">
                  {/* Message thread */}
                  <div className="max-h-80 overflow-y-auto space-y-3 mb-4">
                    {messages.length === 0 ? (
                      <p className="text-slate-400 text-sm">No messages yet. Start the conversation.</p>
                    ) : messages.map((msg) => (
                      <div key={msg.id} className={`flex flex-col ${msg.sender_id === user.id ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] rounded-xl px-4 py-3 ${msg.sender_id === user.id ? 'bg-primary/20 text-slate-100' : 'bg-background-dark text-slate-200'}`}>
                          <p className="text-xs font-bold mb-1 text-slate-400">{msg.sender_name}</p>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{formatDate(msg.created_at, true)}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  {/* Message input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                      placeholder="Type a message..."
                      maxLength={2000}
                      className="flex-1 h-10 px-4 bg-background-dark border border-border-dark rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary outline-none"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || submitting}
                      className="h-10 px-4 bg-primary text-white rounded-lg text-sm font-bold hover:brightness-110 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-base">send</span>
                    </button>
                  </div>
                </div>
              </Expand>
            </div>
          )}

          {/* Rating Form */}
          {user && task && statusStr === 'completed' && (isBuyer || isAcceptedSeller) && !hasRated && (
            <div className="bg-card-dark rounded-2xl border border-border-dark p-6 mb-8 animate-fade-in">
              <h2 className="text-white text-xl font-bold mb-4">Rate this experience</h2>
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingScore(star)}
                    aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                    className={`cursor-pointer transition-colors ${star <= ratingScore ? 'text-yellow-400' : 'text-slate-600'}`}
                  >
                    <span className="material-symbols-outlined text-3xl">star</span>
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Comment (optional)"
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                className="w-full h-20 px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary outline-none resize-none mb-4"
              />
              <button
                onClick={handleRate}
                disabled={ratingScore === 0 || submitting}
                className="h-12 px-8 bg-primary text-white rounded-xl font-bold hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          )}

          {/* Bids List */}
          <div>
            <h2 className="text-white text-xl font-bold mb-4">Bids ({task.bid_count})</h2>
            {bids.length === 0 ? (
              <p className="text-slate-400">No bids yet.</p>
            ) : (
              <div className="space-y-4">
                {bids.map((bid) => (
                  <div key={bid.id} className="bg-card-dark rounded-xl border border-border-dark p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Link to={`/profile/${bid.seller_id}`} className="text-white font-semibold hover:text-primary cursor-pointer">
                          {bid.seller?.display_name || 'Unknown'}
                        </Link>
                        {bid.seller?.is_agent && <span className="ml-2 text-primary text-xs font-bold">AGENT</span>}
                        {bid.seller?.avg_rating && <span className="ml-2 text-yellow-400 text-xs">{'★'.repeat(Math.round(bid.seller.avg_rating))}</span>}
                      </div>
                      <StatusBadge status={bid.status} />
                    </div>
                    <p className="text-slate-300 text-sm mb-3">{bid.pitch}</p>
                    <div className="flex gap-6 text-sm">
                      <span className="text-white font-bold">{parseFloat(String(bid.price)).toLocaleString()} {bid.currency}</span>
                      <span className="text-slate-400">Est. {bid.estimated_delivery_days} day{bid.estimated_delivery_days !== 1 ? 's' : ''} delivery</span>
                      <span className="text-slate-500 text-xs">{formatDate(bid.created_at)}</span>
                    </div>
                    {isBuyer && bid.status === 'pending' && (statusStr === 'open' || statusStr === 'bidding') && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => handleAcceptBid(bid.id)} disabled={submitting} className="h-10 px-6 bg-primary text-white rounded-lg text-sm font-bold hover:brightness-110 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? 'Accepting...' : 'Accept Bid'}</button>
                        <button onClick={() => handleRejectBid(bid.id)} disabled={submitting} className="h-10 px-6 bg-red-600/10 text-red-400 border border-red-600/20 rounded-lg text-sm font-bold hover:bg-red-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">Reject</button>
                      </div>
                    )}
                    {user && bid.seller_id === user.id && bid.status === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => { setEditingBidId(editingBidId === bid.id ? null : bid.id); setEditBidPrice(String(bid.price)); setEditBidDays(String(bid.estimated_delivery_days)); setEditBidPitch(bid.pitch); }}
                          className="h-10 px-6 bg-card-dark text-slate-300 border border-border-dark rounded-lg text-sm font-bold hover:bg-slate-800 cursor-pointer"
                        >
                          Edit Bid
                        </button>
                        <button onClick={() => handleWithdrawBid(bid.id)} disabled={submitting} className="h-10 px-6 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg text-sm font-bold hover:bg-red-600/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? 'Withdrawing...' : 'Withdraw Bid'}</button>
                      </div>
                    )}
                    {editingBidId === bid.id && (
                      <div className="mt-3 space-y-3 bg-background-dark rounded-xl p-4 animate-fade-in">
                        <div className="grid grid-cols-2 gap-3">
                          <input type="number" value={editBidPrice} onChange={e => setEditBidPrice(e.target.value)} className="h-10 px-3 bg-card-dark border border-border-dark rounded-lg text-sm text-slate-100 focus:border-primary outline-none" placeholder="Price" />
                          <input type="number" value={editBidDays} onChange={e => setEditBidDays(e.target.value)} className="h-10 px-3 bg-card-dark border border-border-dark rounded-lg text-sm text-slate-100 focus:border-primary outline-none" placeholder="Days" />
                        </div>
                        <textarea value={editBidPitch} onChange={e => setEditBidPitch(e.target.value)} className="w-full h-20 px-3 py-2 bg-card-dark border border-border-dark rounded-lg text-sm text-slate-100 focus:border-primary outline-none resize-none" placeholder="Pitch" />
                        <div className="flex gap-2">
                          <button onClick={() => handleEditBid(bid.id)} disabled={submitting} className="h-9 px-5 bg-primary text-white rounded-lg text-sm font-bold hover:brightness-110 cursor-pointer disabled:opacity-50">Save</button>
                          <button onClick={() => setEditingBidId(null)} className="h-9 px-5 bg-card-dark text-slate-300 border border-border-dark rounded-lg text-sm font-bold hover:bg-slate-800 cursor-pointer">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-card-dark rounded-2xl border border-border-dark p-6 space-y-6 lg:sticky lg:top-24">
            <div>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">Budget</p>
              <p className="text-white text-2xl font-bold">
                {parseFloat(String(task.budget_min)).toLocaleString()} - {parseFloat(String(task.budget_max)).toLocaleString()} {task.currency}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">Deadline</p>
              <p className="text-slate-200">{formatDate(task.deadline, true)} <span className="text-slate-500 text-xs">(local time)</span></p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">Posted by</p>
              <Link to={`/profile/${task.buyer_id}`} className="text-white font-semibold hover:text-primary cursor-pointer">
                {task.buyer?.display_name}
              </Link>
              {task.buyer?.is_agent && <span className="ml-2 text-primary text-xs font-bold">AGENT</span>}
              <p className="text-slate-500 text-xs mt-1">{formatDate(task.created_at, true)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">Category</p>
              <p className="text-slate-200">{task.category}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
