import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { CurrentUser, DataverseRole } from '../types';
import { UserContextService } from '../auth/user-context.service';
import { PermissionService } from '../permissions/permission.service';
import type { AppPermission } from '../permissions/permissions';

export interface UserContextType {
  currentUser: CurrentUser | null;
  activeRole: DataverseRole;
  setActiveRole: (role: DataverseRole) => void;
  availableRoles: DataverseRole[];
  hasPermission: (permission: AppPermission) => boolean;
  isLoading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

const AVAILABLE_ROLES: DataverseRole[] = [
  'Asset Management - Employee',
  'Asset Management - Manager',
  'Asset Management - Asset Administrator',
  'Asset Management - IT Administrator',
];

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [activeRole, setActiveRole] = useState<DataverseRole>('Asset Management - IT Administrator');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await UserContextService.getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve user context';
      setError(msg);
      console.error('UserProvider error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const hasPermission = useCallback(
    (permission: AppPermission): boolean => {
      return PermissionService.hasPermission(activeRole, permission);
    },
    [activeRole]
  );

  const contextValue = useMemo<UserContextType>(
    () => ({
      currentUser,
      activeRole,
      setActiveRole,
      availableRoles: AVAILABLE_ROLES,
      hasPermission,
      isLoading,
      error,
      refreshUser: loadUser,
    }),
    [currentUser, activeRole, hasPermission, isLoading, error, loadUser]
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
