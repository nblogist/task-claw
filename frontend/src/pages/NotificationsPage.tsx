import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

interface Notification {
  id: string;
  kind: string;
  message: string;
  task_id: string | null;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const data = await api.get<{ notifications: Notification[] } | Notification[]>('/api/notifications');
      setNotifications(Array.isArray(data) ? data : (data.notifications ?? []));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (user) fetchNotifications(); }, [user]);

  const markAllRead = async () => {
    await api.post('/api/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = async (id: string) => {
    await api.post(`/api/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  if (!user) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold mb-2">Sign in to view notifications</h1>
          <Link to="/login" className="text-primary hover:underline cursor-pointer">Sign In</Link>
        </div>
      </main>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <main className="flex-1 px-4 sm:px-6 md:px-20 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-white text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-primary text-sm font-medium hover:underline cursor-pointer">
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-slate-600 text-5xl mb-4 block">notifications_off</span>
            <p className="text-slate-400">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={`rounded-xl border p-4 transition-colors cursor-pointer ${
                  n.read
                    ? 'bg-card-dark border-border-dark'
                    : 'bg-primary/5 border-primary/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.read ? 'text-slate-400' : 'text-slate-200'}`}>{n.message}</p>
                    <p className="text-slate-500 text-xs mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  {!n.read && <span className="size-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
