import { Cr240_assetrequestsService } from '../generated/services/Cr240_assetrequestsService';
import type { Cr240_assetrequests } from '../generated/models/Cr240_assetrequestsModel';

export type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface AssetRequestItem {
  id: string;
  requestNumber: string;
  requestName: string;
  categoryId?: string;
  categoryName?: string;
  requestedBy: string;
  requestedByEmail?: string;
  requestDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: RequestStatus;
  statusCode: number;
  businessJustification?: string;
  rejectionReason?: string;
  approvedBy?: string;
  approvedDate?: string;
  createdOn?: string;
}

const DEFAULT_REQUESTS: AssetRequestItem[] = [
  {
    id: 'req-101',
    requestNumber: 'REQ-2026-0042',
    requestName: 'High-Performance Workstation for AI Modeling',
    categoryId: 'cat-1',
    categoryName: 'Laptops & Workstations',
    requestedBy: 'Visva V',
    requestedByEmail: 'visva@company.com',
    requestDate: '2026-09-02',
    priority: 'High',
    status: 'Pending',
    statusCode: 805530000,
    businessJustification: 'Required for local training and inference testing of agentic models.',
  },
  {
    id: 'req-102',
    requestNumber: 'REQ-2026-0039',
    requestName: '4K UltraSharp Dual Monitor Setup',
    categoryId: 'cat-2',
    categoryName: 'Monitors & Displays',
    requestedBy: 'Emma Watson',
    requestedByEmail: 'emma.watson@company.com',
    requestDate: '2026-08-28',
    priority: 'Medium',
    status: 'Approved',
    statusCode: 805530001,
    businessJustification: 'Ergonomic dual screen setup for high-fidelity Figma UI/UX production.',
    approvedBy: 'Sarah Connor',
    approvedDate: '2026-08-29',
  },
  {
    id: 'req-103',
    requestNumber: 'REQ-2026-0035',
    requestName: 'iPad Pro 12.9" with Apple Pencil',
    categoryId: 'cat-3',
    categoryName: 'Mobile Devices & Tablets',
    requestedBy: 'Marcus Brody',
    requestedByEmail: 'marcus.brody@company.com',
    requestDate: '2026-08-20',
    priority: 'Low',
    status: 'Rejected',
    statusCode: 805530002,
    businessJustification: 'Reviewing quarterly financial reports during executive travel.',
    rejectionReason: 'Standard laptop already provisioned; tablets reserved for field engineering.',
  },
  {
    id: 'req-104',
    requestNumber: 'REQ-2026-0045',
    requestName: 'Noise Cancelling Video Headset & 4K Webcam',
    categoryId: 'cat-6',
    categoryName: 'Audio & Video Conferencing',
    requestedBy: 'Visva V',
    requestedByEmail: 'visva@company.com',
    requestDate: '2026-09-07',
    priority: 'Medium',
    status: 'Pending',
    statusCode: 805530000,
    businessJustification: 'Client video demonstrations and remote engineering syncs.',
  },
];

let localRequestStore: AssetRequestItem[] = [...DEFAULT_REQUESTS];

export class RequestService {
  public static async getAllRequests(): Promise<AssetRequestItem[]> {
    try {
      const res = await Cr240_assetrequestsService.getAll({ top: 100 });
      if (res && res.success && res.data && res.data.length > 0) {
        const dvItems: AssetRequestItem[] = res.data.map((r: Cr240_assetrequests, idx) => {
          const statusMap: Record<number, RequestStatus> = {
            805530000: 'Pending',
            805530001: 'Approved',
            805530002: 'Rejected',
          };
          const existing = localRequestStore.find((x) => x.id === r.cr240_assetrequestid);
          const st = r.cr240_status !== undefined ? statusMap[r.cr240_status] || 'Pending' : 'Pending';

          return {
            id: r.cr240_assetrequestid,
            requestNumber: existing?.requestNumber || `REQ-2026-00${10 + idx}`,
            requestName: r.cr240_requestname || 'Hardware Asset Request',
            categoryId: r._cr240_assetcategoryid_value,
            categoryName: r.cr240_assetcategoryidname || existing?.categoryName,
            requestedBy: r.createdbyname || existing?.requestedBy || 'Enterprise User',
            requestedByEmail: existing?.requestedByEmail || 'user@company.com',
            requestDate: r.cr240_requestdate ? r.cr240_requestdate.split('T')[0] : '2026-09-08',
            priority: existing?.priority || 'Medium',
            status: existing?.status || st,
            statusCode: r.cr240_status ?? 805530000,
            businessJustification: existing?.businessJustification || 'Standard departmental equipment request.',
            rejectionReason: existing?.rejectionReason,
            approvedBy: existing?.approvedBy,
            approvedDate: existing?.approvedDate,
            createdOn: r.createdon,
          };
        });

        // Merge keeping local updates
        const map = new Map<string, AssetRequestItem>();
        for (const it of dvItems) map.set(it.id, it);
        for (const it of localRequestStore) {
          if (!map.has(it.id)) map.set(it.id, it);
        }
        return Array.from(map.values());
      }
    } catch (err) {
      console.warn('Dataverse requests query error, using local repository:', err);
    }
    return [...localRequestStore];
  }

