import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Task, CategoryItem, TaskTemplate } from '../lib/types';

const FALLBACK_CATEGORIES = [
  'Writing & Content',
  'Research & Analysis',
  'Coding & Development',
  'Data Processing',
  'Design & Creative',
  'Agent Operations',
  'Other',
];

export default function PostTaskPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(FALLBACK_CATEGORIES[0]);
  const [tags, setTags] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');

  // Templates
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<TaskTemplate | null>(null);

  useEffect(() => {
    api.get<CategoryItem[]>('/api/tasks/categories').then((cats) => {
      if (cats.length > 0) {
        const names = cats.map((c) => c.name);
        setCategories(names);
        setCategory(names[0]);
      }
    }).catch(() => {});
    // Load user templates
    if (user) {
      api.get<TaskTemplate[]>('/api/templates').then(setTemplates).catch(() => {});
    }
  }, []);

  const applyTemplate = (t: TaskTemplate) => {
    setTitle('');
    setDescription(t.description);
    setCategory(t.category || FALLBACK_CATEGORIES[0]);
    setTags(t.tags?.join(', ') || '');
    setBudgetMin(t.budget_min != null ? String(t.budget_min) : '');
    setBudgetMax(t.budget_max != null ? String(t.budget_max) : '');
    setCurrency(t.currency || 'USD');
    setShowTemplates(false);
    setPreviewTemplate(null);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await api.del(`/api/templates/${id}`);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch { /* ignore */ }
  };

  if (!user) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center">
          <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">lock</span>
          </div>
          <h1 className="text-white text-2xl font-bold mb-2">Sign in to post a task</h1>
          <p className="text-slate-400 mb-6">You need an account to post tasks on the marketplace.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/login" className="h-12 px-6 flex items-center justify-center rounded-xl bg-primary text-white font-bold hover:brightness-110 transition-all cursor-pointer">Sign In</Link>
            <Link to="/register" className="h-12 px-6 flex items-center justify-center rounded-xl bg-card-dark text-slate-300 border border-border-dark font-bold hover:bg-slate-800 transition-all cursor-pointer">Register</Link>
          </div>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('Title is required'); return; }
    if (!description.trim()) { setError('Description is required'); return; }
    if (!budgetMin || !budgetMax) { setError('Budget range is required'); return; }
    if (parseFloat(budgetMin) < 0 || parseFloat(budgetMax) < 0) { setError('Budget cannot be negative'); return; }
    if (parseFloat(budgetMin) > parseFloat(budgetMax)) { setError('Min budget cannot exceed max budget'); return; }
    if (!deadline) { setError('Deadline is required'); return; }
    try {
      const task = await api.post<Task>('/api/tasks', {
        title,
        description,
        category,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        budget_min: parseFloat(budgetMin),
        budget_max: parseFloat(budgetMax),
        currency,
        deadline: new Date(deadline).toISOString(),
      });
      navigate(`/tasks/${task.slug}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main className="flex-1 px-4 sm:px-6 md:px-20 py-10">
      <div className="max-w-2xl mx-auto">
        {/* API Note */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">terminal</span>
          <p className="text-primary text-sm">
            Posting via API? Use <code className="font-mono bg-primary/20 px-1 rounded">POST /api/tasks</code> — no UI required.{' '}
            <Link to="/api-docs" className="underline cursor-pointer">View API Docs</Link>
          </p>
        </div>

        {/* Templates */}
        {templates.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-2 h-10 px-5 bg-card-dark text-slate-300 border border-border-dark rounded-lg text-sm font-bold hover:bg-slate-800 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">description</span>
              {showTemplates ? 'Hide Templates' : `Use a Template (${templates.length})`}
            </button>
            {showTemplates && (
              <div className="mt-3 space-y-2 animate-fade-in">
                {templates.map((t) => (
                  <div key={t.id} className="bg-card-dark rounded-xl border border-border-dark p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-semibold">{t.name}</p>
                      <p className="text-slate-400 text-sm mt-1 truncate">{t.description || 'No description'}</p>
                      <div className="flex gap-3 mt-2 text-xs text-slate-500">
                        <span>{t.category}</span>
                        {t.budget_min != null && t.budget_max != null && <span>{t.budget_min}-{t.budget_max} {t.currency}</span>}
                        {t.tags?.length > 0 && <span>{t.tags.join(', ')}</span>}
                      </div>
                      {previewTemplate?.id === t.id && (
                        <div className="mt-3 bg-background-dark rounded-lg p-3 text-sm text-slate-300 whitespace-pre-wrap animate-fade-in">
                          {t.description || 'No description'}
                          {t.specifications && (
                            <pre className="mt-2 text-xs text-slate-500 overflow-x-auto">{JSON.stringify(t.specifications, null, 2)}</pre>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setPreviewTemplate(previewTemplate?.id === t.id ? null : t)}
                        className="h-8 px-3 bg-card-dark text-slate-400 border border-border-dark rounded-lg text-xs hover:text-white cursor-pointer"
                      >
                        {previewTemplate?.id === t.id ? 'Hide' : 'Preview'}
                      </button>
                      <button
                        onClick={() => applyTemplate(t)}
                        className="h-8 px-3 bg-primary text-white rounded-lg text-xs font-bold hover:brightness-110 cursor-pointer"
                      >
                        Use
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(t.id)}
                        className="h-8 px-3 text-slate-500 hover:text-red-400 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <h1 className="text-white text-3xl font-bold mb-8">Post a New Task</h1>

        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 text-red-400 text-sm animate-fade-in">{error}</div>}

        <form onSubmit={handleSubmit} className="bg-card-dark rounded-2xl border border-border-dark p-8 space-y-6">
          <div>
            <label className="text-slate-300 text-sm font-medium mb-2 block">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 focus:border-primary outline-none" placeholder="What do you need done?" />
            <p className="text-slate-500 text-xs mt-1 text-right">{title.length}/120</p>
          </div>

          <div>
            <label className="text-slate-300 text-sm font-medium mb-2 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required maxLength={2000} className="w-full h-32 px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 focus:border-primary outline-none resize-none" placeholder="Describe the task in detail..." />
            <p className="text-slate-500 text-xs mt-1 text-right">{description.length}/2000</p>
          </div>

          <div>
            <label className="text-slate-300 text-sm font-medium mb-2 block">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 cursor-pointer [color-scheme:dark]">
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-slate-300 text-sm font-medium mb-2 block">Tags (comma separated)</label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 focus:border-primary outline-none" placeholder="ai, automation, writing" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">Min Budget</label>
              <input type="number" min="0" step="any" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} required className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 focus:border-primary outline-none" placeholder="50" />
            </div>
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">Max Budget</label>
              <input type="number" min="0" step="any" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} required className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 focus:border-primary outline-none" placeholder="200" />
            </div>
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 cursor-pointer [color-scheme:dark]">
                <option value="USD">USD</option>
                <option value="CKB">CKB</option>
                <option value="ETH">ETH</option>
                <option value="SOL">SOL</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-300 text-sm font-medium mb-2 block">Deadline</label>
            <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} required className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 focus:border-primary outline-none [color-scheme:dark] cursor-pointer" />
          </div>

          <button type="submit" className="w-full h-14 bg-primary text-white rounded-xl text-lg font-bold hover:brightness-110 transition-all cursor-pointer">Post Task</button>
        </form>
      </div>
    </main>
  );
}
