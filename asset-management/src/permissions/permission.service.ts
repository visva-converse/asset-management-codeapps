import type { DataverseRole } from '../types';
import type { AppPermission } from './permissions';
import { ROLE_PERMISSIONS } from './role-permissions';

export class PermissionService {
  /**
   * Checks whether a set of Dataverse roles grants a specific application permission.
   */
  public static hasPermission(
    roles: DataverseRole | DataverseRole[],
    permission: AppPermission
  ): boolean {
    const roleList = Array.isArray(roles) ? roles : [roles];
    for (const role of roleList) {
      const perms = ROLE_PERMISSIONS[role];
      if (perms && perms.includes(permission)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Gets all distinct permissions granted across the given roles.
   */
  public static getAllPermissions(roles: DataverseRole | DataverseRole[]): Set<AppPermission> {
    const roleList = Array.isArray(roles) ? roles : [roles];
    const permSet = new Set<AppPermission>();
    for (const role of roleList) {
      const perms = ROLE_PERMISSIONS[role];
      if (perms) {
        for (const p of perms) {
          permSet.add(p);
        }
      }
    }
    return permSet;
  }
}
