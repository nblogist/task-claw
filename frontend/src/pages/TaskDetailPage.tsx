import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Task, Bid, Delivery } from '../lib/types';
import StatusBadge from '../components/StatusBadge';
import Expand from '../components/ui/Expand';

interface TaskDetail extends Task {
  bid_count: number;
  buyer: { id: string; display_name: string; is_agent: boolean; avg_rating: number | null; total_ratings: number; tasks_posted: number; tasks_completed: number; member_since: string; agent_type: string | null };
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

  const isBuyer = user && task && user.id === task.buyer_id;
  const isAcceptedSeller = user && task && bids.some(b => b.seller_id === user.id && (b.status as string).toLowerCase() === 'accepted');
  const canBid = user && task && user.id !== task.buyer_id && ['open', 'bidding'].includes((task.status as string).toLowerCase());
  const alreadyBid = user && bids.some(b => b.seller_id === user?.id);

  const handleBid = async () => {
    if (!task) return;
    setError(''); setSuccess('');
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
    } catch (e: any) { setError(e.message); }
  };

  const handleAcceptBid = async (bidId: string) => {
    if (!task) return;
    setError(''); setSuccess('');
    try {
      await api.post(`/api/tasks/${task.id}/bids/${bidId}/accept`);
      setSuccess('Bid accepted! Escrow created.');
      fetchTask();
    } catch (e: any) { setError(e.message); }
  };

  const handleDeliver = async () => {
    if (!task) return;
    setError(''); setSuccess('');
    try {
      await api.post(`/api/tasks/${task.id}/deliver`, {
        message: deliveryMsg,
        url: deliveryUrl || null,
      });
      setSuccess('Delivery submitted!');
      setDeliveryMsg(''); setDeliveryUrl('');
      fetchTask();
    } catch (e: any) { setError(e.message); }
  };

  const handleApprove = async () => {
    if (!task) return;
    if (!window.confirm('Are you sure you want to approve this delivery and release payment?')) return;
    setError(''); setSuccess('');
    try {
      await api.post(`/api/tasks/${task.id}/approve`);
      setSuccess('Delivery approved! Payment released.');
      fetchTask();
    } catch (e: any) { setError(e.message); }
  };

  const handleRevision = async () => {
    if (!task) return;
    setError(''); setSuccess('');
    try {
      await api.post(`/api/tasks/${task.id}/revision`, {
        message: revisionMessage.trim() || null,
      });
      setSuccess('Revision requested.');
      setShowRevisionForm(false);
      setRevisionMessage('');
      fetchTask();
    } catch (e: any) { setError(e.message); }
  };

  const handleDispute = async () => {
    if (!task || !disputeReason.trim()) return;
    setError(''); setSuccess('');
    try {
      await api.post(`/api/tasks/${task.id}/dispute`, { reason: disputeReason.trim() });
      setSuccess('Dispute raised.');
      setShowDisputeForm(false);
      setDisputeReason('');
      fetchTask();
    } catch (e: any) { setError(e.message); }
  };

  const handleWithdrawBid = async (bidId: string) => {
    if (!task) return;
    setError(''); setSuccess('');
    try {
      await api.del(`/api/tasks/${task.id}/bids/${bidId}`);
      setSuccess('Bid withdrawn.');
      fetchTask();
    } catch (e: any) { setError(e.message); }
  };

  const handleRate = async () => {
    if (!task || ratingScore === 0) return;
    setError(''); setSuccess('');
    try {
      await api.post(`/api/tasks/${task.id}/rate`, { score: ratingScore, comment: ratingComment || null });
      setSuccess('Rating submitted!');
      setRatingScore(0);
      setRatingComment('');
      setHasRated(true);
      fetchTask();
    } catch (e: any) { setError(e.message); }
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
  if (!task) return <div className="flex-1 flex items-center justify-center text-slate-400 py-20">Task not found.</div>;

  const statusStr = typeof task.status === 'string' ? task.status.toLowerCase().replace(' ', '_') : task.status;

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
            <span className="text-slate-500 text-sm">{task.view_count} views</span>
          </div>

          <h1 className="text-white text-3xl font-bold mb-4">{task.title}</h1>

          <div className="flex flex-wrap gap-2 mb-6">
            <span className="px-3 py-1 rounded-lg bg-card-dark border border-border-dark text-slate-300 text-xs font-medium">{task.category}</span>
            {task.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-lg bg-card-dark border border-border-dark text-slate-400 text-xs">{tag}</span>
            ))}
          </div>

          <div className="bg-card-dark rounded-2xl border border-border-dark p-6 mb-8">
            <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{task.description}</p>
          </div>

          {/* Escrow Label */}
          {(statusStr === 'in_escrow' || statusStr === 'inescrow') && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-yellow-500">lock</span>
              <div>
                <p className="text-yellow-400 font-semibold">Simulated Escrow</p>
                <p className="text-yellow-500/70 text-sm">Funds are tracked in our database ledger. On-chain escrow coming in v2.</p>
              </div>
            </div>
          )}

          {/* Error/Success */}
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 text-red-400 text-sm animate-fade-in">{error}</div>}
          {success && <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4 text-green-400 text-sm animate-fade-in">{success}</div>}

          {/* Bid Form */}
          {canBid && !alreadyBid && (
            <div className="bg-card-dark rounded-2xl border border-border-dark p-6 mb-8 animate-fade-in">
              <h2 className="text-white text-xl font-bold mb-4">Submit a Bid</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <input type="number" placeholder={`Price (${parseFloat(String(task.budget_min)).toLocaleString()} - ${parseFloat(String(task.budget_max)).toLocaleString()})`} value={bidPrice} onChange={(e) => setBidPrice(e.target.value)} className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary outline-none" />
                <input type="number" placeholder="Delivery days" value={bidDays} onChange={(e) => setBidDays(e.target.value)} className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary outline-none" />
              </div>
              <textarea placeholder="Your pitch (max 500 chars)" value={bidPitch} onChange={(e) => setBidPitch(e.target.value)} className="w-full h-24 px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary outline-none resize-none mb-4" />
              <button onClick={handleBid} className="h-12 px-8 bg-primary text-white rounded-xl font-bold hover:brightness-110 transition-all cursor-pointer">Submit Bid</button>
            </div>
          )}

          {/* Delivery Form (for accepted seller) */}
          {isAcceptedSeller && (statusStr === 'in_escrow' || statusStr === 'inescrow') && (
            <div className="bg-card-dark rounded-2xl border border-border-dark p-6 mb-8 animate-fade-in">
              <h2 className="text-white text-xl font-bold mb-4">Submit Delivery</h2>
              <textarea placeholder="Delivery message (max 1000 chars)" value={deliveryMsg} onChange={(e) => setDeliveryMsg(e.target.value)} className="w-full h-24 px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary outline-none resize-none mb-4" />
              <input type="url" placeholder="URL (optional)" value={deliveryUrl} onChange={(e) => setDeliveryUrl(e.target.value)} className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary outline-none mb-4" />
              <button onClick={handleDeliver} className="h-12 px-8 bg-primary text-white rounded-xl font-bold hover:brightness-110 transition-all cursor-pointer">Submit Delivery</button>
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
                <button onClick={handleApprove} className="w-full sm:w-auto h-12 px-8 bg-green-600 text-white rounded-xl font-bold hover:brightness-110 transition-all cursor-pointer">Approve & Release Payment</button>
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
                    <button onClick={handleRevision} className="h-10 px-6 bg-primary text-white rounded-lg text-sm font-bold hover:brightness-110 transition-all cursor-pointer">Submit Revision Request</button>
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
                    <button onClick={handleDispute} disabled={!disputeReason.trim()} className="h-10 px-6 bg-red-600 text-white rounded-lg text-sm font-bold hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">Submit Dispute</button>
                    <button onClick={() => { setShowDisputeForm(false); setDisputeReason(''); }} className="h-10 px-6 bg-card-dark text-slate-300 border border-border-dark rounded-lg text-sm font-bold hover:bg-slate-800 transition-all cursor-pointer">Cancel</button>
                  </div>
                </div>
              </Expand>
            </div>
          )}

          {/* Seller Dispute Option */}
          {isAcceptedSeller && (statusStr === 'delivered' || statusStr === 'in_escrow' || statusStr === 'inescrow') && (
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
                    <button onClick={handleDispute} disabled={!disputeReason.trim()} className="h-10 px-6 bg-red-600 text-white rounded-lg text-sm font-bold hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">Submit Dispute</button>
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
                    <p className="text-slate-500 text-xs mt-2">{new Date(d.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
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
                disabled={ratingScore === 0}
                className="h-12 px-8 bg-primary text-white rounded-xl font-bold hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Rating
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
                    </div>
                    {isBuyer && bid.status === 'Pending' && (statusStr === 'open' || statusStr === 'bidding') && (
                      <button onClick={() => handleAcceptBid(bid.id)} className="mt-3 h-10 px-6 bg-primary text-white rounded-lg text-sm font-bold hover:brightness-110 cursor-pointer">Accept Bid</button>
                    )}
                    {user && bid.seller_id === user.id && bid.status === 'Pending' && (
                      <button onClick={() => handleWithdrawBid(bid.id)} className="mt-3 h-10 px-6 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg text-sm font-bold hover:bg-red-600/30 cursor-pointer">Withdraw Bid</button>
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
              <p className="text-slate-200">{new Date(task.deadline).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">Posted by</p>
              <Link to={`/profile/${task.buyer_id}`} className="text-white font-semibold hover:text-primary cursor-pointer">
                {task.buyer?.display_name}
              </Link>
              {task.buyer?.is_agent && <span className="ml-2 text-primary text-xs font-bold">AGENT</span>}
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
