import { Cr240_assetmaintenancesService } from '../generated/services/Cr240_assetmaintenancesService';
import type { Cr240_assetmaintenances } from '../generated/models/Cr240_assetmaintenancesModel';
import { AssetService } from './asset.service';

export type MaintenanceType = 'Preventive' | 'Corrective' | 'Predictive';
export type MaintenanceStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  assetName: string;
  title: string;
  type: MaintenanceType;
  typeCode: number;
  maintenanceDate: string;
  completedDate?: string;
  cost: number;
  status: MaintenanceStatus;
  technician?: string;
  description?: string;
  createdOn?: string;
}

const DEFAULT_MAINTENANCE: MaintenanceRecord[] = [
  {
    id: 'mnt-101',
    assetId: 'ast-104',
    assetName: 'Cisco Catalyst 9300 48-Port PoE+ Switch',
    title: 'Core Switch Firmware Upgrade & Power Supply Redundancy Test',
    type: 'Preventive',
    typeCode: 805530000,
    maintenanceDate: '2026-09-12',
    cost: 450,
    status: 'Scheduled',
    technician: 'NetOps Specialist Alex Chen',
    description: 'Scheduled maintenance window for IOS-XE security patches.',
  },
  {
    id: 'mnt-102',
    assetId: 'ast-108',
    assetName: 'Samsung Odyssey Neo G9 49" Curved Display',
    title: 'Backlight Inverter & DisplayPort Controller Repair',
    type: 'Corrective',
    typeCode: 805530001,
    maintenanceDate: '2026-09-05',
    cost: 320,
    status: 'In Progress',
    technician: 'Hardware Depot Tech',
    description: 'Screen flickering under HDR 1000 mode.',
  },
  {
    id: 'mnt-103',
    assetId: 'ast-101',
    assetName: 'Dell XPS 15 9530 (i9, 32GB, 1TB SSD)',
    title: 'Annual Thermal Paste & Battery Health Diagnostic',
    type: 'Preventive',
    typeCode: 805530000,
    maintenanceDate: '2026-06-15',
    completedDate: '2026-06-15',
    cost: 95,
    status: 'Completed',
    technician: 'IT Support Visva V',
    description: 'Internal fan cleaning and thermal re-paste. Passed all tests.',
  },
  {
    id: 'mnt-104',
    assetId: 'ast-106',
    assetName: 'Logitech Rally Bar Video Conference System',
    title: 'Predictive Lens Actuator Calibration',
    type: 'Predictive',
    typeCode: 805530002,
    maintenanceDate: '2026-08-10',
    completedDate: '2026-08-10',
    cost: 180,
    status: 'Completed',
    technician: 'AV Vendor Engineer',
    description: 'Automated telemetry flagged motor resistance anomaly. Calibrated.',
  },
];

let localMaintenanceStore: MaintenanceRecord[] = [...DEFAULT_MAINTENANCE];

export class MaintenanceService {
  public static async getAllMaintenance(): Promise<MaintenanceRecord[]> {
    try {
      const res = await Cr240_assetmaintenancesService.getAll({ top: 100 });
      if (res && res.success && res.data && res.data.length > 0) {
        const typeMap: Record<number, MaintenanceType> = {
          805530000: 'Preventive',
          805530001: 'Corrective',
          805530002: 'Predictive',
        };

        const dvItems: MaintenanceRecord[] = res.data.map((m: Cr240_assetmaintenances) => {
          const existing = localMaintenanceStore.find((x) => x.id === m.cr240_assetmaintenanceid);
          const t = m.cr240_maintenancetype !== undefined ? typeMap[m.cr240_maintenancetype] || 'Preventive' : 'Preventive';

          return {
            id: m.cr240_assetmaintenanceid,
            assetId: m._cr240_assetid_value || existing?.assetId || 'ast-unknown',
            assetName: m.cr240_assetidname || existing?.assetName || 'Enterprise Hardware Asset',
            title: m.cr240_maintenancename || 'Equipment Maintenance',
            type: t,
            typeCode: m.cr240_maintenancetype ?? 805530000,
            maintenanceDate: m.cr240_maintenancedate ? m.cr240_maintenancedate.split('T')[0] : '2026-09-01',
            completedDate: existing?.completedDate,
            cost: m.cr240_cost ?? existing?.cost ?? 0,
            status: existing?.status || (m.statecode === 0 ? 'Scheduled' : 'Completed'),
            technician: existing?.technician || 'IT Support Specialist',
            description: existing?.description,
            createdOn: m.createdon,
          };
        });

        // Merge keeping local updates
        const map = new Map<string, MaintenanceRecord>();
        for (const it of dvItems) map.set(it.id, it);
        for (const it of localMaintenanceStore) {
          if (!map.has(it.id)) map.set(it.id, it);
        }
        return Array.from(map.values());
      }
    } catch (err) {
      console.warn('Dataverse maintenance query error, using local records:', err);
    }
    return [...localMaintenanceStore];
  }

