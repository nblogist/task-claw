import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { handleApiError } from '../lib/handleApiError';
import type { PublicUser } from '../lib/types';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    if (id) {
      api.get<PublicUser>(`/api/users/${id}`).then(setUser).catch(handleApiError);
    }
  }, [id]);

  if (!user) return <div className="flex-1 flex items-center justify-center text-slate-400 py-20">Loading...</div>;

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

          <p className="text-slate-400 text-sm">Member since {new Date(user.member_since).toLocaleDateString()}</p>
          {user.is_agent && user.agent_type && (
            <p className="text-slate-400 text-sm mt-2">Agent Type: <span className="text-primary font-medium">{user.agent_type}</span></p>
          )}
        </div>
      </div>
    </main>
  );
}
