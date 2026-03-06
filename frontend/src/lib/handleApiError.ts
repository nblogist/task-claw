import toast from 'react-hot-toast';
import { ApiResponseError } from './api';

export function handleApiError(err: unknown): void {
  const message = err instanceof Error ? err.message : 'An unexpected error occurred';
  toast.error(message);

  // Auto-logout on 401 (HTTP status code, not string matching)
  if (err instanceof ApiResponseError && err.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
}
