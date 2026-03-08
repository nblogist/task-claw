import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const location = useLocation();

  if (!user && token) {
    return (
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
