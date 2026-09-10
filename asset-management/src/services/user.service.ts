import { SystemusersService } from '../generated/services/SystemusersService';
import type { Systemusers } from '../generated/models/SystemusersModel';

export interface DirectoryUser {
  id: string;
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
}

const DEFAULT_USERS: DirectoryUser[] = [
  {
    id: 'e81498b3-3a7b-4ea7-bc4e-28dbdf741892',
    fullName: 'Visva V',
    email: 'visva@company.com',
    jobTitle: 'Principal Lead Engineer',
    department: 'Information Technology',
  },
  {
    id: 'u-2',
    fullName: 'Sarah Connor',
    email: 'sarah.connor@company.com',
    jobTitle: 'Engineering Manager',
    department: 'Engineering',
  },
  {
    id: 'u-3',
    fullName: 'Alex Chen',
    email: 'alex.chen@company.com',
    jobTitle: 'Senior Systems Administrator',
    department: 'IT Operations',
  },
  {
    id: 'u-4',
    fullName: 'David Miller',
    email: 'david.miller@company.com',
    jobTitle: 'IT Infrastructure Lead',
    department: 'IT Infrastructure',
  },
  {
    id: 'u-5',
    fullName: 'Emma Watson',
    email: 'emma.watson@company.com',
    jobTitle: 'Product Designer',
    department: 'Design & UX',
  },
  {
    id: 'u-6',
    fullName: 'Marcus Brody',
    email: 'marcus.brody@company.com',
    jobTitle: 'Financial Analyst',
    department: 'Finance',
  },
];

export class UserService {
  public static async getAllUsers(): Promise<DirectoryUser[]> {
    try {
      const res = await SystemusersService.getAll({ top: 200 });
      console.log("user details ", res);
      if (res && res.success && res.data && res.data.length > 0) {
        return res.data.map((u: Systemusers) => ({
          id: u.systemuserid,
          fullName: u.fullname || `${u.firstname || ''} ${u.lastname || ''}`.trim() || 'System User',
          email: u.internalemailaddress || u.domainname || 'user@company.com',
          jobTitle: u.jobtitle || 'Team Member',
          department: u.businessunitidname || 'Corporate',
        }));
      }
    } catch (err) {
      console.warn('Dataverse systemuser query error, using directory cache:', err);
    }
    return DEFAULT_USERS;
  }
}
