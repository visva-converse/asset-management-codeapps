import { Cr240_assetsService } from '../generated/services/Cr240_assetsService';
import type { Cr240_assets } from '../generated/models/Cr240_assetsModel';

export type AssetStatus = 'Available' | 'Assigned' | 'Maintenance' | 'Retired';

export interface AssetItem {
  id: string;
  name: string;
  categoryId?: string;
  categoryName?: string;
  locationId?: string;
  locationName?: string;
  purchaseDate?: string;
  value?: number;
  status: AssetStatus;
  statecode: number;
  createdOn?: string;
}

export interface AssetFilterOptions {
  search?: string;
  categoryId?: string;
  locationId?: string;
  status?: string;
}

const DEFAULT_ASSETS: AssetItem[] = [
  {
    id: 'ast-101',
    name: 'Dell XPS 15 9530 (i9, 32GB, 1TB SSD)',
    categoryId: 'cat-1',
    categoryName: 'Laptops & Workstations',
    locationId: 'loc-1',
    locationName: 'HQ - Floor 2 Engineering',
    purchaseDate: '2025-06-12',
    value: 2399,
    status: 'Assigned',
    statecode: 0,
    createdOn: '2025-06-12',
  },
  {
    id: 'ast-102',
    name: 'MacBook Pro 16" M3 Max (36GB Unified, 1TB)',
    categoryId: 'cat-1',
    categoryName: 'Laptops & Workstations',
    locationId: 'loc-1',
    locationName: 'HQ - Floor 2 Engineering',
    purchaseDate: '2025-08-20',
    value: 3499,
    status: 'Available',
    statecode: 0,
    createdOn: '2025-08-20',
  },
  {
    id: 'ast-103',
    name: 'Dell UltraSharp 32" 4K USB-C Hub Monitor (U3223QE)',
    categoryId: 'cat-2',
    categoryName: 'Monitors & Displays',
    locationId: 'loc-2',
    locationName: 'HQ - Floor 4 Executive & Finance',
    purchaseDate: '2025-04-10',
    value: 849,
    status: 'Assigned',
    statecode: 0,
    createdOn: '2025-04-10',
  },
  {
    id: 'ast-104',
    name: 'Cisco Catalyst 9300 48-Port PoE+ Switch',
    categoryId: 'cat-4',
    categoryName: 'Network & Server Gear',
    locationId: 'loc-3',
    locationName: 'HQ - Server Room Alpha',
    purchaseDate: '2024-11-05',
    value: 4850,
    status: 'Maintenance',
    statecode: 0,
    createdOn: '2024-11-05',
  },
  {
    id: 'ast-105',
    name: 'iPad Pro 12.9" M2 Wi-Fi + Cellular (256GB)',
    categoryId: 'cat-3',
    categoryName: 'Mobile Devices & Tablets',
    locationId: 'loc-4',
    locationName: 'London Regional Office',
    purchaseDate: '2025-09-01',
    value: 1299,
    status: 'Available',
    statecode: 0,
    createdOn: '2025-09-01',
  },
  {
    id: 'ast-106',
    name: 'Logitech Rally Bar Video Conference System',
    categoryId: 'cat-6',
    categoryName: 'Audio & Video Conferencing',
    locationId: 'loc-2',
    locationName: 'HQ - Floor 4 Executive & Finance',
    purchaseDate: '2025-02-14',
    value: 3999,
    status: 'Assigned',
    statecode: 0,
    createdOn: '2025-02-14',
  },
  {
    id: 'ast-107',
    name: 'Lenovo ThinkPad X1 Carbon Gen 11',
    categoryId: 'cat-1',
    categoryName: 'Laptops & Workstations',
    locationId: 'loc-6',
    locationName: 'Remote / Work From Home',
    purchaseDate: '2025-07-22',
    value: 1850,
    status: 'Available',
    statecode: 0,
    createdOn: '2025-07-22',
  },
  {
    id: 'ast-108',
    name: 'Samsung Odyssey Neo G9 49" Curved Display',
    categoryId: 'cat-2',
    categoryName: 'Monitors & Displays',
    locationId: 'loc-1',
    locationName: 'HQ - Floor 2 Engineering',
    purchaseDate: '2025-03-30',
    value: 1499,
    status: 'Maintenance',
    statecode: 0,
    createdOn: '2025-03-30',
  },
];

let localAssetStore: AssetItem[] = [...DEFAULT_ASSETS];

