import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CategoryService, type CategoryItem } from '../../services/category.service';
import { LocationService, type LocationItem } from '../../services/location.service';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../../hooks/useToast';
import { AppPermissions } from '../../permissions/permissions';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { SearchInput } from '../../components/common/SearchInput';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { CategoryModal } from './CategoryModal';
import { LocationModal } from './LocationModal';
import {
  Tags,
  MapPin,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
} from 'lucide-react';

interface AdminPageProps {
  initialTab?: 'categories' | 'locations';
}

export const AdminPage: React.FC<AdminPageProps> = ({ initialTab = 'categories' }) => {
  const { hasPermission } = usePermission();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'categories' | 'locations'>(initialTab);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationItem | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<LocationItem | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catList, locList] = await Promise.all([
        CategoryService.getAllCategories(),
        LocationService.getAllLocations(),
      ]);
      setCategories(catList);
      setLocations(locList);
    } catch (err) {
      console.error('Failed to load admin taxonomies:', err);
      showToast('Error loading configuration tables from Dataverse.', 'error', 'Error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered lists
  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [categories, search]);

  const filteredLocations = useMemo(() => {
    if (!search) return locations;
    return locations.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()));
  }, [locations, search]);

  // Category Actions
  const handleCategorySubmit = async (name: string) => {
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await CategoryService.updateCategory(editingCategory.id, name);
        showToast(`Category updated to "${name}".`, 'success', 'Updated');
      } else {
        await CategoryService.createCategory(name);
        showToast(`Category "${name}" created in Dataverse.`, 'success', 'Created');
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      await loadData();
    } catch (err) {
      console.error('Category error:', err);
      showToast('Dataverse error saving category.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryDelete = async () => {
    if (!deletingCategory) return;
    setIsSubmitting(true);
    try {
      await CategoryService.deleteCategory(deletingCategory.id);
      showToast(`Category "${deletingCategory.name}" removed.`, 'info', 'Deleted');
      setDeletingCategory(null);
      await loadData();
    } catch (err) {
      console.error('Delete category error:', err);
      showToast('Dataverse error deleting category.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Location Actions
  const handleLocationSubmit = async (name: string) => {
    setIsSubmitting(true);
    try {
      if (editingLocation) {
        await LocationService.updateLocation(editingLocation.id, name);
        showToast(`Location updated to "${name}".`, 'success', 'Updated');
      } else {
        await LocationService.createLocation(name);
        showToast(`Location "${name}" added to Dataverse.`, 'success', 'Created');
      }
      setIsLocationModalOpen(false);
      setEditingLocation(null);
      await loadData();
    } catch (err) {
      console.error('Location error:', err);
      showToast('Dataverse error saving location.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationDelete = async () => {
    if (!deletingLocation) return;
    setIsSubmitting(true);
    try {
      await LocationService.deleteLocation(deletingLocation.id);
      showToast(`Location "${deletingLocation.name}" removed.`, 'info', 'Deleted');
      setDeletingLocation(null);
      await loadData();
    } catch (err) {
      console.error('Delete location error:', err);
      showToast('Dataverse error deleting location.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canManageCategories = hasPermission(AppPermissions.MANAGE_CATEGORIES);
  const canManageLocations = hasPermission(AppPermissions.MANAGE_LOCATIONS);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Fixed Page Header & Context (Does NOT scroll) */}
      <div className="shrink-0 space-y-2.5 mb-3">
        {/* Title, Subtitle & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                System Administration
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                Taxonomies & Master Data
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure enterprise taxonomies: asset categories and facility physical locations.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              onClick={loadData}
              disabled={isLoading}
            >
              Refresh
            </Button>

            {activeTab === 'categories' && canManageCategories && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setEditingCategory(null);
                  setIsCategoryModalOpen(true);
                }}
              >
                Add Category
              </Button>
            )}

            {activeTab === 'locations' && canManageLocations && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setEditingLocation(null);
                  setIsLocationModalOpen(true);
                }}
              >
                Add Location
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          {canManageCategories && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('categories');
                setSearch('');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'categories'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Tags className="w-3.5 h-3.5" />
              <span>Asset Categories ({categories.length})</span>
            </button>
          )}

          {canManageLocations && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('locations');
                setSearch('');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'locations'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Facility Locations ({locations.length})</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-slate-200/90 shadow-2xs">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={
              activeTab === 'categories'
                ? 'Search categories by name or ID...'
                : 'Search facility locations by name or site code...'
            }
          />
        </div>
      </div>

      {/* Categories Scrollable Table Area */}
      {activeTab === 'categories' && (
        <div className="flex-1 min-h-0 flex flex-col bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="p-4 flex-1 overflow-auto">
              <TableSkeleton rows={4} cols={4} />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
              <EmptyState
                icon={<Tags className="w-8 h-8" />}
                title="No categories found"
                description="No asset categories match your search criteria."
                actionText={canManageCategories ? 'Create First Category' : undefined}
                onAction={() => {
                  setEditingCategory(null);
                  setIsCategoryModalOpen(true);
                }}
              />
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto relative">
              <table className="w-full text-left text-xs border-collapse min-w-[680px]">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px] shadow-2xs">
                  <tr>
                    <th className="py-2.5 px-4 font-bold">Category Name</th>
                    <th className="py-2.5 px-4 font-bold">Identifier</th>
                    <th className="py-2.5 px-4 font-bold">Created Date</th>
                    <th className="py-2.5 px-4 font-bold">Status</th>
                    <th className="py-2.5 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCategories.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{c.name}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-400 text-[11px]">{c.id}</td>
                      <td className="py-2.5 px-4 text-slate-600">{c.createdOn || '—'}</td>
                      <td className="py-2.5 px-4">
                        <Badge variant={c.isActive ? 'success' : 'neutral'}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {canManageCategories && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategory(c);
                                setIsCategoryModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-blue-500"
                              title="Edit Category"
                              aria-label="Edit Category"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingCategory(c)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-blue-500"
                              title="Delete Category"
                              aria-label="Delete Category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Stable Summary Footer */}
          <div className="shrink-0 py-2 px-4 bg-slate-50/80 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center select-none">
            <span>
              Categories: <strong className="text-slate-700">{filteredCategories.length}</strong> configured
            </span>
          </div>
        </div>
      )}

      {/* Locations Scrollable Table Area */}
      {activeTab === 'locations' && (
        <div className="flex-1 min-h-0 flex flex-col bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="p-4 flex-1 overflow-auto">
              <TableSkeleton rows={4} cols={4} />
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
              <EmptyState
                icon={<MapPin className="w-8 h-8" />}
                title="No locations found"
                description="No facility locations match your search criteria."
                actionText={canManageLocations ? 'Create First Location' : undefined}
                onAction={() => {
                  setEditingLocation(null);
                  setIsLocationModalOpen(true);
                }}
              />
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto relative">
              <table className="w-full text-left text-xs border-collapse min-w-[680px]">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px] shadow-2xs">
                  <tr>
                    <th className="py-2.5 px-4 font-bold">Facility / Site Name</th>
                    <th className="py-2.5 px-4 font-bold">Identifier</th>
                    <th className="py-2.5 px-4 font-bold">Created Date</th>
                    <th className="py-2.5 px-4 font-bold">Status</th>
                    <th className="py-2.5 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLocations.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{l.name}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-400 text-[11px]">{l.id}</td>
                      <td className="py-2.5 px-4 text-slate-600">{l.createdOn || '—'}</td>
                      <td className="py-2.5 px-4">
                        <Badge variant={l.isActive ? 'success' : 'neutral'}>
                          {l.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {canManageLocations && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLocation(l);
                                setIsLocationModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-blue-500"
                              title="Edit Location"
                              aria-label="Edit Location"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingLocation(l)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-blue-500"
                              title="Delete Location"
                              aria-label="Delete Location"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Stable Summary Footer */}
          <div className="shrink-0 py-2 px-4 bg-slate-50/80 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center select-none">
            <span>
              Locations: <strong className="text-slate-700">{filteredLocations.length}</strong> configured
            </span>
          </div>
        </div>
      )}

      {/* Category Modals */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleCategorySubmit}
        initialData={editingCategory}
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleCategoryDelete}
        title="Delete Asset Category"
        message={`Are you sure you want to delete category "${deletingCategory?.name}"? Assets assigned to this category may lose their categorization.`}
        confirmText="Delete Category"
        variant="danger"
        isLoading={isSubmitting}
      />

      {/* Location Modals */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => {
          setIsLocationModalOpen(false);
          setEditingLocation(null);
        }}
        onSubmit={handleLocationSubmit}
        initialData={editingLocation}
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={!!deletingLocation}
        onClose={() => setDeletingLocation(null)}
        onConfirm={handleLocationDelete}
        title="Delete Facility Location"
        message={`Are you sure you want to delete location "${deletingLocation?.name}"? Assets currently located here may need to be updated.`}
        confirmText="Delete Location"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};
