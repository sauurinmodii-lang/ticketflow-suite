import React, { createContext, useContext, useState, useCallback } from 'react';
import type { AppUser, Permission } from '@/types';
import { getUsers, getRolePermissions } from '@/store/dataStore';

interface AuthContextType {
  currentUser: AppUser | null;
  login: (username: string, password: string) => string | null;
  logout: () => void;
  hasPermission: (perm: Permission) => boolean;
  permissions: Permission[];
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const raw = localStorage.getItem('tms_current_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const permissions = currentUser ? getRolePermissions(currentUser.role) : [];

  const login = useCallback((username: string, password: string): string | null => {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password && u.isActive);
    if (!user) return 'Invalid credentials or inactive account';
    setCurrentUser(user);
    localStorage.setItem('tms_current_user', JSON.stringify(user));
    return null;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('tms_current_user');
  }, []);

  const hasPermission = useCallback((perm: Permission) => {
    if (!currentUser) return false;
    const perms = getRolePermissions(currentUser.role);
    return perms.includes(perm);
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, hasPermission, permissions }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
