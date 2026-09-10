import { getClient } from '@microsoft/power-apps/data';
import { dataSourcesInfo } from '../../.power/schemas/appschemas/dataSourcesInfo';
import type { CurrentUser, ResolvedPrivileges } from '../types';
import { SystemusersService } from '../generated/services/SystemusersService';
import {
  buildPermissionSet,
  determineRoleFromAssignedRoles,
  inferDisplayRole,
} from '../permissions/privilege-map';

/** Shape returned by the Dataverse RetrieveUserPrivileges bound function. */
interface RolePrivilege {
  PrivilegeId: string;
  PrivilegeName: string;
  PrivilegeDepthMask: number;
  BusinessUnitId: string;
}

interface RetrieveUserPrivilegesResponse {
  RolePrivileges: RolePrivilege[];
}

/** Shape returned by the Dataverse RetrieveAadUserRoles unbound function. */
interface AadRole {
  roleid: string;
  name: string;
}

interface RetrieveAadUserRolesResponse {
  value: AadRole[];
}

/** Empty / fail-closed resolved state. */
const EMPTY_RESOLVED: ResolvedPrivileges = {
  permissions: new Set(),
  displayRole: 'No Role Assigned',
  rawPrivilegeNames: [],
  assignedRoles: [],
};

export class RoleResolutionService {
  private static readonly client = getClient(dataSourcesInfo);
  private static cache: ResolvedPrivileges | null = null;

  /**
   * Resolves the effective Dataverse privileges and roles for the signed-in user.
   *
   * Flow:
   *   1. Query RetrieveAadUserRoles by Entra ID objectId to retrieve actual
   *      assigned Dataverse security roles (direct + team-inherited).
   *   2. Identify Dataverse systemuserid from AAD Object ID or UPN.
   *   3. Call RetrieveUserPrivileges (bound OData GET function) to obtain the
   *      cumulative privilege set.
   *   4. Map returned PrivilegeNames → Set<AppPermission> via privilege-map.ts.
   *   5. Determine display role: uses exact Dataverse security role name from
   *      step 1, with fallback to inferDisplayRole() from permissions.
   *
   * Fail-closed: any unhandled error returns EMPTY_RESOLVED (Employee baseline).
   * The actual data-access security boundary is always enforced by Dataverse.
   */
  public static async resolvePrivileges(user: CurrentUser): Promise<ResolvedPrivileges> {
    if (this.cache) {
      return this.cache;
    }

    console.log(
      '[RoleResolution] Resolving privileges for:',
      user.userPrincipalName,
      user.objectId
    );

    try {
      // ── Step 1: Retrieve assigned roles via RetrieveAadUserRoles ───────────
      let assignedRoles: string[] = [];
      if (
        user.objectId &&
        user.objectId !== '00000000-0000-0000-0000-000000000001'
      ) {
        try {
          const rolesResult = await this.client.executeAsync<
            { directoryObjectId: string },
            RetrieveAadUserRolesResponse
          >({
            dataverseRequest: {
              action: 'customapi',
              parameters: {
                operationName: 'RetrieveAadUserRoles',
                tableName: 'systemusers',
                body: { directoryObjectId: user.objectId },
              },
            },
          });

          if (rolesResult.success && rolesResult.data?.value) {
            assignedRoles = rolesResult.data.value.map((r) => r.name);
            console.log(
              '[RoleResolution] Dataverse security roles from RetrieveAadUserRoles:',
              assignedRoles
            );
          } else {
            console.warn(
              '[RoleResolution] RetrieveAadUserRoles call failed or returned empty:',
              rolesResult.error
            );
          }
        } catch (rolesErr) {
          console.warn(
            '[RoleResolution] RetrieveAadUserRoles exception:',
            rolesErr
          );
        }
      }

      // ── Step 2: Find the Dataverse systemuserid ───────────────────────────
      const systemUserId = await this.resolveSystemUserId(user);
      if (!systemUserId) {
        console.warn(
          '[RoleResolution] Could not identify Dataverse systemuserid. Failing closed.'
        );
        const fallbackRole =
          determineRoleFromAssignedRoles(assignedRoles) ?? 'Asset Management - Employee';
        const fallbackResolved: ResolvedPrivileges = {
          permissions: new Set(),
          displayRole: fallbackRole,
          rawPrivilegeNames: [],
          assignedRoles,
        };
        this.cache = fallbackResolved;
        return fallbackResolved;
      }

      console.log('[RoleResolution] Dataverse systemuserid:', systemUserId);

      // ── Step 3: Call RetrieveUserPrivileges ───────────────────────────────
      const result = await this.client.executeAsync<
        { systemUserId: string },
        RetrieveUserPrivilegesResponse
      >({
        dataverseRequest: {
          action: 'customapi',
          parameters: {
            operationName: 'RetrieveUserPrivileges',
            tableName: 'systemusers',
            body: { systemUserId },
          },
        },
      });
      console.log(result, "result")
      if (!result.success || !result.data) {
        console.warn(
          '[RoleResolution] RetrieveUserPrivileges call failed:',
          result.error
        );
        const fallbackRole =
          determineRoleFromAssignedRoles(assignedRoles) ?? 'Asset Management - Employee';
        const fallbackResolved: ResolvedPrivileges = {
          permissions: new Set(),
          displayRole: fallbackRole,
          rawPrivilegeNames: [],
          assignedRoles,
        };
        this.cache = fallbackResolved;
        return fallbackResolved;
      }

      const rolePrivileges: RolePrivilege[] = result.data.RolePrivileges ?? [];
      const rawPrivilegeNames = rolePrivileges.map((rp) => rp.PrivilegeName);

      console.log(
        `[RoleResolution] Received ${rolePrivileges.length} privileges:`,
        rawPrivilegeNames.filter((n) =>
          n.toLowerCase().includes('cr240')
        )
      );
      console.log(rolePrivileges, "rolePrivileges")
      // ── Step 4: Map → AppPermission set ──────────────────────────────────
      const permissions = buildPermissionSet(rolePrivileges);

      // ── Step 5: Determine display role ────────────────────────────────────
      // Primary: exact Dataverse Security Role assigned in Admin Center / Entra
      // Fallback: inferred from effective permissions
      const roleFromDataverse = determineRoleFromAssignedRoles(assignedRoles);
      const displayRole = roleFromDataverse ?? inferDisplayRole(permissions);

      console.log(
        '[RoleResolution] Resolved permissions count:',
        permissions.size,
        'assigned roles:',
        assignedRoles,
        '→ final display role:',
        displayRole
      );

      const resolved: ResolvedPrivileges = {
        permissions,
        displayRole,
        rawPrivilegeNames,
        assignedRoles,
      };

      this.cache = resolved;
      console.log(result, "resultresultresult")
      return resolved;
    } catch (err) {
      console.error(
        '[RoleResolution] Unhandled error during privilege resolution. Failing closed.',
        err
      );
      this.cache = EMPTY_RESOLVED;
      return EMPTY_RESOLVED;
    }
  }

