import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '../../lib/adminApi';
import { formatDate } from '../../lib/dates';

const DEBOUNCE_MS = 400;
const ROLES = ['', 'human', 'agent', 'banned'] as const;

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  bio: string | null;
  is_agent: boolean;
  agent_type: string | null;
  is_banned: boolean;
  avg_rating: number | string | null;
  total_ratings: number;
  tasks_posted: number;
  tasks_completed: number;
  created_at: string;
}

interface AdminUserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('per_page', '20');
    if (roleFilter) params.set('role', roleFilter);
    if (search) params.set('search', search);

    adminApi.get<AdminUserListResponse>(`/api/admin/users?${params}`)
      .then((data) => {
        setUsers(data.users);
        setTotal(data.total);
        setTotalPages(data.total_pages);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load users';
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, [page, roleFilter, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleInputChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setSearch(value);
    }, DEBOUNCE_MS);
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    setPage(1);
    setSearch(searchInput);
  };

  const handleRoleChange = (value: string) => {
    setPage(1);
    setRoleFilter(value);
  };

  const handleToggleBan = async (user: AdminUser) => {
    const action = user.is_banned ? 'unban' : 'ban';
    if (!window.confirm(`Are you sure you want to ${action} "${user.display_name}" (${user.email})?`)) {
      return;
    }
    setTogglingId(user.id);
    try {
      await adminApi.post(`/api/admin/users/${user.id}/${action}`, {});
      toast.success(`User ${action}ned`);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_banned: !u.is_banned } : u));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : `Failed to ${action} user`;
      toast.error(message);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-white text-3xl font-bold mb-1">User Management</h1>
          <p className="text-slate-400">View and manage all platform users.</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-white">{total}</p>
          <p className="text-slate-400 text-sm">{search || roleFilter ? 'matching' : 'total'} users</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Search users..."
              className="flex-1 bg-card-dark border border-border-dark rounded-lg px-4 py-2.5 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-primary/60"
            />
            <button
              type="submit"
              className="cursor-pointer bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:brightness-110 transition-all"
            >
              Search
            </button>
            {(search || searchInput) && (
              <button
                type="button"
                onClick={() => { clearTimeout(debounceRef.current); setSearchInput(''); setSearch(''); setPage(1); }}
                className="cursor-pointer bg-card-dark border border-border-dark text-slate-400 px-4 py-2.5 rounded-lg text-sm hover:text-white transition-colors"
              >
                Clear
              </button>
            )}
          </form>
          <select
            value={roleFilter}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="bg-card-dark border border-border-dark rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-primary/60"
          >
            <option value="">All users</option>
            {ROLES.filter(Boolean).map((r) => (
              <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}{r === 'banned' ? '' : 's'}</option>
            ))}
          </select>
        </div>
        <p className="text-slate-500 text-xs">
          Search by name, email, or user ID
        </p>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <p className="text-slate-400">Loading...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-slate-400">
            {search || roleFilter ? 'No users match your filters.' : 'No users found.'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-card-dark rounded-2xl border border-border-dark">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-slate-300">
                <thead>
                  <tr className="bg-card-dark/50">
                    <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Name</th>
                    <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Email</th>
                    <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Type</th>
                    <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Rating</th>
                    <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Posted</th>
                    <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Done</th>
                    <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Joined</th>
                    <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Status</th>
                    <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border-dark hover:bg-card-dark/30">
                      <td className="px-4 py-3">
                        <Link
                          to={`/profile/${user.id}`}
                          className="text-primary hover:text-primary/80 transition-colors"
                        >
                          {user.display_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          user.is_agent
                            ? 'bg-purple-500/10 text-purple-400'
                            : 'bg-sky-500/10 text-sky-400'
                        }`}>
                          {user.is_agent ? (user.agent_type || 'Agent') : 'Human'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {user.avg_rating
                          ? `${parseFloat(String(user.avg_rating)).toFixed(1)} (${user.total_ratings})`
                          : <span className="text-slate-500">-</span>
                        }
                      </td>
                      <td className="px-4 py-3">{user.tasks_posted}</td>
                      <td className="px-4 py-3">{user.tasks_completed}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-3">
                        {user.is_banned ? (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-400">Banned</span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            to={`/admin/tasks?search=${encodeURIComponent(user.email)}`}
                            className="text-sky-400 hover:text-sky-300 text-xs font-medium transition-colors"
                          >
                            Tasks
                          </Link>
                          <button
                            onClick={() => handleToggleBan(user)}
                            disabled={togglingId === user.id}
                            className={`cursor-pointer text-xs font-medium transition-colors disabled:opacity-50 ${
                              user.is_banned
                                ? 'text-emerald-400 hover:text-emerald-300'
                                : 'text-rose-400 hover:text-rose-300'
                            }`}
                          >
                            {togglingId === user.id ? '...' : user.is_banned ? 'Unban' : 'Ban'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="cursor-pointer bg-card-dark border border-border-dark text-slate-300 px-4 py-2 rounded-lg hover:border-primary/40 disabled:opacity-50 text-sm transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="cursor-pointer bg-card-dark border border-border-dark text-slate-300 px-4 py-2 rounded-lg hover:border-primary/40 disabled:opacity-50 text-sm transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
