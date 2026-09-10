import { Cr240_assetassignmentsService } from '../generated/services/Cr240_assetassignmentsService';
import type { Cr240_assetassignments } from '../generated/models/Cr240_assetassignmentsModel';
import { AssetService } from './asset.service';

export type AssignmentStatus = 'Active' | 'Returned' | 'Transferred';

export interface AssetAssignmentItem {
  id: string;
  assetId: string;
  assetName: string;
  assignedToName: string;
  assignedToEmail?: string;
  assignmentDate: string;
  expectedReturnDate?: string;
  returnedDate?: string;
  status: AssignmentStatus;
  notes?: string;
  createdOn?: string;
}

const DEFAULT_ASSIGNMENTS: AssetAssignmentItem[] = [
  {
    id: 'asg-101',
    assetId: 'ast-101',
    assetName: 'Dell XPS 15 9530 (i9, 32GB, 1TB SSD)',
    assignedToName: 'Visva V',
    assignedToEmail: 'visva@company.com',
    assignmentDate: '2025-06-15',
    expectedReturnDate: '2026-06-15',
    status: 'Active',
    notes: 'Primary developer workstation for cloud engineering.',
  },
  {
    id: 'asg-102',
    assetId: 'ast-103',
    assetName: 'Dell UltraSharp 32" 4K USB-C Hub Monitor (U3223QE)',
    assignedToName: 'Sarah Connor',
    assignedToEmail: 'sarah.connor@company.com',
    assignmentDate: '2025-04-15',
    expectedReturnDate: '2026-04-15',
    status: 'Active',
    notes: 'Manager desk workstation setup.',
  },
  {
    id: 'asg-103',
    assetId: 'ast-106',
    assetName: 'Logitech Rally Bar Video Conference System',
    assignedToName: 'David Miller',
    assignedToEmail: 'david.miller@company.com',
    assignmentDate: '2025-02-18',
    expectedReturnDate: '2026-02-18',
    status: 'Active',
    notes: 'Boardroom conference room setup.',
  },
  {
    id: 'asg-104',
    assetId: 'ast-105',
    assetName: 'iPad Pro 12.9" M2 Wi-Fi + Cellular (256GB)',
    assignedToName: 'Marcus Brody',
    assignedToEmail: 'marcus.brody@company.com',
    assignmentDate: '2025-01-10',
    expectedReturnDate: '2025-07-10',
    returnedDate: '2025-07-08',
    status: 'Returned',
    notes: 'Temporary field audit project completed.',
  },
];

let localAssignmentStore: AssetAssignmentItem[] = [...DEFAULT_ASSIGNMENTS];

export class AssignmentService {
  public static async getAllAssignments(): Promise<AssetAssignmentItem[]> {
    try {
      const res = await Cr240_assetassignmentsService.getAll({ top: 100 });
      if (res && res.success && res.data && res.data.length > 0) {
        const dvItems: AssetAssignmentItem[] = res.data.map((a: Cr240_assetassignments) => {
          const existing = localAssignmentStore.find((x) => x.id === a.cr240_assetassignmentid);
          return {
            id: a.cr240_assetassignmentid,
            assetId: a._cr240_assetid_value || existing?.assetId || 'unknown',
            assetName: a.cr240_assetidname || existing?.assetName || 'Assigned Equipment',
            assignedToName: a.cr240_assignmentname?.split(' - ')[1] || existing?.assignedToName || 'Employee',
            assignedToEmail: existing?.assignedToEmail || 'employee@company.com',
            assignmentDate: a.cr240_assignmentdate ? a.cr240_assignmentdate.split('T')[0] : '2026-01-01',
            expectedReturnDate: existing?.expectedReturnDate,
            returnedDate: existing?.returnedDate,
            status: existing?.status || (a.statecode === 0 ? 'Active' : 'Returned'),
            notes: existing?.notes,
            createdOn: a.createdon,
          };
        });

        // Merge keeping local updates
        const map = new Map<string, AssetAssignmentItem>();
        for (const it of dvItems) map.set(it.id, it);
        for (const it of localAssignmentStore) {
          if (!map.has(it.id)) map.set(it.id, it);
        }
        return Array.from(map.values());
      }
    } catch (err) {
      console.warn('Dataverse assignments query error, using local store:', err);
    }
    return [...localAssignmentStore];
  }

