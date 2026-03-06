import toast from 'react-hot-toast';

export function handleApiError(err: unknown): void {
  const message = err instanceof Error ? err.message : 'An unexpected error occurred';
  toast.error(message);

  if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('expired')) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
}
