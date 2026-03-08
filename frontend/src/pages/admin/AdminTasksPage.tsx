import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '../../lib/adminApi';
import type { Task, TaskListResponse } from '../../lib/types';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../lib/dates';

const STATUSES = ['open', 'bidding', 'in_escrow', 'delivered', 'completed', 'disputed', 'dispute_resolved', 'cancelled', 'expired'];
const DEBOUNCE_MS = 400;

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchTasks = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('per_page', '20');
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);

    adminApi.get<TaskListResponse>(`/api/admin/tasks?${params}`)
      .then((data) => {
        setTasks(data.tasks);
        setTotal(data.total);
        setTotalPages(data.total_pages);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load tasks';
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, [page, statusFilter, search]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Debounced search-as-you-type
  const handleInputChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setSearch(value);
    }, DEBOUNCE_MS);
  };

  // Clean up timer on unmount
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    setPage(1);
    setSearch(searchInput);
  };

  const handleStatusChange = (value: string) => {
    setPage(1);
    setStatusFilter(value);
  };

  const handleRemove = async (task: Task) => {
    if (!window.confirm(`Are you sure you want to remove "${task.title}"? This cannot be undone.`)) {
      return;
    }

    setRemovingId(task.id);
    try {
      await adminApi.del(`/api/admin/tasks/${task.id}`);
      toast.success('Task removed');
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setTotal((prev) => prev - 1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove task';
      toast.error(message);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-white text-3xl font-bold mb-1">Task Management</h1>
          <p className="text-slate-400">View and manage all platform tasks.</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-white">{total}</p>
          <p className="text-slate-400 text-sm">{search || statusFilter ? 'matching' : 'total'} tasks</p>
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
              placeholder="Search by title, slug, category, task ID, buyer name, or email..."
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
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-card-dark border border-border-dark rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-primary/60"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <p className="text-slate-500 text-xs">
          Search by task title, slug, category, task ID, buyer name, or buyer email
        </p>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <p className="text-slate-400">Loading...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-slate-400">
            {search || statusFilter ? 'No tasks match your filters.' : 'No tasks found.'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-card-dark rounded-2xl border border-border-dark">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-slate-300">
                <thead>
                  <tr className="bg-card-dark/50">
                    <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Title</th>
                    <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Category</th>
                    <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Status</th>
                    <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Budget</th>
                    <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Bids</th>
                    <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Created</th>
                    <th className="text-slate-400 text-xs uppercase font-medium px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="border-b border-border-dark hover:bg-card-dark/30">
                      <td className="px-4 py-3">
                        <Link
                          to={`/tasks/${task.slug}`}
                          className="text-primary hover:text-primary/80 transition-colors"
                        >
                          {task.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{task.category}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {parseFloat(String(task.budget_min)).toLocaleString()}-{parseFloat(String(task.budget_max)).toLocaleString()} {task.currency}
                      </td>
                      <td className="px-4 py-3">{task.bid_count ?? 0}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDate(task.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRemove(task)}
                          disabled={removingId === task.id}
                          className="cursor-pointer text-rose-400 hover:text-rose-300 disabled:opacity-50 text-xs font-medium transition-colors"
                        >
                          {removingId === task.id ? 'Removing...' : 'Remove'}
                        </button>
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
