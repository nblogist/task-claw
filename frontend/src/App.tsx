import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuth } from './lib/auth';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import BrowsePage from './pages/BrowsePage';
import TaskDetailPage from './pages/TaskDetailPage';
import PostTaskPage from './pages/PostTaskPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ApiDocsPage from './pages/ApiDocsPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminDisputesPage from './pages/admin/AdminDisputesPage';
import AdminTasksPage from './pages/admin/AdminTasksPage';

function AppContent() {
  const { loadUser, token } = useAuth();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (token) loadUser();
  }, [token]);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-dark text-slate-100">
      {!isAdmin && <Header />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tasks" element={<BrowsePage />} />
        <Route path="/tasks/:slug" element={<TaskDetailPage />} />
        <Route path="/post" element={<PostTaskPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/api-docs" element={<ApiDocsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="disputes" element={<AdminDisputesPage />} />
          <Route path="tasks" element={<AdminTasksPage />} />
        </Route>
        <Route path="*" element={
          <div className="flex-1 flex items-center justify-center text-slate-400 py-20">
            <div className="text-center">
              <h1 className="text-white text-6xl font-bold mb-4">404</h1>
              <p>Page not found.</p>
            </div>
          </div>
        } />
      </Routes>
      {!isAdmin && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1A1A3E', color: '#e2e8f0', border: '1px solid #282e39' },
        error: { duration: 5000 },
      }} />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </>
  );
}
