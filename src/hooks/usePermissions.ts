/**
 * usePermissions Hook
 * Provides permission checking based on current user's role
 */

import { useAuth } from '@/contexts/AuthContext';
import { canEditMasters, canDeleteMasters, canManageUsers, canDeleteRecords, hasPermission, Permission } from '@/lib/permissions';

interface PermissionChecks {
  canEditMasters: boolean;
  canDeleteMasters: boolean;
  canManageUsers: boolean;
  canDeleteRecords: boolean;
  hasPermission: (permission: Permission) => boolean;
}

export const usePermissions = (): PermissionChecks => {
  const { user } = useAuth();
  const userRole = user?.role;
  const isSuperAdmin = userRole === 'superadmin';

  return {
    // SuperAdmin always has all permissions
    canEditMasters: isSuperAdmin || canEditMasters(userRole),
    canDeleteMasters: isSuperAdmin || canDeleteMasters(userRole),
    canManageUsers: isSuperAdmin || canManageUsers(userRole),
    canDeleteRecords: isSuperAdmin || canDeleteRecords(userRole),
    hasPermission: (permission: Permission) => isSuperAdmin || hasPermission(userRole, permission),
  };
};