  public static async scheduleMaintenance(data: {
    assetId: string;
    assetName: string;
    title: string;
    type: MaintenanceType;
    maintenanceDate?: string;
    cost?: number;
    technician?: string;
    description?: string;
  }): Promise<MaintenanceRecord> {
    const today = data.maintenanceDate || new Date().toISOString().split('T')[0];
    const typeCodeMap: Record<MaintenanceType, number> = {
      Preventive: 805530000,
      Corrective: 805530001,
      Predictive: 805530002,
    };
    const code = typeCodeMap[data.type] || 805530000;

    try {
      const record: Record<string, unknown> = {
        cr240_maintenancename: data.title,
        cr240_maintenancedate: today,
        cr240_maintenancetype: code,
        cr240_cost: data.cost ?? 0,
        statecode: 0,
        statuscode: 1,
      };
      if (!data.assetId.startsWith('ast-')) {
        record['cr240_AssetID@odata.bind'] = `/cr240_assets(${data.assetId})`;
      }

      const res = await Cr240_assetmaintenancesService.create(record as never);
      if (res && res.success && res.data) {
        const item: MaintenanceRecord = {
          id: res.data.cr240_assetmaintenanceid,
          assetId: data.assetId,
          assetName: data.assetName,
          title: data.title,
          type: data.type,
          typeCode: code,
          maintenanceDate: today,
          cost: data.cost ?? 0,
          status: 'Scheduled',
          technician: data.technician,
          description: data.description,
          createdOn: res.data.createdon || new Date().toISOString(),
        };
        localMaintenanceStore.unshift(item);
        AssetService.updateAssetStatus(data.assetId, 'Maintenance');
        return item;
      }
    } catch (err) {
      console.warn('Dataverse scheduleMaintenance error, recording locally:', err);
    }

    const fallback: MaintenanceRecord = {
      id: `mnt-${Date.now()}`,
      assetId: data.assetId,
      assetName: data.assetName,
      title: data.title,
      type: data.type,
      typeCode: code,
      maintenanceDate: today,
      cost: data.cost ?? 0,
      status: 'Scheduled',
      technician: data.technician,
      description: data.description,
      createdOn: new Date().toISOString(),
    };
    localMaintenanceStore.unshift(fallback);
    AssetService.updateAssetStatus(data.assetId, 'Maintenance');
    return fallback;
  }

  public static async completeMaintenance(id: string, assetId?: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    try {
      await Cr240_assetmaintenancesService.update(id, {
        statecode: 1, // Inactive
        statuscode: 2,
      });
    } catch (err) {
      console.warn('Dataverse completeMaintenance error, completing locally:', err);
    }

    localMaintenanceStore = localMaintenanceStore.map((m) => {
      if (m.id === id) {
        return {
          ...m,
          status: 'Completed',
          completedDate: today,
        };
      }
      return m;
    });

    if (assetId) {
      AssetService.updateAssetStatus(assetId, 'Available');
    }
  }
}
