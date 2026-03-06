import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { handleApiError } from '../lib/handleApiError';
import type { PublicUser } from '../lib/types';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editError, setEditError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const isOwnProfile = authUser && id === authUser.id;

  useEffect(() => {
    if (id) {
      api.get<PublicUser>(`/api/users/${id}`).then(setUser).catch(handleApiError);
    }
  }, [id]);

  const handleSaveProfile = async () => {
    setEditError('');
    try {
      const updated = await api.put<PublicUser>('/api/auth/me', {
        display_name: editName || undefined,
        bio: editBio || undefined,
      });
      setUser(updated);
      setEditing(false);
    } catch (e: any) { setEditError(e.message); }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (!deletePassword) { setDeleteError('Password is required'); return; }
    try {
      await api.del('/api/auth/me', { password: deletePassword });
      logout();
      navigate('/');
    } catch (e: any) { setDeleteError(e.message); }
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
            <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
              {user.display_name[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold">{user.display_name}</h1>
              <div className="flex items-center gap-2">
                {user.is_agent && <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold">AGENT</span>}
                {user.agent_type && <span className="text-slate-400 text-sm">{user.agent_type}</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-background-dark rounded-xl p-4 text-center">
              <p className="text-white text-xl font-bold">{user.avg_rating ? user.avg_rating.toFixed(1) : '-'}</p>
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
          <p className="text-slate-400 text-sm">Member since {new Date(user.member_since).toLocaleDateString()}</p>
          {user.is_agent && user.agent_type && (
            <p className="text-slate-400 text-sm mt-2">Agent Type: <span className="text-primary font-medium">{user.agent_type}</span></p>
          )}

          {isOwnProfile && !editing && (
            <button
              onClick={() => { setEditName(user.display_name); setEditBio(''); setEditing(true); }}
              className="mt-4 h-10 px-6 bg-card-dark text-slate-300 border border-border-dark rounded-lg text-sm font-bold hover:bg-slate-800 transition-all cursor-pointer"
            >
              Edit Profile
            </button>
          )}

          {editing && (
            <div className="mt-6 space-y-4 border-t border-border-dark pt-6 animate-fade-in">
              {editError && <p className="text-red-400 text-sm">{editError}</p>}
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Display Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Bio</label>
                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} maxLength={500} className="w-full h-24 px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 focus:border-primary outline-none resize-none" placeholder="Tell us about yourself..." />
              </div>
              <div className="flex gap-3">
                <button onClick={handleSaveProfile} className="h-10 px-6 bg-primary text-white rounded-lg text-sm font-bold hover:brightness-110 cursor-pointer">Save</button>
                <button onClick={() => setEditing(false)} className="h-10 px-6 bg-card-dark text-slate-300 border border-border-dark rounded-lg text-sm font-bold hover:bg-slate-800 cursor-pointer">Cancel</button>
              </div>
            </div>
          )}

          {isOwnProfile && !editing && (
            <div className="mt-8 border-t border-border-dark pt-6">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="h-10 px-6 bg-red-600/10 text-red-400 border border-red-600/20 rounded-lg text-sm font-bold hover:bg-red-600/20 transition-all cursor-pointer"
                >
                  Delete Account
                </button>
              ) : (
                <div className="space-y-3 animate-fade-in">
                  <p className="text-red-400 text-sm font-semibold">This action is permanent and cannot be undone.</p>
                  {deleteError && <p className="text-red-400 text-sm">{deleteError}</p>}
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password to confirm"
                    className="w-full h-12 px-4 bg-background-dark border border-red-600/30 rounded-xl text-sm text-slate-100 focus:border-red-500 outline-none"
                  />
                  <div className="flex gap-3">
                    <button onClick={handleDeleteAccount} className="h-10 px-6 bg-red-600 text-white rounded-lg text-sm font-bold hover:brightness-110 cursor-pointer">Confirm Delete</button>
                    <button onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteError(''); }} className="h-10 px-6 bg-card-dark text-slate-300 border border-border-dark rounded-lg text-sm font-bold hover:bg-slate-800 cursor-pointer">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
