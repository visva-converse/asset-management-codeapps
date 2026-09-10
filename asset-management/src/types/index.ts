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
  | 'Asset Management - IT Administrator';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}