  public static async getMyRequests(userEmail?: string, userName?: string): Promise<AssetRequestItem[]> {
    const all = await this.getAllRequests();
    if (!userEmail && !userName) return all;
    return all.filter((r) => {
      if (userEmail && r.requestedByEmail?.toLowerCase() === userEmail.toLowerCase()) return true;
      if (userName && r.requestedBy.toLowerCase().includes(userName.toLowerCase())) return true;
      return false;
    });
  }

  public static async getPendingApprovals(): Promise<AssetRequestItem[]> {
    const all = await this.getAllRequests();
    return all.filter((r) => r.status === 'Pending');
  }

  public static async createRequest(data: {
    requestName: string;
    categoryId?: string;
    categoryName?: string;
    requestedBy: string;
    requestedByEmail?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
    businessJustification?: string;
  }): Promise<AssetRequestItem> {
    const reqNum = `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split('T')[0];

    try {
      const record: Record<string, unknown> = {
        cr240_requestname: data.requestName,
        cr240_requestdate: today,
        cr240_status: 805530000, // Pending
        statecode: 0,
        statuscode: 1,
      };
      if (data.categoryId && !data.categoryId.startsWith('cat-')) {
        record['cr240_AssetCategoryID@odata.bind'] = `/cr240_assetcategories(${data.categoryId})`;
      }

      const res = await Cr240_assetrequestsService.create(record as never);
      if (res && res.success && res.data) {
        const item: AssetRequestItem = {
          id: res.data.cr240_assetrequestid,
          requestNumber: reqNum,
          requestName: data.requestName,
          categoryId: data.categoryId,
          categoryName: data.categoryName,
          requestedBy: data.requestedBy,
          requestedByEmail: data.requestedByEmail,
          requestDate: today,
          priority: data.priority || 'Medium',
          status: 'Pending',
          statusCode: 805530000,
          businessJustification: data.businessJustification,
          createdOn: res.data.createdon || new Date().toISOString(),
        };
        localRequestStore.unshift(item);
        return item;
      }
    } catch (err) {
      console.warn('Dataverse createRequest error, recording in local store:', err);
    }

    const fallback: AssetRequestItem = {
      id: `req-${Date.now()}`,
      requestNumber: reqNum,
      requestName: data.requestName,
      categoryId: data.categoryId,
      categoryName: data.categoryName,
      requestedBy: data.requestedBy,
      requestedByEmail: data.requestedByEmail,
      requestDate: today,
      priority: data.priority || 'Medium',
      status: 'Pending',
      statusCode: 805530000,
      businessJustification: data.businessJustification,
      createdOn: new Date().toISOString(),
    };
    localRequestStore.unshift(fallback);
    return fallback;
  }

  /**
   * Executes the Manager Approval workflow for an asset request.
   * Updates status code in Dataverse to Approved (805530001).
   */
  public static async executeApprovalWorkflow(
    requestId: string,
    managerName: string
  ): Promise<void> {
    try {
      await Cr240_assetrequestsService.update(requestId, {
        cr240_status: 805530001 as never, // Approved
      });
    } catch (err) {
      console.warn('Dataverse executeApprovalWorkflow error, processing locally:', err);
    }

    localRequestStore = localRequestStore.map((r) => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'Approved',
          statusCode: 805530001,
          approvedBy: managerName,
          approvedDate: new Date().toISOString().split('T')[0],
        };
      }
      return r;
    });
  }

  /**
   * Executes the Manager Rejection workflow for an asset request with a mandatory reason.
   * Updates status code in Dataverse to Rejected (805530002).
   */
  public static async executeRejectionWorkflow(
    requestId: string,
    managerName: string,
    reason: string
  ): Promise<void> {
    try {
      await Cr240_assetrequestsService.update(requestId, {
        cr240_status: 805530002 as never, // Rejected
      });
    } catch (err) {
      console.warn('Dataverse executeRejectionWorkflow error, processing locally:', err);
    }

    localRequestStore = localRequestStore.map((r) => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'Rejected',
          statusCode: 805530002,
          rejectionReason: reason,
          approvedBy: managerName,
          approvedDate: new Date().toISOString().split('T')[0],
        };
      }
      return r;
    });
  }

  public static async cancelRequest(requestId: string): Promise<void> {
    try {
      await Cr240_assetrequestsService.update(requestId, {
        statecode: 1, // Inactive
        statuscode: 2,
      });
    } catch (err) {
      console.warn('Dataverse cancelRequest error, canceling locally:', err);
    }

    localRequestStore = localRequestStore.map((r) => {
      if (r.id === requestId) {
        return { ...r, status: 'Cancelled', statusCode: 805530002 };
      }
      return r;
    });
  }
}
