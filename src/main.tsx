import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Global fetch interceptor to guarantee automatic authentication headers on all /api requests
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();

  if (url.startsWith('/api') || url.includes('/api/')) {
    let userId = '1';
    let userRole = 'admin';
    try {
      const savedUser = localStorage.getItem('brightloop_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.id) userId = String(parsed.id);
        if (parsed?.role) userRole = parsed.role;
      }
    } catch {}

    const headers = new Headers(init?.headers || {});
    if (!headers.has('x-user-id')) {
      headers.set('x-user-id', userId);
    }
    if (!headers.has('x-user-role')) {
      headers.set('x-user-role', userRole);
    }

    return originalFetch(input, { ...init, headers });
  }

  return originalFetch(input, init);
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
