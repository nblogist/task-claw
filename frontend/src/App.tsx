import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Component, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './lib/auth';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center py-20 bg-background-dark text-slate-100 min-h-screen">
          <div className="text-center">
            <h1 className="text-white text-4xl font-bold mb-4">Something went wrong</h1>
            <p className="text-slate-400 mb-6">An unexpected error occurred.</p>
            <button onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }} className="h-12 px-6 bg-primary text-white rounded-xl font-bold hover:brightness-110 transition-all cursor-pointer">Go Home</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
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
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import NotificationsPage from './pages/NotificationsPage';
import AboutPage from './pages/AboutPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminDisputesPage from './pages/admin/AdminDisputesPage';
import AdminTasksPage from './pages/admin/AdminTasksPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import RequireAuth from './components/RequireAuth';

function AppContent() {
  const { loadUser, token } = useAuth();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (token) loadUser();
  }, [token]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-dark text-slate-100">
      {!isAdmin && <Header />}
      <div id="main-content" className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tasks" element={<BrowsePage />} />
          <Route path="/tasks/:slug" element={<TaskDetailPage />} />
          <Route path="/post" element={<PostTaskPage />} />
          <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/api-docs" element={<ApiDocsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="disputes" element={<AdminDisputesPage />} />
            <Route path="tasks" element={<AdminTasksPage />} />
            <Route path="users" element={<AdminUsersPage />} />
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
      </div>
      {!isAdmin && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1A1A3E', color: '#e2e8f0', border: '1px solid #282e39' },
        error: { duration: 5000 },
      }} />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
