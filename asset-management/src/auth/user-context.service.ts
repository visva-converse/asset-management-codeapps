import { getContext } from '@microsoft/power-apps/app';
import type { CurrentUser } from '../types';

export class UserContextService {
  private static cachedUser: CurrentUser | null = null;

  /**
   * Retrieves the current user from the Microsoft Power Apps Code Apps SDK.
   * Falls back gracefully if running in local standalone dev environment.
   */
  public static async getCurrentUser(): Promise<CurrentUser> {
    if (this.cachedUser) {
      return this.cachedUser;
    }

    try {
      const context = await getContext();
      if (context && context.user) {
        const u = context.user;
        const user: CurrentUser = {
          fullName: u.fullName || 'Enterprise User',
          objectId: u.objectId || '00000000-0000-0000-0000-000000000001',
          tenantId: u.tenantId || '00000000-0000-0000-0000-000000000002',
          userPrincipalName: u.userPrincipalName || 'user@company.com',
        };
        this.cachedUser = user;
        return user;
      }
    } catch (err) {
      console.warn(
        'UserContextService: getContext() not available in current host, using enterprise local profile.',
        err
      );
    }

    // Default enterprise fallback for local execution
    const fallbackUser: CurrentUser = {
      fullName: 'Visva V',
      objectId: 'e81498b3-3a7b-4ea7-bc4e-28dbdf741892',
      tenantId: '8593d72e-7626-ead7-84be-5bb97af773d8',
      userPrincipalName: 'visva@company.com',
      systemUserId: 'e81498b3-3a7b-4ea7-bc4e-28dbdf741892',
    };
    this.cachedUser = fallbackUser;
    return fallbackUser;
  }

  public static clearCache(): void {
    this.cachedUser = null;
  }
}
