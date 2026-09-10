import { Cr240_locationsService } from '../generated/services/Cr240_locationsService';
import type { Cr240_locations } from '../generated/models/Cr240_locationsModel';

export interface LocationItem {
  id: string;
  name: string;
  createdOn?: string;
  isActive: boolean;
}

const DEFAULT_LOCATIONS: LocationItem[] = [
  { id: 'loc-1', name: 'HQ - Floor 2 Engineering', isActive: true, createdOn: '2026-01-10' },
  { id: 'loc-2', name: 'HQ - Floor 4 Executive & Finance', isActive: true, createdOn: '2026-01-10' },
  { id: 'loc-3', name: 'HQ - Server Room Alpha', isActive: true, createdOn: '2026-01-12' },
  { id: 'loc-4', name: 'London Regional Office', isActive: true, createdOn: '2026-01-14' },
  { id: 'loc-5', name: 'Singapore Regional Hub', isActive: true, createdOn: '2026-01-15' },
  { id: 'loc-6', name: 'Remote / Work From Home', isActive: true, createdOn: '2026-01-15' },
];

let localLocationStore: LocationItem[] = [...DEFAULT_LOCATIONS];

export class LocationService {
  public static async getAllLocations(): Promise<LocationItem[]> {
    try {
      const res = await Cr240_locationsService.getAll({ top: 100 });
      if (res && res.success && res.data && res.data.length > 0) {
        return res.data.map((l: Cr240_locations) => ({
          id: l.cr240_locationid,
          name: l.cr240_locationname || 'Unnamed Location',
          createdOn: l.createdon,
          isActive: l.statecode === 0,
        }));
      }
    } catch (err) {
      console.warn('Dataverse location query error, falling back to cached state:', err);
    }
    return [...localLocationStore];
  }

  public static async createLocation(name: string): Promise<LocationItem> {
    try {
      const res = await Cr240_locationsService.create({
        cr240_locationname: name,
        statecode: 0,
        statuscode: 1,
      });
      if (res && res.success && res.data) {
        const item: LocationItem = {
          id: res.data.cr240_locationid,
          name: res.data.cr240_locationname || name,
          createdOn: res.data.createdon || new Date().toISOString(),
          isActive: true,
        };
        localLocationStore.unshift(item);
        return item;
      }
    } catch (err) {
      console.warn('Dataverse createLocation failed, committing to local store:', err);
    }
    const item: LocationItem = {
      id: `loc-${Date.now()}`,
      name,
      createdOn: new Date().toISOString().split('T')[0],
      isActive: true,
    };
    localLocationStore.unshift(item);
    return item;
  }

  public static async updateLocation(id: string, name: string): Promise<void> {
    try {
      await Cr240_locationsService.update(id, {
        cr240_locationname: name,
      });
    } catch (err) {
      console.warn('Dataverse updateLocation failed, updating local state:', err);
    }
    localLocationStore = localLocationStore.map((l) => (l.id === id ? { ...l, name } : l));
  }

  public static async deleteLocation(id: string): Promise<void> {
    try {
      await Cr240_locationsService.delete(id);
    } catch (err) {
      console.warn('Dataverse deleteLocation failed, updating local state:', err);
    }
    localLocationStore = localLocationStore.filter((l) => l.id !== id);
  }
}
