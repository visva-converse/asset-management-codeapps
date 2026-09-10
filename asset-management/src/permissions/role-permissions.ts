import type { DataverseRole } from '../types';
import { AppPermissions, type AppPermission } from './permissions';

export const ROLE_PERMISSIONS: Record<DataverseRole, readonly AppPermission[]> = {
  'Asset Management - Employee': [
    AppPermissions.VIEW_ASSETS,
    AppPermissions.CREATE_REQUEST,
    AppPermissions.VIEW_REQUESTS,
  ],

  'Asset Management - Manager': [
    AppPermissions.VIEW_ASSETS,
    AppPermissions.VIEW_REQUESTS,
    AppPermissions.UPDATE_REQUEST,
    AppPermissions.APPROVE_REQUEST,
    AppPermissions.REJECT_REQUEST,
  ],

  'Asset Management - Asset Administrator': [
    AppPermissions.VIEW_ASSETS,
    AppPermissions.CREATE_ASSET,
    AppPermissions.UPDATE_ASSET,
    AppPermissions.DELETE_ASSET,
    AppPermissions.VIEW_REQUESTS,
    AppPermissions.UPDATE_REQUEST,
    AppPermissions.ASSIGN_ASSET,
    AppPermissions.RETURN_ASSET,
    AppPermissions.TRANSFER_ASSET,
    AppPermissions.MANAGE_MAINTENANCE,
  ],

  'Asset Management - IT Administrator': [
    AppPermissions.VIEW_ASSETS,
    AppPermissions.CREATE_ASSET,
    AppPermissions.UPDATE_ASSET,
    AppPermissions.DELETE_ASSET,
    AppPermissions.VIEW_REQUESTS,
    AppPermissions.UPDATE_REQUEST,
    AppPermissions.ASSIGN_ASSET,
    AppPermissions.RETURN_ASSET,
    AppPermissions.TRANSFER_ASSET,
    AppPermissions.MANAGE_MAINTENANCE,
    AppPermissions.MANAGE_CATEGORIES,
    AppPermissions.MANAGE_LOCATIONS,
  ],
};
