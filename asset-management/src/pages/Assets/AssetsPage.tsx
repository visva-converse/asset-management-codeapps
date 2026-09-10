import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AssetService, type AssetItem, type AssetStatus } from '../../services/asset.service';
import { CategoryService, type CategoryItem } from '../../services/category.service';
import { LocationService, type LocationItem } from '../../services/location.service';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../../hooks/useToast';
import { AppPermissions } from '../../permissions/permissions';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { SearchInput } from '../../components/common/SearchInput';
import { Pagination } from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { AssetDetailModal } from './AssetDetailModal';
import { AssetFormModal } from './AssetFormModal';
import {
  Laptop,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
} from 'lucide-react';

export const AssetsPage: React.FC = () => {
  const { hasPermission } = usePermission();
  const { showToast } = useToast();

  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetItem | null>(null);
  const [isDeletingAsset, setIsDeletingAsset] = useState<AssetItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [assetList, catList, locList] = await Promise.all([
        AssetService.getAllAssets(),
        CategoryService.getAllCategories(),
        LocationService.getAllLocations(),
      ]);
      setAssets(assetList);
      setCategories(catList);
      setLocations(locList);
    } catch (err) {
      console.error('Assets load error:', err);
      showToast('Failed to load asset inventory from Dataverse.', 'error', 'Error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtering
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (search) {
        const q = search.toLowerCase();
        const matchesName = asset.name.toLowerCase().includes(q);
        const matchesCat = asset.categoryName?.toLowerCase().includes(q);
        const matchesLoc = asset.locationName?.toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesLoc) return false;
      }
      if (categoryFilter !== 'ALL' && asset.categoryId !== categoryFilter) {
        return false;
      }
      if (locationFilter !== 'ALL' && asset.locationId !== locationFilter) {
        return false;
      }
      if (statusFilter !== 'ALL' && asset.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [assets, search, categoryFilter, locationFilter, statusFilter]);

  // Paginated records
  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAssets.slice(start, start + pageSize);
  }, [filteredAssets, currentPage, pageSize]);

  // Create or Update
  const handleFormSubmit = async (formData: {
    name: string;
    categoryId?: string;
    categoryName?: string;
    locationId?: string;
    locationName?: string;
    purchaseDate?: string;
    value?: number;
    status?: AssetStatus;
  }) => {
    setIsSubmitting(true);
    try {
      if (editingAsset) {
        await AssetService.updateAsset(editingAsset.id, formData);
        showToast(`Asset "${formData.name}" updated successfully.`, 'success', 'Updated');
      } else {
        await AssetService.createAsset(formData);
        showToast(`Asset "${formData.name}" registered in Dataverse.`, 'success', 'Registered');
      }
      setIsFormOpen(false);
      setEditingAsset(null);
      await loadData();
    } catch (err) {
      console.error('Save asset failed:', err);
      showToast('Operation failed. Please verify Dataverse permissions.', 'error', 'Authorization Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete
  const handleDeleteConfirm = async () => {
    if (!isDeletingAsset) return;
    setIsSubmitting(true);
    try {
      await AssetService.deleteAsset(isDeletingAsset.id);
      showToast(`Asset "${isDeletingAsset.name}" removed.`, 'info', 'Deleted');
      setIsDeletingAsset(null);
      await loadData();
    } catch (err) {
      console.error('Delete asset error:', err);
      showToast('Dataverse access denied: Cannot delete asset.', 'error', 'Authorization Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available':
        return <Badge variant="success">Available</Badge>;
      case 'Assigned':
        return <Badge variant="blue">Assigned</Badge>;
      case 'Maintenance':
        return <Badge variant="purple">Maintenance</Badge>;
      case 'Retired':
        return <Badge variant="danger">Retired</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Enterprise Assets</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage corporate hardware inventory, assignments, and specifications
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

          {hasPermission(AppPermissions.CREATE_ASSET) && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingAsset(null);
                setIsFormOpen(true);
              }}
            >
              Add Asset
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setCurrentPage(1);
              }}
              placeholder="Search by asset name, model, category, or location..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filters:</span>
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Location Filter */}
            <select
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Locations</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Assigned">Assigned</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Retired">Retired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table & Content */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : filteredAssets.length === 0 ? (
        <EmptyState
          icon={<Laptop className="w-8 h-8" />}
          title="No assets found"
          description="No hardware records match your current search and filter parameters."
          actionText={
            hasPermission(AppPermissions.CREATE_ASSET) ? 'Register First Asset' : undefined
          }
          onAction={
            hasPermission(AppPermissions.CREATE_ASSET)
              ? () => {
                  setEditingAsset(null);
                  setIsFormOpen(true);
                }
              : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Asset Name & Model</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Acquisition Date</th>
                  <th className="py-3 px-4">Value</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900">{asset.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">ID: {asset.id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {asset.categoryName || 'General'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {asset.locationName || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {asset.purchaseDate || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {asset.value ? `$${asset.value.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(asset.status)}</td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedAsset(asset);
                            setIsDetailOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {hasPermission(AppPermissions.UPDATE_ASSET) && (
                          <button
                            onClick={() => {
                              setEditingAsset(asset);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                            title="Edit Asset"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {hasPermission(AppPermissions.DELETE_ASSET) && (
                          <button
                            onClick={() => setIsDeletingAsset(asset)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredAssets.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Asset Details Modal */}
      <AssetDetailModal
        asset={selectedAsset}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedAsset(null);
        }}
        onEdit={(asset) => {
          setEditingAsset(asset);
          setIsFormOpen(true);
        }}
        canEdit={hasPermission(AppPermissions.UPDATE_ASSET)}
      />

      {/* Asset Form Modal */}
      <AssetFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingAsset(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingAsset}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!isDeletingAsset}
        onClose={() => setIsDeletingAsset(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Asset Record"
        message={`Are you sure you want to delete "${isDeletingAsset?.name}"? This action cannot be undone and will be executed against Microsoft Dataverse.`}
        confirmText="Delete Asset"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};
