import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { CurrentUser, DataverseRole, ResolvedPrivileges } from '../types';
import { UserContextService } from '../auth/user-context.service';
import { RoleResolutionService } from '../auth/role-resolution.service';
import { PermissionService } from '../permissions/permission.service';
import type { AppPermission } from '../permissions/permissions';

export interface UserContextType {
  currentUser: CurrentUser | null;

  /**
   * Effective AppPermission set resolved from Dataverse RetrieveUserPrivileges.
   * This is the source of truth for all UI permission gates.
   */
  permissions: Set<AppPermission>;

  /**
   * Display-only role label inferred from the permission set.
   * Used in the Header badge and informational text ONLY.
   * Has NO effect on access control decisions.
   */
  activeRole: DataverseRole;

  /**
   * Checks whether the effective permission set contains a specific AppPermission.
   * This is the primary API for all UI permission checks.
   */
  hasPermission: (permission: AppPermission) => boolean;

  isLoading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

/** Empty permission set — used before privileges have been resolved. */
const EMPTY_PERMISSIONS = new Set<AppPermission>();
const DEFAULT_DISPLAY_ROLE: DataverseRole = 'No Role Assigned';

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [resolved, setResolved] = useState<ResolvedPrivileges>({
    permissions: EMPTY_PERMISSIONS,
    displayRole: DEFAULT_DISPLAY_ROLE,
    rawPrivilegeNames: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Identify the signed-in user from the Power Apps SDK context
      const user = await UserContextService.getCurrentUser();
      setCurrentUser(user);

      // 2. Resolve effective Dataverse privileges (cumulative – roles + teams).
      //    This calls RetrieveUserPrivileges on the Dataverse Web API.
      //    Fails closed: any error yields an empty permission set.
      const resolvedPrivileges = await RoleResolutionService.resolvePrivileges(user);
      setResolved(resolvedPrivileges);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to retrieve user context';
      setError(msg);
      console.error('[UserContext] Error:', err);
      // Fail closed — keep empty permissions
      setResolved({
        permissions: EMPTY_PERMISSIONS,
        displayRole: DEFAULT_DISPLAY_ROLE,
        rawPrivilegeNames: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const hasPermission = useCallback(
    (permission: AppPermission): boolean =>
      PermissionService.hasPermission(resolved.permissions, permission),
    [resolved.permissions]
  );

  const contextValue = useMemo<UserContextType>(
    () => ({
      currentUser,
      permissions: resolved.permissions,
      activeRole: resolved.displayRole,
      hasPermission,
      isLoading,
      error,
      refreshUser: loadUser,
    }),
    [currentUser, resolved, hasPermission, isLoading, error, loadUser]
  );

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
