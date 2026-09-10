import { AppPermissions, type AppPermission } from './permissions';

/**
 * Maps Dataverse Web API PrivilegeName values (from RetrieveUserPrivileges) to
 * application-level AppPermission tokens.
 *
 * Naming convention:  prv{Operation}{EntitySchemaName}
 *   Operations: Read, Create, Write (= Update), Delete, Append, AppendTo
 *   Entity schema names for this solution use the cr240_ publisher prefix.
 *
 * How to verify the exact names for your environment:
 *   GET [OrgUrl]/api/data/v9.2/systemusers(<id>)/Microsoft.Dynamics.CRM.RetrieveUserPrivileges()
 *   and inspect the returned PrivilegeName values.
 *
 * Comparison is case-insensitive (see resolvePrivilegeName below).
 */
export const DATAVERSE_PRIVILEGE_MAP: Readonly<Record<string, AppPermission>> = {

  // ── cr240_asset (Assets) ─────────────────────────────────────────────────
  prvReadcr240_asset: AppPermissions.VIEW_ASSETS,
  prvCreatecr240_asset: AppPermissions.CREATE_ASSET,
  prvWritecr240_asset: AppPermissions.UPDATE_ASSET,
  prvDeletecr240_asset: AppPermissions.DELETE_ASSET,

  // ── cr240_assetrequest (Requests) ─────────────────────────────────────────
  // Note: Write on assetrequest is granted to Managers (approve/reject) and
  // Asset Administrators (process requests). The APPROVE/REJECT tokens are
  // therefore also mapped here; actual business-rule enforcement lives in
  // Dataverse (plugins / Power Automate flows), not in this UI check.
  prvReadcr240_assetrequest: AppPermissions.VIEW_REQUESTS,
  prvCreatecr240_assetrequest: AppPermissions.CREATE_REQUEST,
  prvWritecr240_assetrequest: AppPermissions.UPDATE_REQUEST,

  // ── cr240_assetassignment (Assignments) ────────────────────────────────────
  prvCreatecr240_assetassignment: AppPermissions.ASSIGN_ASSET,
  prvWritecr240_assetassignment: AppPermissions.TRANSFER_ASSET,
  prvDeletecr240_assetassignment: AppPermissions.RETURN_ASSET,

  // ── cr240_assetmaintenance (Maintenance) ──────────────────────────────────
  prvCreatecr240_assetmaintenance: AppPermissions.MANAGE_MAINTENANCE,
  prvWritecr240_assetmaintenance: AppPermissions.MANAGE_MAINTENANCE,
  prvDeletecr240_assetmaintenance: AppPermissions.MANAGE_MAINTENANCE,

  // ── cr240_assetcategory (Categories – IT Admin module) ──────────────────────
  // Note: Read is intentionally NOT mapped to MANAGE_CATEGORIES because Employees
  // have Read on categories to populate dropdowns in request forms.
  prvCreatecr240_assetcategory: AppPermissions.MANAGE_CATEGORIES,
  prvWritecr240_assetcategory: AppPermissions.MANAGE_CATEGORIES,
  prvDeletecr240_assetcategory: AppPermissions.MANAGE_CATEGORIES,

  // ── cr240_location (Locations – IT Admin module) ───────────────────────────
  // Note: Read is intentionally NOT mapped to MANAGE_LOCATIONS because Employees
  // have Read on locations to populate dropdowns in request forms.
  prvCreatecr240_location: AppPermissions.MANAGE_LOCATIONS,
  prvWritecr240_location: AppPermissions.MANAGE_LOCATIONS,
  prvDeletecr240_location: AppPermissions.MANAGE_LOCATIONS,
};

/**
 * Normalised lowercase lookup built once at module load.
 * Avoids repeated `toLowerCase()` calls on every privilege.
 */
const PRIVILEGE_MAP_LOWER: ReadonlyMap<string, AppPermission> = new Map(
  Object.entries(DATAVERSE_PRIVILEGE_MAP).map(([k, v]) => [k.toLowerCase(), v])
);

/**
 * Resolves a single Dataverse PrivilegeName to an AppPermission, or undefined
 * if it is not relevant to the application's UI permission model.
 * Comparison is intentionally case-insensitive.
 */
export function resolvePrivilegeName(privilegeName: string): AppPermission | undefined {
  return PRIVILEGE_MAP_LOWER.get(privilegeName.toLowerCase());
}

/**
 * Converts a raw RetrieveUserPrivileges RolePrivilege array into the effective
 * Set<AppPermission> for the current user.
 *
 * Also infers APPROVE_REQUEST / REJECT_REQUEST for any user who holds
 * UPDATE_REQUEST, because the Manager role grants prvWrite on assetrequest.
 * Actual approval authorisation is enforced server-side by Dataverse.
 */
export function buildPermissionSet(
  rolePrivileges: Array<{ PrivilegeName: string }>
): Set<AppPermission> {
  const result = new Set<AppPermission>();

  for (const rp of rolePrivileges) {
    const perm = resolvePrivilegeName(rp.PrivilegeName);
    if (perm !== undefined) {
      result.add(perm);
    }
  }

  // Infer approval rights: anyone with Write on assetrequest can approve/reject
  // (the distinction between Manager and Asset Admin is enforced in Dataverse).
  if (result.has(AppPermissions.UPDATE_REQUEST)) {
    result.add(AppPermissions.APPROVE_REQUEST);
    result.add(AppPermissions.REJECT_REQUEST);
  }
  console.log(result, "result")
  return result;
}

/**
 * Resolves the primary DataverseRole from the exact Dataverse Security Role
 * names returned by RetrieveAadUserRoles.
 *
 * Accounts for multiple roles (direct and team-inherited) in hierarchical order:
 *   IT Administrator > Asset Administrator > Manager > Employee
 */
export function determineRoleFromAssignedRoles(
  roleNames: string[]
): import('../types').DataverseRole | null {
  const normalized = roleNames.map((r) => r.trim().toLowerCase());

  if (normalized.some((r) => r.includes('it administrator'))) {
    return 'Asset Management - IT Administrator';
  }
  if (normalized.some((r) => r.includes('asset administrator'))) {
    return 'Asset Management - Asset Administrator';
  }
  if (normalized.some((r) => r.includes('manager') && !r.includes('asset'))) {
    return 'Asset Management - Manager';
  }
  if (normalized.some((r) => r.includes('employee'))) {
    return 'Asset Management - Employee';
  }
  return null;
}

/**
 * Derives a display-only DataverseRole label from the effective permission set
 * as a fallback if RetrieveAadUserRoles is unavailable.
 * This is used solely for the role badge in the Header — it has no effect on
 * access control decisions.
 */
export function inferDisplayRole(
  permissions: Set<AppPermission>
): import('../types').DataverseRole {
  if (
    permissions.has(AppPermissions.MANAGE_CATEGORIES) ||
    permissions.has(AppPermissions.MANAGE_LOCATIONS)
  ) {
    return 'Asset Management - IT Administrator';
  }
  if (
    permissions.has(AppPermissions.MANAGE_MAINTENANCE) ||
    permissions.has(AppPermissions.ASSIGN_ASSET)
  ) {
    return 'Asset Management - Asset Administrator';
  }
  if (permissions.has(AppPermissions.APPROVE_REQUEST)) {
    return 'Asset Management - Manager';
  }
  if (
    permissions.has(AppPermissions.VIEW_ASSETS) ||
    permissions.has(AppPermissions.VIEW_REQUESTS) ||
    permissions.has(AppPermissions.CREATE_REQUEST)
  ) {
    return 'Asset Management - Employee';
  }
  return 'No Role Assigned';
}
