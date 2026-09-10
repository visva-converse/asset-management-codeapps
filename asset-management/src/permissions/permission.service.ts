import type { AppPermission } from './permissions';

export class PermissionService {
  /**
   * Checks whether the effective permission set contains a specific permission.
   *
   * The set is derived from the user's cumulative Dataverse privileges
   * (RetrieveUserPrivileges) at startup and is immutable for the session.
   */
  public static hasPermission(
    permissions: Set<AppPermission>,
    permission: AppPermission
  ): boolean {
    return permissions.has(permission);
  }

  /**
   * Returns true if the permission set is non-empty (user has at least one
   * mapped Dataverse privilege).
   */
  public static hasAnyPermission(permissions: Set<AppPermission>): boolean {
    return permissions.size > 0;
  }
}
