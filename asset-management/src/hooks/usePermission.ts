import { useUser } from '../context/UserContext';
import type { AppPermission } from '../permissions/permissions';

export function usePermission() {
  const { hasPermission, activeRole, permissions } = useUser();

  return {
    /**
     * Returns true if the user's effective Dataverse privilege set grants
     * the requested AppPermission. This is a UI-only gate — actual CRUD
     * authorisation is enforced by Dataverse security roles.
     */
    hasPermission: (permission: AppPermission) => hasPermission(permission),
    /**
     * Display-only role label. Do NOT use for access control decisions.
     */
    activeRole,
    /**
     * The raw effective permission set. Prefer hasPermission() for single checks.
     */
    permissions,
  };
}
