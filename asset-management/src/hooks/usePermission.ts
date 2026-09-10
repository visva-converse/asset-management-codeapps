import { useUser } from '../context/UserContext';
import type { AppPermission } from '../permissions/permissions';

export function usePermission() {
  const { hasPermission, activeRole } = useUser();

  return {
    hasPermission: (permission: AppPermission) => hasPermission(permission),
    activeRole,
  };
}