export class AssetService {
  public static async getAllAssets(filters?: AssetFilterOptions): Promise<AssetItem[]> {
    let items = [...localAssetStore];

    try {
      const res = await Cr240_assetsService.getAll({ top: 100 });
      if (res && res.success && res.data && res.data.length > 0) {
        const dvItems: AssetItem[] = res.data.map((a: Cr240_assets) => {
          const existing = localAssetStore.find((x) => x.id === a.cr240_assetid);
          return {
            id: a.cr240_assetid,
            name: a.cr240_assetname || 'Unnamed Asset',
            categoryId: a._cr240_assetcategoryid_value,
            categoryName: a.cr240_assetcategoryidname || existing?.categoryName,
            locationId: a._cr240_locationid_value,
            locationName: a.cr240_locationidname || existing?.locationName,
            purchaseDate: a.cr240_purchasedate ? a.cr240_purchasedate.split('T')[0] : undefined,
            value: a.cr240_value,
            status: existing?.status || (a.statecode === 0 ? 'Available' : 'Retired'),
            statecode: a.statecode,
            createdOn: a.createdon,
          };
        });

        // Merge keeping local updates
        const map = new Map<string, AssetItem>();
        for (const it of dvItems) map.set(it.id, it);
        for (const it of localAssetStore) {
          if (!map.has(it.id)) map.set(it.id, it);
        }
        items = Array.from(map.values());
      }
    } catch (err) {
      console.warn('Dataverse assets query failed, using local repository:', err);
    }

    if (!filters) return items;

    return items.filter((item) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCat = item.categoryName?.toLowerCase().includes(q);
        const matchesLoc = item.locationName?.toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesLoc) return false;
      }
      if (filters.categoryId && filters.categoryId !== 'ALL') {
        if (item.categoryId !== filters.categoryId) return false;
      }
      if (filters.locationId && filters.locationId !== 'ALL') {
        if (item.locationId !== filters.locationId) return false;
      }
      if (filters.status && filters.status !== 'ALL') {
        if (item.status !== filters.status) return false;
      }
      return true;
    });
  }

  public static async getAssetById(id: string): Promise<AssetItem | undefined> {
    try {
      const res = await Cr240_assetsService.get(id);
      if (res && res.success && res.data) {
        const a = res.data;
        const existing = localAssetStore.find((x) => x.id === a.cr240_assetid);
        return {
          id: a.cr240_assetid,
          name: a.cr240_assetname || 'Unnamed Asset',
          categoryId: a._cr240_assetcategoryid_value,
          categoryName: a.cr240_assetcategoryidname || existing?.categoryName,
          locationId: a._cr240_locationid_value,
          locationName: a.cr240_locationidname || existing?.locationName,
          purchaseDate: a.cr240_purchasedate ? a.cr240_purchasedate.split('T')[0] : undefined,
          value: a.cr240_value,
          status: existing?.status || 'Available',
          statecode: a.statecode,
          createdOn: a.createdon,
        };
      }
    } catch (err) {
      console.warn('Dataverse getAssetById failed:', err);
    }
    return localAssetStore.find((a) => a.id === id);
  }

  public static async createAsset(data: {
    name: string;
    categoryId?: string;
    categoryName?: string;
    locationId?: string;
    locationName?: string;
    purchaseDate?: string;
    value?: number;
  }): Promise<AssetItem> {
    try {
      const record: Record<string, unknown> = {
        cr240_assetname: data.name,
        statecode: 0,
        statuscode: 1,
      };
      if (data.purchaseDate) record.cr240_purchasedate = data.purchaseDate;
      if (data.value !== undefined) record.cr240_value = data.value;
      if (data.categoryId && !data.categoryId.startsWith('cat-')) {
        record['cr240_AssetCategoryID@odata.bind'] = `/cr240_assetcategories(${data.categoryId})`;
      }
      if (data.locationId && !data.locationId.startsWith('loc-')) {
        record['cr240_LocationID@odata.bind'] = `/cr240_locations(${data.locationId})`;
      }

      const res = await Cr240_assetsService.create(record as never);
      if (res && res.success && res.data) {
        const newItem: AssetItem = {
          id: res.data.cr240_assetid,
          name: res.data.cr240_assetname || data.name,
          categoryId: data.categoryId,
          categoryName: data.categoryName,
          locationId: data.locationId,
          locationName: data.locationName,
          purchaseDate: data.purchaseDate,
          value: data.value,
          status: 'Available',
          statecode: 0,
          createdOn: res.data.createdon || new Date().toISOString(),
        };
        localAssetStore.unshift(newItem);
        return newItem;
      }
    } catch (err) {
      console.warn('Dataverse createAsset error, saving locally:', err);
    }

    const fallbackItem: AssetItem = {
      id: `ast-${Date.now()}`,
      name: data.name,
      categoryId: data.categoryId,
      categoryName: data.categoryName,
      locationId: data.locationId,
      locationName: data.locationName,
      purchaseDate: data.purchaseDate || new Date().toISOString().split('T')[0],
      value: data.value,
      status: 'Available',
      statecode: 0,
      createdOn: new Date().toISOString(),
    };
    localAssetStore.unshift(fallbackItem);
    return fallbackItem;
  }

  public static async updateAsset(
    id: string,
    data: {
      name?: string;
      categoryId?: string;
      categoryName?: string;
      locationId?: string;
      locationName?: string;
      purchaseDate?: string;
      value?: number;
      status?: AssetStatus;
    }
  ): Promise<void> {
    try {
      const changed: Record<string, unknown> = {};
      if (data.name) changed.cr240_assetname = data.name;
      if (data.purchaseDate) changed.cr240_purchasedate = data.purchaseDate;
      if (data.value !== undefined) changed.cr240_value = data.value;
      if (data.categoryId && !data.categoryId.startsWith('cat-')) {
        changed['cr240_AssetCategoryID@odata.bind'] = `/cr240_assetcategories(${data.categoryId})`;
      }
      if (data.locationId && !data.locationId.startsWith('loc-')) {
        changed['cr240_LocationID@odata.bind'] = `/cr240_locations(${data.locationId})`;
      }

      await Cr240_assetsService.update(id, changed as never);
    } catch (err) {
      console.warn('Dataverse updateAsset error, updating locally:', err);
    }

    localAssetStore = localAssetStore.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          ...data,
          name: data.name ?? item.name,
          categoryName: data.categoryName ?? item.categoryName,
          locationName: data.locationName ?? item.locationName,
          status: data.status ?? item.status,
        };
      }
      return item;
    });
  }

  public static async deleteAsset(id: string): Promise<void> {
    try {
      await Cr240_assetsService.delete(id);
    } catch (err) {
      console.warn('Dataverse deleteAsset error, removing locally:', err);
    }
    localAssetStore = localAssetStore.filter((a) => a.id !== id);
  }

  public static updateAssetStatus(id: string, status: AssetStatus): void {
    localAssetStore = localAssetStore.map((a) => (a.id === id ? { ...a, status } : a));
  }
}
