import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';

export function RequireSuperAdmin({ children }: { children: ReactNode }) {
  const perms = usePermissions();
  if (!perms.isSuperAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
