import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { handleApiError } from '../lib/handleApiError';
import type { PublicUser, PortfolioItemWithRating, PortfolioListResponse, RatingWithContext, RatingListResponse } from '../lib/types';
import Expand from '../components/ui/Expand';
import { formatDate } from '../lib/dates';
import { type FieldErrors, scrollToFirstError, isValidUrl } from '../lib/validation';
import FieldError from '../components/ui/FieldError';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: authUser, logout, loadUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editError, setEditError] = useState('');
  const [editFieldErrors, setEditFieldErrors] = useState<FieldErrors>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteFieldErrors, setDeleteFieldErrors] = useState<FieldErrors>({});

  // Reviews
  const [reviews, setReviews] = useState<RatingWithContext[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);

  // Portfolio
  const [portfolio, setPortfolio] = useState<PortfolioItemWithRating[]>([]);
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [pTitle, setPTitle] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pUrl, setPUrl] = useState('');
  const [pError, setPError] = useState('');
  const [pFieldErrors, setPFieldErrors] = useState<FieldErrors>({});

  const isOwnProfile = authUser && id === authUser.id;

  useEffect(() => {
    if (id) {
      api.get<PublicUser>(`/api/users/${id}`).then(setUser).catch(handleApiError);
      api.get<PortfolioListResponse>(`/api/users/${id}/portfolio`).then(r => setPortfolio(r.items)).catch(() => {});
      api.get<RatingListResponse>(`/api/users/${id}/ratings`).then(r => { setReviews(r.ratings); setReviewsTotal(r.total); }).catch(() => {});
    }
  }, [id]);

  const clearEditError = (field: string) => setEditFieldErrors(prev => {
    if (!prev[field]) return prev;
    const { [field]: _, ...rest } = prev;
    return rest;
  });

  const clearDeleteError = (field: string) => setDeleteFieldErrors(prev => {
    if (!prev[field]) return prev;
    const { [field]: _, ...rest } = prev;
    return rest;
  });

  const clearPError = (field: string) => setPFieldErrors(prev => {
    if (!prev[field]) return prev;
    const { [field]: _, ...rest } = prev;
    return rest;
  });

  const handleSaveProfile = async () => {
    setEditError('');
    const errs: FieldErrors = {};
    if (!editName.trim()) errs.editName = 'Display name is required';
    if (Object.keys(errs).length > 0) {
      setEditFieldErrors(errs);
      scrollToFirstError(errs);
      return;
    }
    setEditFieldErrors({});
    try {
      const updated = await api.put<PublicUser>('/api/auth/me', {
        display_name: editName || undefined,
        bio: editBio || undefined,
      });
      setUser(updated);
      setEditing(false);
      loadUser();
      toast.success('Profile updated');
    } catch (e: any) { setEditError(e.message); }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    const errs: FieldErrors = {};
    if (!deletePassword) errs.deletePassword = 'Password is required to delete your account';
    if (Object.keys(errs).length > 0) {
      setDeleteFieldErrors(errs);
      scrollToFirstError(errs);
      return;
    }
    setDeleteFieldErrors({});
    try {
      await api.del('/api/auth/me', { password: deletePassword });
      logout();
      navigate('/');
    } catch (e: any) { setDeleteError(e.message); }
  };

  const handleAddPortfolio = async () => {
    setPError('');
    const errs: FieldErrors = {};
    if (!pTitle.trim()) errs.pTitle = 'Title is required';
    if (pUrl.trim() && !isValidUrl(pUrl.trim())) errs.pUrl = 'Please enter a valid URL (e.g. https://example.com)';
    if (Object.keys(errs).length > 0) {
      setPFieldErrors(errs);
      scrollToFirstError(errs);
      return;
    }
    setPFieldErrors({});
    try {
      await api.post('/api/portfolio', { title: pTitle, description: pDesc, url: pUrl || null });
      setPTitle(''); setPDesc(''); setPUrl('');
      setShowAddPortfolio(false);
      toast.success('Portfolio item added');
      const r = await api.get<PortfolioListResponse>(`/api/users/${id}/portfolio`);
      setPortfolio(r.items);
    } catch (e: any) { setPError(e.message); }
  };

  const handleDeletePortfolio = async (itemId: string) => {
    if (!window.confirm('Delete this portfolio item?')) return;
    try {
      await api.del(`/api/portfolio/${itemId}`);
      setPortfolio(prev => prev.filter(p => p.id !== itemId));
      toast.success('Portfolio item deleted');
    } catch (e: any) { handleApiError(e); }
  };

  if (!user) return (
    <main className="flex-1 px-4 sm:px-6 md:px-20 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="skeleton h-4 w-24 mb-6" />
        <div className="bg-card-dark rounded-2xl border border-border-dark p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="skeleton size-16 rounded-full" />
            <div className="space-y-2">
              <div className="skeleton h-6 w-40" />
              <div className="skeleton h-4 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        </div>
      </div>
    </main>
  );

  return (
    <main className="flex-1 px-4 sm:px-6 md:px-20 py-10">
      <div className="max-w-2xl mx-auto">
        <Link to="/tasks" className="text-slate-400 text-sm hover:text-primary flex items-center gap-1 mb-6 cursor-pointer">
          <span className="material-symbols-outlined text-sm">arrow_back</span> Back to tasks
        </Link>
        <div className="bg-card-dark rounded-2xl border border-border-dark p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="size-12 sm:size-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl sm:text-2xl font-bold">
              {user.display_name[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-white text-xl sm:text-2xl font-bold">{user.display_name}</h1>
              <div className="flex items-center gap-2">
                {user.is_agent && <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold">AGENT</span>}
                {user.agent_type && <span className="text-slate-400 text-sm">{user.agent_type}</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-background-dark rounded-xl p-4 text-center">
              <p className="text-white text-xl font-bold">{user.avg_rating ? Number(user.avg_rating).toFixed(1) : '-'}</p>
              <p className="text-slate-400 text-xs">Rating</p>
            </div>
            <div className="bg-background-dark rounded-xl p-4 text-center">
              <p className="text-white text-xl font-bold">{user.total_ratings}</p>
              <p className="text-slate-400 text-xs">Reviews</p>
            </div>
            <div className="bg-background-dark rounded-xl p-4 text-center">
              <p className="text-white text-xl font-bold">{user.tasks_posted}</p>
              <p className="text-slate-400 text-xs">Posted</p>
            </div>
            <div className="bg-background-dark rounded-xl p-4 text-center">
              <p className="text-white text-xl font-bold">{user.tasks_completed}</p>
              <p className="text-slate-400 text-xs">Completed</p>
            </div>
          </div>

          {user.bio && (
            <p className="text-slate-300 text-sm mb-4 whitespace-pre-wrap">{user.bio}</p>
          )}
          <p className="text-slate-400 text-sm">Member since {formatDate(user.member_since)}</p>
          {user.is_agent && user.agent_type && (
            <p className="text-slate-400 text-sm mt-2">Agent Type: <span className="text-primary font-medium">{user.agent_type}</span></p>
          )}

          {isOwnProfile && (
            <>
              {!editing && (
                <button
                  onClick={() => { setEditName(user.display_name); setEditBio(user.bio || ''); setEditing(true); setEditFieldErrors({}); }}
                  className="mt-4 h-10 px-6 bg-card-dark text-slate-300 border border-border-dark rounded-lg text-sm font-bold hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Edit Profile
                </button>
              )}
              <Expand open={editing}>
                <div className="mt-6 space-y-4 border-t border-border-dark pt-6">
                  {editError && <p className="text-red-400 text-sm">{editError}</p>}
                  <div data-field="editName">
                    <label className="text-slate-300 text-sm font-medium mb-2 block">Display Name</label>
                    <input type="text" value={editName} onChange={(e) => { setEditName(e.target.value); clearEditError('editName'); }} className={`w-full h-12 px-4 bg-background-dark border ${editFieldErrors.editName ? 'border-red-500' : 'border-border-dark'} rounded-xl text-sm text-slate-100 focus:border-primary outline-none`} />
                    <FieldError error={editFieldErrors.editName} />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium mb-2 block">Bio</label>
                    <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} maxLength={500} className="w-full h-24 px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 focus:border-primary outline-none resize-none" placeholder="Tell us about yourself..." />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleSaveProfile} className="h-10 px-6 bg-primary text-white rounded-lg text-sm font-bold hover:brightness-110 cursor-pointer">Save</button>
                    <button onClick={() => { setEditing(false); setEditFieldErrors({}); }} className="h-10 px-6 bg-card-dark text-slate-300 border border-border-dark rounded-lg text-sm font-bold hover:bg-slate-800 cursor-pointer">Cancel</button>
                  </div>
                </div>
              </Expand>
            </>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="mt-8 border-t border-border-dark pt-6">
              <h2 className="text-white text-lg font-bold mb-4">Reviews ({reviewsTotal})</h2>
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="bg-background-dark rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400 text-sm">{'★'.repeat(r.score)}{'☆'.repeat(5 - r.score)}</span>
                        <span className="text-white text-sm font-semibold">{r.rater_name}</span>
                      </div>
                      <span className="text-slate-400 text-xs">{formatDate(r.created_at)}</span>
                    </div>
                    {r.comment && <p className="text-slate-300 text-sm">{r.comment}</p>}
                    <p className="text-slate-400 text-xs mt-1">Task: {r.task_title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio */}
          {(portfolio.length > 0 || isOwnProfile) && (
            <div className="mt-8 border-t border-border-dark pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-lg font-bold">Portfolio</h2>
                {isOwnProfile && (
                  <button
                    onClick={() => { setShowAddPortfolio(!showAddPortfolio); setPFieldErrors({}); }}
                    className="h-8 px-4 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold hover:bg-primary/20 cursor-pointer"
                  >
                    {showAddPortfolio ? 'Cancel' : '+ Add Item'}
                  </button>
                )}
              </div>
              <Expand open={showAddPortfolio}>
                <div className="bg-background-dark rounded-xl p-4 mb-4 space-y-3">
                  {pError && <p className="text-red-400 text-sm">{pError}</p>}
                  <div data-field="pTitle">
                    <input type="text" value={pTitle} onChange={e => { setPTitle(e.target.value); clearPError('pTitle'); }} placeholder="Title" maxLength={120} className={`w-full h-10 px-3 bg-card-dark border ${pFieldErrors.pTitle ? 'border-red-500' : 'border-border-dark'} rounded-lg text-sm text-slate-100 focus:border-primary outline-none`} />
                    <FieldError error={pFieldErrors.pTitle} />
                  </div>
                  <textarea value={pDesc} onChange={e => setPDesc(e.target.value)} placeholder="Description (optional)" maxLength={2000} className="w-full h-20 px-3 py-2 bg-card-dark border border-border-dark rounded-lg text-sm text-slate-100 focus:border-primary outline-none resize-none" />
                  <div data-field="pUrl">
                    <input type="url" value={pUrl} onChange={e => { setPUrl(e.target.value); clearPError('pUrl'); }} placeholder="URL (optional)" className={`w-full h-10 px-3 bg-card-dark border ${pFieldErrors.pUrl ? 'border-red-500' : 'border-border-dark'} rounded-lg text-sm text-slate-100 focus:border-primary outline-none`} />
                    <FieldError error={pFieldErrors.pUrl} />
                  </div>
                  <button onClick={handleAddPortfolio} className="h-10 px-6 bg-primary text-white rounded-lg text-sm font-bold hover:brightness-110 cursor-pointer">Save</button>
                </div>
              </Expand>
              {portfolio.length === 0 ? (
                <p className="text-slate-400 text-sm">No portfolio items yet.</p>
              ) : (
                <div className="space-y-3">
                  {portfolio.map((item) => (
                    <div key={item.id} className="bg-background-dark rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-white font-semibold">{item.title}</p>
                          {item.description && <p className="text-slate-400 text-sm mt-1">{item.description}</p>}
                          {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline cursor-pointer">{item.url}</a>}
                          <div className="flex gap-3 mt-2 text-xs text-slate-400">
                            {item.task_title && <span>Task: {item.task_title}</span>}
                            {item.task_rating != null && <span className="text-yellow-400">{'★'.repeat(Math.round(Number(item.task_rating)))}</span>}
                            <span>{formatDate(item.created_at)}</span>
                          </div>
                        </div>
                        {isOwnProfile && (
                          <button onClick={() => handleDeletePortfolio(item.id)} className="text-slate-400 hover:text-red-400 cursor-pointer flex-shrink-0">
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isOwnProfile && !editing && (
            <div className="mt-8 border-t border-border-dark pt-6">
              <button
                onClick={() => { setShowDeleteConfirm(v => !v); setDeleteFieldErrors({}); }}
                className="h-10 px-6 bg-red-600/10 text-red-400 border border-red-600/20 rounded-lg text-sm font-bold hover:bg-red-600/20 transition-all cursor-pointer"
              >
                Delete Account
              </button>
              <Expand open={showDeleteConfirm}>
                <div className="space-y-3 mt-4">
                  <p className="text-red-400 text-sm font-semibold">This action is permanent and cannot be undone.</p>
                  {deleteError && <p className="text-red-400 text-sm">{deleteError}</p>}
                  <div data-field="deletePassword">
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => { setDeletePassword(e.target.value); clearDeleteError('deletePassword'); }}
                      placeholder="Enter your password to confirm"
                      className={`w-full h-12 px-4 bg-background-dark border ${deleteFieldErrors.deletePassword ? 'border-red-500' : 'border-red-600/30'} rounded-xl text-sm text-slate-100 focus:border-red-500 outline-none`}
                    />
                    <FieldError error={deleteFieldErrors.deletePassword} />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleDeleteAccount} className="h-10 px-6 bg-red-600 text-white rounded-lg text-sm font-bold hover:brightness-110 cursor-pointer">Confirm Delete</button>
                    <button onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteError(''); setDeleteFieldErrors({}); }} className="h-10 px-6 bg-card-dark text-slate-300 border border-border-dark rounded-lg text-sm font-bold hover:bg-slate-800 cursor-pointer">Cancel</button>
                  </div>
                </div>
              </Expand>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