  public static async assignAsset(data: {
    assetId: string;
    assetName: string;
    assignedToName: string;
    assignedToEmail?: string;
    assignmentDate?: string;
    expectedReturnDate?: string;
    notes?: string;
  }): Promise<AssetAssignmentItem> {
    const today = data.assignmentDate || new Date().toISOString().split('T')[0];
    const assignmentName = `${data.assetName} - ${data.assignedToName}`;

    try {
      const record: Record<string, unknown> = {
        cr240_assignmentname: assignmentName,
        cr240_assignmentdate: today,
        statecode: 0,
        statuscode: 1,
      };
      if (!data.assetId.startsWith('ast-')) {
        record['cr240_AssetID@odata.bind'] = `/cr240_assets(${data.assetId})`;
      }

      const res = await Cr240_assetassignmentsService.create(record as never);
      if (res && res.success && res.data) {
        const item: AssetAssignmentItem = {
          id: res.data.cr240_assetassignmentid,
          assetId: data.assetId,
          assetName: data.assetName,
          assignedToName: data.assignedToName,
          assignedToEmail: data.assignedToEmail,
          assignmentDate: today,
          expectedReturnDate: data.expectedReturnDate,
          status: 'Active',
          notes: data.notes,
          createdOn: res.data.createdon || new Date().toISOString(),
        };
        localAssignmentStore.unshift(item);
        AssetService.updateAssetStatus(data.assetId, 'Assigned');
        return item;
      }
    } catch (err) {
      console.warn('Dataverse assignAsset error, recording locally:', err);
    }

    const fallback: AssetAssignmentItem = {
      id: `asg-${Date.now()}`,
      assetId: data.assetId,
      assetName: data.assetName,
      assignedToName: data.assignedToName,
      assignedToEmail: data.assignedToEmail,
      assignmentDate: today,
      expectedReturnDate: data.expectedReturnDate,
      status: 'Active',
      notes: data.notes,
      createdOn: new Date().toISOString(),
    };
    localAssignmentStore.unshift(fallback);
    AssetService.updateAssetStatus(data.assetId, 'Assigned');
    return fallback;
  }

  public static async returnAsset(assignmentId: string, assetId?: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    try {
      await Cr240_assetassignmentsService.update(assignmentId, {
        statecode: 1, // Inactive
        statuscode: 2,
      });
    } catch (err) {
      console.warn('Dataverse returnAsset error, processing locally:', err);
    }

    localAssignmentStore = localAssignmentStore.map((a) => {
      if (a.id === assignmentId) {
        if (assetId || a.assetId) {
          AssetService.updateAssetStatus(assetId || a.assetId, 'Available');
        }
        return {
          ...a,
          status: 'Returned',
          returnedDate: today,
        };
      }
      return a;
    });
  }

  public static async transferAsset(
    assignmentId: string,
    newAssigneeName: string,
    newAssigneeEmail?: string,
    assetId?: string
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    try {
      await Cr240_assetassignmentsService.update(assignmentId, {
        cr240_assignmentname: `Transferred to ${newAssigneeName}`,
      });
    } catch (err) {
      console.warn('Dataverse transferAsset error, updating locally:', err);
    }

    localAssignmentStore = localAssignmentStore.map((a) => {
      if (a.id === assignmentId) {
        return {
          ...a,
          assignedToName: newAssigneeName,
          assignedToEmail: newAssigneeEmail || a.assignedToEmail,
          assignmentDate: today,
          status: 'Active',
          notes: `${a.notes ? a.notes + ' | ' : ''}Transferred to ${newAssigneeName} on ${today}`,
        };
      }
      return a;
    });

    if (assetId) {
      AssetService.updateAssetStatus(assetId, 'Assigned');
    }
  }
}
