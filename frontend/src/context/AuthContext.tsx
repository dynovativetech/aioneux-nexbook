import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { login, logout, register, getStoredUser } from '../services/authService';
import type { User, UserRole } from '../types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  tenantId: number | null;
  isSuperAdmin: boolean;
  isTenantAdmin: boolean;
  isOrganizer: boolean;
  isCustomer: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser);

  const signIn = useCallback(async (email: string, password: string) => {
    const u = await login(email, password);
    setUser(u);
  }, []);

  const signUp = useCallback(async (fullName: string, email: string, password: string) => {
    const u = await register(fullName, email, password);
    setUser(u);
  }, []);

  const signOut = useCallback(() => {
    logout();
    setUser(null);
  }, []);

  const role = user?.role ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        role,
        tenantId:       user?.tenantId ?? null,
        isSuperAdmin:   role === 'SuperAdmin',
        isTenantAdmin:  role === 'TenantAdmin',
        isOrganizer:    role === 'FacilityOrganizer',
        isCustomer:     role === 'Customer',
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
