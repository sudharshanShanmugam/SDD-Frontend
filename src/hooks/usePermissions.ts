import { useCallback } from 'react';
import { useAuthStore } from '@/store';
import type { Permission } from '@/types';

export function usePermissions() {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, isOrgAdmin, isSuperAdmin } =
    useAuthStore();

  const can = useCallback(
    (permission: Permission) => hasPermission(permission),
    [hasPermission]
  );

  const canAny = useCallback(
    (permissions: Permission[]) => hasAnyPermission(permissions),
    [hasAnyPermission]
  );

  const canAll = useCallback(
    (permissions: Permission[]) => hasAllPermissions(permissions),
    [hasAllPermissions]
  );

  return {
    can,
    canAny,
    canAll,
    hasRole,
    isOrgAdmin,
    isSuperAdmin,
  };
}
