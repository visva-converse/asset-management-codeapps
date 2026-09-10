import { Cr240_assetcategoriesService } from '../generated/services/Cr240_assetcategoriesService';
import type { Cr240_assetcategories } from '../generated/models/Cr240_assetcategoriesModel';

export interface CategoryItem {
  id: string;
  name: string;
  createdOn?: string;
  isActive: boolean;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'cat-1', name: 'Laptops & Workstations', isActive: true, createdOn: '2026-01-15' },
  { id: 'cat-2', name: 'Monitors & Displays', isActive: true, createdOn: '2026-01-15' },
  { id: 'cat-3', name: 'Mobile Devices & Tablets', isActive: true, createdOn: '2026-01-16' },
  { id: 'cat-4', name: 'Network & Server Gear', isActive: true, createdOn: '2026-01-18' },
  { id: 'cat-5', name: 'Peripherals & Accessories', isActive: true, createdOn: '2026-01-20' },
  { id: 'cat-6', name: 'Audio & Video Conferencing', isActive: true, createdOn: '2026-01-22' },
];

let localCategoryStore: CategoryItem[] = [...DEFAULT_CATEGORIES];

export class CategoryService {
  public static async getAllCategories(): Promise<CategoryItem[]> {
    try {
      const res = await Cr240_assetcategoriesService.getAll({ top: 100 });
      if (res && res.success && res.data && res.data.length > 0) {
        return res.data.map((c: Cr240_assetcategories) => ({
          id: c.cr240_assetcategoryid,
          name: c.cr240_assetcategoryname || 'Unnamed Category',
          createdOn: c.createdon,
          isActive: c.statecode === 0,
        }));
      }
    } catch (err) {
      console.warn('Dataverse category query error, falling back to cached state:', err);
    }
    return [...localCategoryStore];
  }

  public static async createCategory(name: string): Promise<CategoryItem> {
    try {
      const res = await Cr240_assetcategoriesService.create({
        cr240_assetcategoryname: name,
        statecode: 0,
        statuscode: 1,
      });
      if (res && res.success && res.data) {
        const item: CategoryItem = {
          id: res.data.cr240_assetcategoryid,
          name: res.data.cr240_assetcategoryname || name,
          createdOn: res.data.createdon || new Date().toISOString(),
          isActive: true,
        };
        localCategoryStore.unshift(item);
        return item;
      }
    } catch (err) {
      console.warn('Dataverse createCategory failed, committing to local store:', err);
    }
    const item: CategoryItem = {
      id: `cat-${Date.now()}`,
      name,
      createdOn: new Date().toISOString().split('T')[0],
      isActive: true,
    };
    localCategoryStore.unshift(item);
    return item;
  }

  public static async updateCategory(id: string, name: string): Promise<void> {
    try {
      await Cr240_assetcategoriesService.update(id, {
        cr240_assetcategoryname: name,
      });
    } catch (err) {
      console.warn('Dataverse updateCategory failed, updating local state:', err);
    }
    localCategoryStore = localCategoryStore.map((c) => (c.id === id ? { ...c, name } : c));
  }

  public static async deleteCategory(id: string): Promise<void> {
    try {
      await Cr240_assetcategoriesService.delete(id);
    } catch (err) {
      console.warn('Dataverse deleteCategory failed, updating local state:', err);
    }
    localCategoryStore = localCategoryStore.filter((c) => c.id !== id);
  }
}
