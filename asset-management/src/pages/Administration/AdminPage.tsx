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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            System Administration
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure enterprise taxonomies: asset categories and facility physical locations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={loadData}
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
            onClick={() => {
              setActiveTab('categories');
              setSearch('');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'categories'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Tags className="w-4 h-4" />
            <span>Asset Categories ({categories.length})</span>
          </button>
        )}

        {canManageLocations && (
          <button
            onClick={() => {
              setActiveTab('locations');
              setSearch('');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'locations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Facility Locations ({locations.length})</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={
            activeTab === 'categories' ? 'Search categories...' : 'Search facility locations...'
          }
        />
      </div>

      {/* Categories Content */}
      {activeTab === 'categories' && (
        <>
          {isLoading ? (
            <TableSkeleton rows={4} cols={4} />
          ) : filteredCategories.length === 0 ? (
            <EmptyState
              icon={<Tags className="w-8 h-8" />}
              title="No categories found"
              description="No asset categories match your search."
              actionText={canManageCategories ? 'Create First Category' : undefined}
              onAction={() => {
                setEditingCategory(null);
                setIsCategoryModalOpen(true);
              }}
            />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-5">Category Name</th>
                    <th className="py-3 px-4">Identifier</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCategories.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-slate-900">{c.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{c.id}</td>
                      <td className="py-3.5 px-4 text-slate-600">{c.createdOn || '—'}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant={c.isActive ? 'success' : 'neutral'}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {canManageCategories && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingCategory(c);
                                setIsCategoryModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Edit Category"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingCategory(c)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Delete Category"
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
        </>
      )}

      {/* Locations Content */}
      {activeTab === 'locations' && (
        <>
          {isLoading ? (
            <TableSkeleton rows={4} cols={4} />
          ) : filteredLocations.length === 0 ? (
            <EmptyState
              icon={<MapPin className="w-8 h-8" />}
              title="No locations found"
              description="No facility locations match your search."
              actionText={canManageLocations ? 'Create First Location' : undefined}
              onAction={() => {
                setEditingLocation(null);
                setIsLocationModalOpen(true);
              }}
            />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-5">Facility / Site Name</th>
                    <th className="py-3 px-4">Identifier</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLocations.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-slate-900">{l.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{l.id}</td>
                      <td className="py-3.5 px-4 text-slate-600">{l.createdOn || '—'}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant={l.isActive ? 'success' : 'neutral'}>
                          {l.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {canManageLocations && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingLocation(l);
                                setIsLocationModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Edit Location"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingLocation(l)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Delete Location"
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
        </>
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
