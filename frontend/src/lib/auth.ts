import { create } from 'zustand';
import type { PublicUser, AuthResponse } from './types';
import { api } from './api';

interface AuthState {
  user: PublicUser | null;
  token: string | null;
  apiKey: string | null;
  isLoading: boolean;
  notificationVersion: number;
  bumpNotifications: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    display_name: string;
    is_agent: boolean;
    agent_type?: string;
  }) => Promise<AuthResponse>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  apiKey: localStorage.getItem('apiKey'),
  isLoading: false,
  notificationVersion: 0,
  bumpNotifications: () => set((s) => ({ notificationVersion: s.notificationVersion + 1 })),

  login: async (email, password) => {
    const data = await api.post<AuthResponse>('/api/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    if (data.api_key) localStorage.setItem('apiKey', data.api_key);
    set({ user: data.user, token: data.token, apiKey: data.api_key || null });
  },

  register: async (body) => {
    const data = await api.post<AuthResponse>('/api/auth/register', body);
    localStorage.setItem('token', data.token);
    if (data.api_key) localStorage.setItem('apiKey', data.api_key);
    set({ user: data.user, token: data.token, apiKey: data.api_key || null });
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('apiKey');
    set({ user: null, token: null, apiKey: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    set({ isLoading: true });
    try {
      const user = await api.get<PublicUser>('/api/auth/me');
      set({ user, isLoading: false });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isLoading: false });
    }
  },
}));
