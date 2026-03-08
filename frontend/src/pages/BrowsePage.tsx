import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { handleApiError } from '../lib/handleApiError';
import type { Task, TaskListResponse, CategoryItem } from '../lib/types';
import TaskCard from '../components/TaskCard';

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const page = parseInt(searchParams.get('page') || '1');
  const category = searchParams.get('category') || '';
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || '';

  useEffect(() => {
    api.get<CategoryItem[]>('/api/categories').then(setCategories).catch(handleApiError);
  }, []);

  const fetchTasks = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('per_page', '12');
    if (category) params.set('category', category);
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);

    api.get<TaskListResponse>(`/api/tasks?${params}`).then((r) => {
      setTasks(r.tasks);
      setTotal(r.total);
      setTotalPages(r.total_pages);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }).catch((e) => { handleApiError(e); setLoading(false); });
  };

  useEffect(() => { fetchTasks(); }, [page, category, status, search, sort]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('per_page', '12');
      if (category) params.set('category', category);
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      if (sort) params.set('sort', sort);
      api.get<TaskListResponse>(`/api/tasks?${params}`).then((r) => {
        setTasks(r.tasks);
        setTotal(r.total);
        setTotalPages(r.total_pages);
      }).catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [page, category, status, search, sort]);

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.set('page', '1');
    setSearchParams(params);
  };

  return (
    <main className="flex-1 px-4 sm:px-6 md:px-20 py-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-2">Browse Tasks</h1>
        <p className="text-slate-400 mb-8">{total} tasks available</p>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search tasks..."
            aria-label="Search tasks"
            className="w-full h-12 px-4 bg-card-dark border border-border-dark rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary outline-none"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              clearTimeout(debounceRef.current);
              debounceRef.current = setTimeout(() => setFilter('search', e.target.value), 350);
            }}
          />
        </div>

        {/* Category Filter */}
        <div className="mb-8 overflow-x-auto flex-nowrap flex gap-2 pb-2 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
          <button
            onClick={() => setFilter('category', '')}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              !category ? 'bg-primary text-white' : 'bg-card-dark text-slate-300 border border-border-dark hover:border-primary/40'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setFilter('category', cat.name)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                category === cat.name ? 'bg-primary text-white' : 'bg-card-dark text-slate-300 border border-border-dark hover:border-primary/40'
              }`}
            >
              {cat.name} ({cat.task_count})
            </button>
          ))}
        </div>

        {/* Sort & Status Filter */}
        <div className="flex flex-wrap gap-3 mb-8">
          <select
            value={status}
            onChange={(e) => setFilter('status', e.target.value)}
            aria-label="Filter by status"
            className="h-10 px-3 bg-card-dark border border-border-dark rounded-lg text-sm text-slate-100 cursor-pointer [color-scheme:dark]"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="bidding">Bidding</option>
            <option value="in_escrow">In Escrow</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="disputed">Disputed</option>
            <option value="dispute_resolved">Dispute Resolved</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setFilter('sort', e.target.value)}
            aria-label="Sort tasks"
            className="h-10 px-3 bg-card-dark border border-border-dark rounded-lg text-sm text-slate-100 cursor-pointer [color-scheme:dark]"
          >
            <option value="">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="budget_desc">Budget: High to Low</option>
            <option value="budget_asc">Budget: Low to High</option>
            <option value="deadline">Deadline: Soonest</option>
          </select>
        </div>

        <p className="text-slate-500 text-sm mb-4">{tasks.length} of {total} tasks shown</p>

        {/* Task Grid */}
        <div className="min-h-[400px]">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-card-dark border border-border-dark p-6 flex flex-col gap-5">
                <div className="skeleton h-5 w-16" />
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-6 w-full" />
                <div className="skeleton h-4 w-3/4" />
                <div className="pt-4 border-t border-border-dark flex justify-between">
                  <div className="skeleton h-8 w-24" />
                  <div className="skeleton h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20 text-slate-400">No tasks found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
        </div>

        {/* Pagination (windowed) */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button
              onClick={() => setFilter('page', String(Math.max(1, page - 1)))}
              disabled={page === 1}
              className="size-10 rounded-lg text-sm font-bold transition-colors cursor-pointer bg-card-dark text-slate-300 border border-border-dark hover:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            {(() => {
              const window = 2;
              const pages: (number | '...')[] = [];
              if (page > window + 1) { pages.push(1); if (page > window + 2) pages.push('...'); }
              for (let i = Math.max(1, page - window); i <= Math.min(totalPages, page + window); i++) pages.push(i);
              if (page < totalPages - window) { if (page < totalPages - window - 1) pages.push('...'); pages.push(totalPages); }
              return pages.map((p, idx) =>
                p === '...' ? (
                  <span key={`dots-${idx}`} className="text-slate-500 px-1">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setFilter('page', String(p))}
                    className={`size-10 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                      p === page ? 'bg-primary text-white' : 'bg-card-dark text-slate-300 border border-border-dark hover:border-primary/40'
                    }`}
                  >
                    {p}
                  </button>
                )
              );
            })()}
            <button
              onClick={() => setFilter('page', String(Math.min(totalPages, page + 1)))}
              disabled={page === totalPages}
              className="size-10 rounded-lg text-sm font-bold transition-colors cursor-pointer bg-card-dark text-slate-300 border border-border-dark hover:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
