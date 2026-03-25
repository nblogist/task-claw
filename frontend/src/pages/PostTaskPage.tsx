import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Task, CategoryItem } from '../lib/types';
import { type FieldErrors, scrollToFirstError } from '../lib/validation';
import FieldError from '../components/ui/FieldError';

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
  const [currency, setCurrency] = useState('CKB');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<CategoryItem[]>('/api/categories').then((cats) => {
      if (cats.length > 0) {
        const names = cats.map((c) => c.name);
        setCategories(names);
        setCategory(names[0]);
      }
    }).catch(() => {});
  }, []);

  const clearError = (field: string) => setFieldErrors(prev => {
    if (!prev[field]) return prev;
    const { [field]: _, ...rest } = prev;
    return rest;
  });

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
    const errs: FieldErrors = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!description.trim()) errs.description = 'Description is required';
    if (!budgetMin) errs.budgetMin = 'Min budget is required';
    else if (isNaN(parseFloat(budgetMin)) || parseFloat(budgetMin) < 0) errs.budgetMin = 'Must be a valid non-negative number';
    if (!budgetMax) errs.budgetMax = 'Max budget is required';
    else if (isNaN(parseFloat(budgetMax)) || parseFloat(budgetMax) < 0) errs.budgetMax = 'Must be a valid non-negative number';
    if (!errs.budgetMin && !errs.budgetMax && parseFloat(budgetMin) > parseFloat(budgetMax)) errs.budgetMax = 'Max budget must be greater than or equal to min budget';
    if (!deadline) errs.deadline = 'Deadline is required';
    else if (new Date(deadline) <= new Date()) errs.deadline = 'Deadline must be in the future';
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      scrollToFirstError(errs);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      const task = await api.post<Task>('/api/tasks', {
        title,
        description,
        category,
        tags: tags.split(',').map((t) => t.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')).filter(Boolean),
        budget_min: parseFloat(budgetMin),
        budget_max: parseFloat(budgetMax),
        currency,
        deadline: new Date(deadline).toISOString(),
      });
      navigate(`/tasks/${task.slug}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
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

        <h1 className="text-white text-3xl font-bold mb-8">Post a New Task</h1>

        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 text-red-400 text-sm animate-fade-in">{error}</div>}

        <form onSubmit={handleSubmit} noValidate className="bg-card-dark rounded-2xl border border-border-dark p-8 space-y-6">
          <div data-field="title">
            <label className="text-slate-300 text-sm font-medium mb-2 block">Title</label>
            <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); clearError('title'); }} maxLength={120} className={`w-full h-12 px-4 bg-background-dark border ${fieldErrors.title ? 'border-red-500' : 'border-border-dark'} rounded-xl text-sm text-slate-100 focus:border-primary outline-none`} placeholder="What do you need done?" />
            <div className="flex justify-between">
              <FieldError error={fieldErrors.title} />
              <p className="text-slate-400 text-xs mt-1 text-right ml-auto">{title.length}/120</p>
            </div>
          </div>

          <div data-field="description">
            <label className="text-slate-300 text-sm font-medium mb-2 block">Description</label>
            <textarea value={description} onChange={(e) => { setDescription(e.target.value); clearError('description'); }} maxLength={2000} className={`w-full h-32 px-4 py-3 bg-background-dark border ${fieldErrors.description ? 'border-red-500' : 'border-border-dark'} rounded-xl text-sm text-slate-100 focus:border-primary outline-none resize-none`} placeholder="Describe the task in detail..." />
            <div className="flex justify-between">
              <FieldError error={fieldErrors.description} />
              <p className="text-slate-400 text-xs mt-1 text-right ml-auto">{description.length}/2000</p>
            </div>
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
            <div data-field="budgetMin">
              <label className="text-slate-300 text-sm font-medium mb-2 block">Min Budget</label>
              <input type="number" min="0" step="any" value={budgetMin} onChange={(e) => { setBudgetMin(e.target.value); clearError('budgetMin'); }} className={`w-full h-12 px-4 bg-background-dark border ${fieldErrors.budgetMin ? 'border-red-500' : 'border-border-dark'} rounded-xl text-sm text-slate-100 focus:border-primary outline-none`} placeholder="50" />
              <FieldError error={fieldErrors.budgetMin} />
            </div>
            <div data-field="budgetMax">
              <label className="text-slate-300 text-sm font-medium mb-2 block">Max Budget</label>
              <input type="number" min="0" step="any" value={budgetMax} onChange={(e) => { setBudgetMax(e.target.value); clearError('budgetMax'); }} className={`w-full h-12 px-4 bg-background-dark border ${fieldErrors.budgetMax ? 'border-red-500' : 'border-border-dark'} rounded-xl text-sm text-slate-100 focus:border-primary outline-none`} placeholder="200" />
              <FieldError error={fieldErrors.budgetMax} />
            </div>
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 cursor-pointer [color-scheme:dark]">
                <option value="CKB">CKB</option>
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
          </div>

          <div data-field="deadline">
            <label className="text-slate-300 text-sm font-medium mb-2 block">Deadline</label>
            <input type="datetime-local" value={deadline} onChange={(e) => { setDeadline(e.target.value); clearError('deadline'); }} className={`w-full h-12 px-4 bg-background-dark border ${fieldErrors.deadline ? 'border-red-500' : 'border-border-dark'} rounded-xl text-sm text-slate-100 focus:border-primary outline-none [color-scheme:dark] cursor-pointer`} />
            <FieldError error={fieldErrors.deadline} />
          </div>

          <button type="submit" disabled={submitting} className="w-full h-14 bg-primary text-white rounded-xl text-lg font-bold hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? 'Posting...' : 'Post Task'}</button>
        </form>
      </div>
    </main>
  );
}
