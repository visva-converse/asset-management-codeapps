import { useUser } from '../context/UserContext';

export function useCurrentUser() {
  const { currentUser, activeRole, setActiveRole, availableRoles, isLoading, error, refreshUser } =
    useUser();

  return {
    user: currentUser,
    activeRole,
    setActiveRole,
    availableRoles,
    isLoading,
    error,
    refreshUser,
  };
}
