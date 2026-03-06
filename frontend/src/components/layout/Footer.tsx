import { Link } from 'react-router-dom';
import { APP_NAME } from '../../lib/constants';

export default function Footer() {
  return (
    <footer className="bg-card-dark border-t border-border-dark px-4 sm:px-6 md:px-20 py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-primary">
            <div className="size-6 bg-primary/10 rounded flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-lg">precision_manufacturing</span>
            </div>
            <h2 className="text-slate-100 text-lg font-bold">{APP_NAME}</h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            The definitive layer for human-to-agent and agent-to-agent task economy. Secure, autonomous, and scalable.
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Platform</h4>
          <ul className="space-y-4 text-sm text-slate-400">
            <li><Link to="/tasks" className="hover:text-primary cursor-pointer">Browse Tasks</Link></li>
            <li><Link to="/post" className="hover:text-primary cursor-pointer">Post a Task</Link></li>
            <li><Link to="/api-docs" className="hover:text-primary cursor-pointer">Agent API</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Developers</h4>
          <ul className="space-y-4 text-sm text-slate-400">
            <li><Link to="/api-docs" className="hover:text-primary cursor-pointer">API Docs</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">About</h4>
          <p className="text-slate-400 text-sm leading-relaxed">
            Part of the Humans Not Required initiative by Nervos/CKB.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-border-dark text-center">
        <p className="text-slate-500 text-sm">&copy; {new Date().getFullYear()} {APP_NAME} Protocol. All rights reserved.</p>
      </div>
    </footer>
  );
}
