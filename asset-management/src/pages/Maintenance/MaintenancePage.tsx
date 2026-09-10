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
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Fixed Page Header, KPIs & Context (Does NOT scroll) */}
      <div className="shrink-0 space-y-2.5 mb-3">
        {/* Title, Badge & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Maintenance & Service Work Orders
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                {filteredRecords.length} Records
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Track preventive servicing, hardware repairs, calibration, and vendor maintenance costs.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              onClick={loadMaintenance}
              disabled={isLoading}
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

        {/* Metric Summary KPI Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-slate-200/90 shadow-2xs flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-medium truncate">Total Work Orders</div>
              <div className="text-base font-bold text-slate-900 leading-tight">{records.length} Records</div>
            </div>
          </div>

          <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-slate-200/90 shadow-2xs flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-medium truncate">Active / In Progress</div>
              <div className="text-base font-bold text-slate-900 leading-tight">
                {records.filter((r) => r.status === 'Scheduled' || r.status === 'In Progress').length} Open
              </div>
            </div>
          </div>

          <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-slate-200/90 shadow-2xs flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-medium truncate">Cumulative Service Cost</div>
              <div className="text-base font-bold text-slate-900 leading-tight">${totalCost.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          <div className="flex-1 min-w-0">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setCurrentPage(1);
              }}
              placeholder="Search by asset, operation, title, or technician..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end md:self-auto shrink-0">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scrollable Data Area (ONLY this section vertically scrolls) */}
      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-4 flex-1 overflow-auto">
            <TableSkeleton rows={5} cols={6} />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
            <EmptyState
              icon={<Wrench className="w-8 h-8" />}
              title="No maintenance records found"
              description="No work orders or maintenance activities match the current filters."
              actionText={
                hasPermission(AppPermissions.MANAGE_MAINTENANCE) ? 'Schedule Service' : undefined
              }
              onAction={() => setIsCreateOpen(true)}
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-auto relative">
            <table className="w-full text-left text-xs border-collapse min-w-[760px]">
              {/* Sticky Table Header */}
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px] shadow-2xs">
                <tr>
                  <th className="py-2.5 px-4 font-bold">Work Order & Operation</th>
                  <th className="py-2.5 px-4 font-bold">Hardware Asset</th>
                  <th className="py-2.5 px-4 font-bold">Type</th>
                  <th className="py-2.5 px-4 font-bold">Service Date</th>
                  <th className="py-2.5 px-4 font-bold">Cost</th>
                  <th className="py-2.5 px-4 font-bold">Status</th>
                  <th className="py-2.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900">{item.title}</div>
                      <div className="text-[11px] text-slate-500">
                        Tech: {item.technician || 'Internal Support'}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">
                      <div>{item.assetName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">ID: {item.assetId}</div>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">{getTypeBadge(item.type)}</td>
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">{item.maintenanceDate}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      ${item.cost.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">{getStatusBadge(item.status)}</td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      {item.status !== 'Completed' &&
                        hasPermission(AppPermissions.MANAGE_MAINTENANCE) && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            onClick={() => setCompletingItem(item)}
                            className="text-xs py-1"
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
        )}

        {/* Stable Pagination Footer */}
        <div className="shrink-0 border-t border-slate-200 bg-white">
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
      </div>

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
