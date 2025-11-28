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

  return {
    canEditMasters: canEditMasters(userRole),
    canDeleteMasters: canDeleteMasters(userRole),
    canManageUsers: canManageUsers(userRole),
    canDeleteRecords: canDeleteRecords(userRole),
    hasPermission: (permission: Permission) => hasPermission(userRole, permission),
  };
};