  /**
   * Resolves the Dataverse systemuserid for the signed-in Entra user.
   * Tries AAD Object ID first, then UPN/email, then a broader search.
   */
  private static async resolveSystemUserId(user: CurrentUser): Promise<string | null> {
    // Use cached systemUserId if already in the user context
    if (
      user.systemUserId &&
      user.systemUserId !== '00000000-0000-0000-0000-000000000001'
    ) {
      return user.systemUserId;
    }

    try {
      // Try by AAD Object ID
      if (
        user.objectId &&
        user.objectId !== '00000000-0000-0000-0000-000000000001'
      ) {
        const res = await SystemusersService.getAll({
          filter: `azureactivedirectoryobjectid eq '${user.objectId}'`,
          top: 1,
        });
        if (res?.success && res.data?.length) {
          return res.data[0].systemuserid ?? null;
        }
      }

      // Try by UPN / internal email
      if (user.userPrincipalName) {
        const upn = user.userPrincipalName.toLowerCase();
        const res = await SystemusersService.getAll({
          filter: `internalemailaddress eq '${upn}' or domainname eq '${upn}'`,
          top: 1,
        });
        if (res?.success && res.data?.length) {
          return res.data[0].systemuserid ?? null;
        }
      }
    } catch (err) {
      console.warn('[RoleResolution] resolveSystemUserId query failed:', err);
    }

    return null;
  }

  /** Clears the session cache (e.g. after sign-out or refresh). */
  public static clearCache(): void {
    this.cache = null;
  }
}
