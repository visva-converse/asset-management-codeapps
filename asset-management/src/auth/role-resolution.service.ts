import { getClient } from '@microsoft/power-apps/data';
import { dataSourcesInfo } from '../../.power/schemas/appschemas/dataSourcesInfo';
import type { CurrentUser, DataverseRole } from '../types';
import { SystemusersService } from '../generated/services/SystemusersService';
import type { Systemusers } from '../generated/models/SystemusersModel';

interface DataverseRoleRecord {
  roleid: string;
  name: string;
}

interface SystemUserRoleRecord {
  systemuserroleid: string;
  systemuserid: string;
  roleid: string;
}

export class RoleResolutionService {
  private static client = getClient(dataSourcesInfo);
  private static resolvedRoleCache: DataverseRole | null = null;

  /**
   * Resolves the Dataverse Security Role assigned to the current user in Power Platform / Microsoft Entra.
   * Does NOT rely on any UI selection.
   */
  public static async resolveCurrentUserRole(user: CurrentUser): Promise<DataverseRole> {
    if (this.resolvedRoleCache) {
      return this.resolvedRoleCache;
    }

    console.log('[RoleResolution] Resolving Dataverse Security Role for:', user.userPrincipalName, user.objectId);

    try {
      // Step 1: Find the Dataverse systemuser record
      const systemUser = await this.findSystemUser(user);
      const systemUserId = systemUser?.systemuserid || user.systemUserId;

      if (systemUserId) {
        console.log('[RoleResolution] Located Dataverse systemuserid:', systemUserId);

        // Step 2: Query assigned security roles from Dataverse
        const role = await this.queryUserSecurityRoles(systemUserId);
        if (role) {
          console.log('[RoleResolution] Successfully resolved assigned Dataverse role:', role);
          this.resolvedRoleCache = role;
          return role;
        }
      } else {
        console.warn('[RoleResolution] System user ID could not be identified from Dataverse.');
      }
    } catch (err) {
      console.warn('[RoleResolution] Error during Dataverse role lookup:', err);
    }

    // Step 3: Privilege-based probe if direct role association query is restricted
    try {
      const probedRole = await this.probeDataverseTablePrivileges();
      if (probedRole) {
        console.log('[RoleResolution] Resolved role via Dataverse table privilege probe:', probedRole);
        this.resolvedRoleCache = probedRole;
        return probedRole;
      }
    } catch (err) {
      console.warn('[RoleResolution] Privilege probe check skipped:', err);
    }

    // Step 4: Default to Employee if role resolution cannot determine higher privileges
    const defaultRole: DataverseRole = 'Asset Management - Employee';
    console.log('[RoleResolution] Defaulting to baseline role:', defaultRole);
    this.resolvedRoleCache = defaultRole;
    return defaultRole;
  }

  /**
   * Finds the systemuser in Dataverse matching the signed-in Entra ID user.
   */
  private static async findSystemUser(user: CurrentUser): Promise<Systemusers | null> {
    try {
      // Try by AAD Object ID
      if (user.objectId && user.objectId !== '00000000-0000-0000-0000-000000000001') {
        const res = await SystemusersService.getAll({
          filter: `azureactivedirectoryobjectid eq '${user.objectId}'`,
          top: 5,
        });
        if (res?.success && res.data && res.data.length > 0) {
          return res.data[0];
        }
      }

      // Try by User Principal Name / Email
      if (user.userPrincipalName) {
        const email = user.userPrincipalName.toLowerCase();
        const res = await SystemusersService.getAll({
          filter: `internalemailaddress eq '${email}' or domainname eq '${email}'`,
          top: 5,
        });
        if (res?.success && res.data && res.data.length > 0) {
          return res.data[0];
        }
      }

      // Fallback: search within recent users
      const allUsers = await SystemusersService.getAll({ top: 100 });
      if (allUsers?.success && allUsers.data) {
        const found = allUsers.data.find(
          (u) =>
            (user.objectId && u.azureactivedirectoryobjectid === user.objectId) ||
            (u.internalemailaddress &&
              u.internalemailaddress.toLowerCase() === user.userPrincipalName.toLowerCase()) ||
            (u.domainname &&
              u.domainname.toLowerCase() === user.userPrincipalName.toLowerCase())
        );
        if (found) return found;
      }
    } catch (err) {
      console.warn('[RoleResolution] findSystemUser failed:', err);
    }
    return null;
  }

