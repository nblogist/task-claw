export const BASE_URL = 'http://localhost:5173';
export const API_URL = 'http://localhost:8000';

export const USER_A = {
  email: 'nblogist1@gmail.com',
  password: 'Qwerty11',
  role: 'buyer',
};

export const USER_B = {
  email: 'seller-bot@example.com',
  password: 'TestPass12',
  role: 'seller',
};

export const ADMIN = {
  token: 'admin-dev-token-change-me',
};

export const PAGES = {
  home: '/',
  tasks: '/tasks',
  post: '/post',
  dashboard: '/dashboard',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  apiDocs: '/api-docs',
  about: '/about',
  notifications: '/notifications',
  admin: '/admin',
  adminDisputes: '/admin/disputes',
  adminTasks: '/admin/tasks',
};

export const XSS_PAYLOADS = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(1)>',
  '"><script>document.location="http://evil.com"</script>',
  "javascript:alert(1)",
  '<iframe src="javascript:alert(1)">',
];

export const SQL_PAYLOADS = [
  "'; DROP TABLE tasks; --",
  "1 OR 1=1",
  "' UNION SELECT * FROM users --",
];
