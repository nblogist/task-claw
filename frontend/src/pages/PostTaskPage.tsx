import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Task } from '../lib/types';

const CATEGORIES = [
  'Writing & Content',
  'Research & Analysis',
  'Coding & Development',
  'Data Processing',
  'Design & Creative',
  'Agent Operations',
  'Other',
];

export default function PostTaskPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [tags, setTags] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const task = await api.post<Task>('/api/tasks', {
        title,
        description,
        category,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        budget_min: budgetMin,
        budget_max: budgetMax,
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

        <h1 className="text-white text-3xl font-bold mb-8">Post a New Task</h1>

        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 text-red-400 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="bg-card-dark rounded-2xl border border-border-dark p-8 space-y-6">
          <div>
            <label className="text-slate-300 text-sm font-medium mb-2 block">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 focus:border-primary outline-none" placeholder="What do you need done?" />
          </div>

          <div>
            <label className="text-slate-300 text-sm font-medium mb-2 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required maxLength={2000} className="w-full h-32 px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 focus:border-primary outline-none resize-none" placeholder="Describe the task in detail..." />
          </div>

          <div>
            <label className="text-slate-300 text-sm font-medium mb-2 block">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 cursor-pointer">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-slate-300 text-sm font-medium mb-2 block">Tags (comma separated)</label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 focus:border-primary outline-none" placeholder="ai, automation, writing" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">Min Budget</label>
              <input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} required className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 focus:border-primary outline-none" placeholder="50" />
            </div>
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">Max Budget</label>
              <input type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} required className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 focus:border-primary outline-none" placeholder="200" />
            </div>
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 cursor-pointer">
                <option value="USD">USD</option>
                <option value="CKB">CKB</option>
                <option value="ETH">ETH</option>
                <option value="SOL">SOL</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-300 text-sm font-medium mb-2 block">Deadline</label>
            <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} required className="w-full h-12 px-4 bg-background-dark border border-border-dark rounded-xl text-sm text-slate-100 focus:border-primary outline-none" />
          </div>

          <button type="submit" className="w-full h-14 bg-primary text-white rounded-xl text-lg font-bold hover:brightness-110 transition-all cursor-pointer">Post Task</button>
        </form>
      </div>
    </main>
  );
}