  /**
   * Queries Dataverse roles assigned to this systemuser.
   */
  private static async queryUserSecurityRoles(systemUserId: string): Promise<DataverseRole | null> {
    try {
      // 1. Query systemuserroles intersection table
      const userRolesRes = await this.client.retrieveMultipleRecordsAsync<SystemUserRoleRecord>(
        'systemuserroles',
        {
          filter: `systemuserid eq '${systemUserId}'`,
          top: 50,
        }
      );

      // 2. Query roles table for Asset Management definitions
      const rolesRes = await this.client.retrieveMultipleRecordsAsync<DataverseRoleRecord>('roles', {
        select: ['roleid', 'name'],
        top: 200,
      });

      if (rolesRes?.success && rolesRes.data && rolesRes.data.length > 0) {
        const allRoles = rolesRes.data;
        console.log('[RoleResolution] Found Dataverse roles:', allRoles.map((r) => r.name));

        const userRoleIds = new Set(
          (userRolesRes?.data || []).map((ur) => ur.roleid.toLowerCase())
        );

        const assignedRoles = allRoles.filter((r) =>
          userRoleIds.has(r.roleid.toLowerCase())
        );

        console.log(
          '[RoleResolution] Roles assigned to current user:',
          assignedRoles.map((r) => r.name)
        );

        // Match against our 4 Dataverse security roles (in descending privilege order)
        const matched = this.matchSecurityRole(assignedRoles.map((r) => r.name));
        if (matched) return matched;
      }
    } catch (err) {
      console.warn('[RoleResolution] Direct user roles query error:', err);
    }

    return null;
  }

  /**
   * Matches role names against the 4 defined Dataverse security roles.
   */
  private static matchSecurityRole(roleNames: string[]): DataverseRole | null {
    const names = roleNames.map((n) => n.trim().toLowerCase());

    // IT Administrator (highest)
    if (
      names.some(
        (n) =>
          n.includes('it administrator') ||
          n === 'asset management - it administrator' ||
          n.includes('system administrator')
      )
    ) {
      return 'Asset Management - IT Administrator';
    }

    // Asset Administrator
    if (
      names.some(
        (n) =>
          n.includes('asset administrator') ||
          n === 'asset management - asset administrator'
      )
    ) {
      return 'Asset Management - Asset Administrator';
    }

    // Manager
    if (
      names.some(
        (n) =>
          n.includes('manager') ||
          n === 'asset management - manager'
      )
    ) {
      return 'Asset Management - Manager';
    }

    // Employee
    if (
      names.some(
        (n) =>
          n.includes('employee') ||
          n === 'asset management - employee'
      )
    ) {
      return 'Asset Management - Employee';
    }

    return null;
  }

  /**
   * Checks table privileges if role association queries are blocked by Dataverse permissions.
   */
  private static async probeDataverseTablePrivileges(): Promise<DataverseRole | null> {
    try {
      // Test IT Administrator privilege: access to cr240_locations metadata/records
      const locRes = await this.client.retrieveMultipleRecordsAsync('cr240_locations', { top: 1 });
      if (locRes?.success) {
        // Can read locations and categories -> IT Admin
        const catRes = await this.client.retrieveMultipleRecordsAsync('cr240_assetcategories', { top: 1 });
        if (catRes?.success) {
          return 'Asset Management - IT Administrator';
        }
      }
    } catch {
      // Ignored
    }

    try {
      // Test Asset Administrator privilege: access to cr240_assetassignments
      const asgRes = await this.client.retrieveMultipleRecordsAsync('cr240_assetassignments', { top: 1 });
      if (asgRes?.success) {
        return 'Asset Management - Asset Administrator';
      }
    } catch {
      // Ignored
    }

    return null;
  }

  public static clearCache(): void {
    this.resolvedRoleCache = null;
  }
}
