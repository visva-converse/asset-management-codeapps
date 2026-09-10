import type { AppPermission } from '../permissions/permissions';

export interface CurrentUser {
  fullName: string;
  objectId: string;
  tenantId: string;
  userPrincipalName: string;
  systemUserId?: string;
}

export type DataverseRole =
  | 'Asset Management - Employee'
  | 'Asset Management - Manager'
  | 'Asset Management - Asset Administrator'
  | 'Asset Management - IT Administrator'
  | 'No Role Assigned';

/**
 * The resolved privilege state for the current user.
 * Derived from Dataverse RetrieveUserPrivileges at session start.
 *
 * - `permissions` — effective cumulative AppPermission set; drives all UI gates.
 * - `displayRole` — a display-only label inferred from the permission set;
 *   used only for the Header badge and informational text. Has NO security
 *   significance — actual CRUD authorisation is enforced by Dataverse.
 * - `rawPrivilegeNames` — the full list of PrivilegeNames returned by
 *   RetrieveUserPrivileges, kept for diagnostics/logging only.
 */
export interface ResolvedPrivileges {
  permissions: Set<AppPermission>;
  displayRole: DataverseRole;
  rawPrivilegeNames: string[];
  assignedRoles?: string[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}
