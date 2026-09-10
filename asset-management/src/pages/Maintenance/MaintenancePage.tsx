import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MaintenanceService,
  type MaintenanceRecord,
  type MaintenanceType,
  type MaintenanceStatus,
} from '../../services/maintenance.service';
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
import { MaintenanceModal } from './MaintenanceModal';
import {
  Wrench,
  Plus,
  RefreshCw,
  CheckCircle2,
  DollarSign,
  Activity,
  AlertCircle,
} from 'lucide-react';

export const MaintenancePage: React.FC = () => {
  const { hasPermission } = usePermission();
  const { showToast } = useToast();

  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [completingItem, setCompletingItem] = useState<MaintenanceRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMaintenance = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await MaintenanceService.getAllMaintenance();
      setRecords(list);
    } catch (err) {
      console.error('Failed to load maintenance records:', err);
      showToast('Error loading maintenance logs from Dataverse.', 'error', 'Error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadMaintenance();
  }, [loadMaintenance]);

  // Filtering
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        const mAsset = r.assetName.toLowerCase().includes(q);
        const mTitle = r.title.toLowerCase().includes(q);
        const mTech = r.technician?.toLowerCase().includes(q);
        if (!mAsset && !mTitle && !mTech) return false;
      }
      if (typeFilter !== 'ALL' && r.type !== typeFilter) {
        return false;
      }
      if (statusFilter !== 'ALL' && r.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [records, search, typeFilter, statusFilter]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Handle Schedule
  const handleScheduleSubmit = async (data: {
    assetId: string;
    assetName: string;
    title: string;
    type: MaintenanceType;
    maintenanceDate?: string;
    cost?: number;
    technician?: string;
    description?: string;
  }) => {
    setIsSubmitting(true);
    try {
      await MaintenanceService.scheduleMaintenance(data);
      showToast(`Maintenance scheduled for ${data.assetName}.`, 'success', 'Scheduled');
      setIsCreateOpen(false);
      await loadMaintenance();
    } catch (err) {
      console.error('Schedule error:', err);
      showToast('Dataverse error while scheduling service.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Mark Completed
  const handleCompleteConfirm = async () => {
    if (!completingItem) return;
    setIsSubmitting(true);
    try {
      await MaintenanceService.completeMaintenance(completingItem.id, completingItem.assetId);
      showToast(
        `Maintenance completed for ${completingItem.assetName}. Asset returned to Available.`,
        'success',
        'Completed'
      );
      setCompletingItem(null);
      await loadMaintenance();
    } catch (err) {
      console.error('Complete maintenance error:', err);
      showToast('Dataverse error updating maintenance status.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeBadge = (type: MaintenanceType) => {
    switch (type) {
      case 'Preventive':
        return <Badge variant="blue">Preventive</Badge>;
      case 'Corrective':
        return <Badge variant="warning">Corrective</Badge>;
      case 'Predictive':
        return <Badge variant="purple">Predictive</Badge>;
      default:
        return <Badge variant="neutral">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: MaintenanceStatus) => {
    switch (status) {
      case 'Completed':
        return <Badge variant="success">Completed</Badge>;
      case 'In Progress':
        return <Badge variant="warning">In Progress</Badge>;
      case 'Scheduled':
        return <Badge variant="info">Scheduled</Badge>;
      case 'Cancelled':
        return <Badge variant="neutral">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // Calculate totals
  const totalCost = useMemo(() => {
    return records.reduce((acc, curr) => acc + (curr.cost || 0), 0);
  }, [records]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Maintenance & Service Logs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track preventive servicing, repairs, calibration, and vendor maintenance costs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={loadMaintenance}
          >
            Refresh
          </Button>

          {hasPermission(AppPermissions.MANAGE_MAINTENANCE) && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              Schedule Service
            </Button>
          )}
        </div>
      </div>

      {/* Metric summary banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Work Orders</div>
            <div className="text-lg font-bold text-slate-900">{records.length} Records</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Active / In Progress</div>
            <div className="text-lg font-bold text-slate-900">
              {records.filter((r) => r.status === 'Scheduled' || r.status === 'In Progress').length} Open
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Cumulative Service Cost</div>
            <div className="text-lg font-bold text-slate-900">${totalCost.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-80">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val);
              setCurrentPage(1);
            }}
            placeholder="Search by asset, operation, or tech..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Maintenance Types</option>
            <option value="Preventive">Preventive</option>
            <option value="Corrective">Corrective</option>
            <option value="Predictive">Predictive</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Content Table */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          icon={<Wrench className="w-8 h-8" />}
          title="No maintenance records found"
          description="No work orders or maintenance activities match the current filters."
          actionText={
            hasPermission(AppPermissions.MANAGE_MAINTENANCE) ? 'Schedule Service' : undefined
          }
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Work Order & Operation</th>
                  <th className="py-3 px-4">Hardware Asset</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Service Date</th>
                  <th className="py-3 px-4">Cost</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900">{item.title}</div>
                      <div className="text-[11px] text-slate-500">
                        Tech: {item.technician || 'Internal Support'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div>{item.assetName}</div>
                      <div className="text-[11px] text-slate-400">ID: {item.assetId}</div>
                    </td>
                    <td className="py-3.5 px-4">{getTypeBadge(item.type)}</td>
                    <td className="py-3.5 px-4 text-slate-600">{item.maintenanceDate}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      ${item.cost.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>
                    <td className="py-3.5 px-5 text-right">
                      {item.status !== 'Completed' &&
                        hasPermission(AppPermissions.MANAGE_MAINTENANCE) && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            onClick={() => setCompletingItem(item)}
                          >
                            Mark Completed
                          </Button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredRecords.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Schedule Modal */}
      <MaintenanceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleScheduleSubmit}
        isLoading={isSubmitting}
      />

      {/* Complete Confirmation */}
      <ConfirmDialog
        isOpen={!!completingItem}
        onClose={() => setCompletingItem(null)}
        onConfirm={handleCompleteConfirm}
        title="Complete Maintenance Order"
        message={`Confirm completion of "${completingItem?.title}"? This updates Dataverse and restores the asset status to Available.`}
        confirmText="Confirm Complete"
        variant="primary"
        isLoading={isSubmitting}
      />
    </div>
  );
};
