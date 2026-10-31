import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchPersona: (role: UserRole) => void;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message?: string; resetLink?: string; error?: string }>;
  resetPassword: (email: string, token: string, newPass: string) => Promise<{ success: boolean; message?: string; error?: string }>;
}

const DEMO_USERS: Record<UserRole, User> = {
  admin: {
    id: 1,
    name: 'Sarah Connor',
    email: 'admin@brightloop.com',
    role: 'admin',
    customer_id: null,
    company: 'Brightloop Software Inc',
    created_at: '2026-01-01'
  },
  staff: {
    id: 2,
    name: 'Alex Morgan',
    email: 'staff@brightloop.com',
    role: 'staff',
    customer_id: null,
    company: 'Brightloop Software Inc',
    created_at: '2026-01-05'
  },
  customer: {
    id: 3,
    name: 'Rajesh Patel',
    email: 'customer@acme.com',
    role: 'customer',
    customer_id: 1,
    company: 'Acme Technologies Ltd',
    phone: '+91 98765 43210',
    gst_number: '29ABCDE1234F1Z5',
    created_at: '2026-01-10'
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('brightloop_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null; // Show Login/Signup gate by default
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('brightloop_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('brightloop_user');
    }
  }, [user]);

  const switchPersona = (role: UserRole) => {
    const demo = DEMO_USERS[role];
    setUser(demo);
  };

  const login = async (email: string, password = 'Brightloop@2026') => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        return { success: false, error: data.error || 'Login failed' };
      }
      setUser(data.user);
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('brightloop_user');
    } catch (e) {
      console.error(e);
    }
    setUser(null);
  };

  const register = async (data: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (!res.ok) {
        setLoading(false);
        return { success: false, error: resData.error || 'Registration failed' };
      }
      setUser(resData.user);
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      return { success: true, message: data.message, resetLink: data.resetLink };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const resetPassword = async (email: string, token: string, newPass: string) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword: newPass })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchPersona, register, requestPasswordReset, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
