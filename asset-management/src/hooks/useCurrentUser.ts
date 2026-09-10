import { useUser } from '../context/UserContext';

export function useCurrentUser() {
  const { currentUser, activeRole, permissions, isLoading, error, refreshUser } =
    useUser();

  return {
    user: currentUser,
    /** Display-only role label (for Header badge / informational text). */
    activeRole,
    /** Effective permission set resolved from Dataverse RetrieveUserPrivileges. */
    permissions,
    isLoading,
    error,
    refreshUser,
  };
}
