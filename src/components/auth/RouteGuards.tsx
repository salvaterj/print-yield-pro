import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/types';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { configured, loading, user } = useAuth();

  if (!configured) return <Navigate to="/login" replace />;
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

export function RequireRole({ allow, children }: { allow: UserProfile[]; children: ReactNode }) {
  const { role, loading } = useAuth();

  if (loading) return null;
  if (!role) return <Navigate to="/acesso" replace />;
  if (!allow.includes(role)) return <Navigate to="/acesso" replace />;

  return <>{children}</>;
}

