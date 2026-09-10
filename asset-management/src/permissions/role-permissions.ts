/**
 * @deprecated
 * The static ROLE_PERMISSIONS matrix has been replaced by privilege-based
 * permission resolution via the Dataverse RetrieveUserPrivileges API.
 *
 * All permission logic now lives in:
 *   src/permissions/privilege-map.ts  (Dataverse PrivilegeName → AppPermission)
 *   src/permissions/permission.service.ts  (Set<AppPermission> check)
 *
 * This file is intentionally empty and will be removed in a future cleanup pass.
 */

export {};
