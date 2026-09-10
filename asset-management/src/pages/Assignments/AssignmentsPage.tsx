import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AssignmentService,
  type AssetAssignmentItem,
  type AssignmentStatus,
} from '../../services/assignment.service';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../../hooks/useToast';
import { AppPermissions } from '../../permissions/permissions';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { SearchInput } from '../../components/common/SearchInput';
import { Pagination } from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { AssignAssetModal } from './AssignAssetModal';
import { ReturnTransferModal } from './ReturnTransferModal';
import {
  ArrowLeftRight,
  Plus,
  RefreshCw,
  RotateCcw,
  UserCheck,
} from 'lucide-react';

export const AssignmentsPage: React.FC = () => {
  const { hasPermission } = usePermission();
  const { showToast } = useToast();

  const [assignments, setAssignments] = useState<AssetAssignmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Active');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [activeModalItem, setActiveModalItem] = useState<AssetAssignmentItem | null>(null);
  const [modalMode, setModalMode] = useState<'return' | 'transfer'>('return');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAssignments = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await AssignmentService.getAllAssignments();
      setAssignments(list);
    } catch (err) {
      console.error('Failed to load assignments:', err);
      showToast('Error loading assignments from Dataverse.', 'error', 'Error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // Filtering
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (search) {
        const q = search.toLowerCase();
        const matchAsset = a.assetName.toLowerCase().includes(q);
        const matchUser = a.assignedToName.toLowerCase().includes(q);
        const matchEmail = a.assignedToEmail?.toLowerCase().includes(q);
        if (!matchAsset && !matchUser && !matchEmail) return false;
      }
      if (statusFilter !== 'ALL' && a.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [assignments, search, statusFilter]);

  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAssignments.slice(start, start + pageSize);
  }, [filteredAssignments, currentPage, pageSize]);

  // Handle Assign
  const handleAssignSubmit = async (data: {
    assetId: string;
    assetName: string;
    assignedToName: string;
    assignedToEmail?: string;
    assignmentDate?: string;
    expectedReturnDate?: string;
    notes?: string;
  }) => {
    setIsSubmitting(true);
    try {
      await AssignmentService.assignAsset(data);
      showToast(`Asset assigned to ${data.assignedToName}.`, 'success', 'Assigned');
      setIsAssignOpen(false);
      await loadAssignments();
    } catch (err) {
      console.error('Assign error:', err);
      showToast('Failed to record assignment in Dataverse.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Return
  const handleReturnSubmit = async (assignmentId: string, assetId: string) => {
    setIsSubmitting(true);
    try {
      await AssignmentService.returnAsset(assignmentId, assetId);
      showToast('Hardware successfully checked in. Asset is now Available.', 'success', 'Returned');
      setActiveModalItem(null);
      await loadAssignments();
    } catch (err) {
      console.error('Return error:', err);
      showToast('Failed to process return in Dataverse.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Transfer
  const handleTransferSubmit = async (
    assignmentId: string,
    newAssigneeName: string,
    newAssigneeEmail?: string,
    assetId?: string
  ) => {
    setIsSubmitting(true);
    try {
      await AssignmentService.transferAsset(assignmentId, newAssigneeName, newAssigneeEmail, assetId);
      showToast(`Custody transferred to ${newAssigneeName}.`, 'success', 'Transferred');
      setActiveModalItem(null);
      await loadAssignments();
    } catch (err) {
      console.error('Transfer error:', err);
      showToast('Failed to process transfer in Dataverse.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: AssignmentStatus) => {
    switch (status) {
      case 'Active':
        return <Badge variant="blue">In Custody</Badge>;
      case 'Returned':
        return <Badge variant="success">Returned</Badge>;
      case 'Transferred':
        return <Badge variant="purple">Transferred</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Fixed Page Header & Context (Does NOT scroll) */}
      <div className="shrink-0 space-y-2.5 mb-3">
        {/* Title, Badge & Primary Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Asset Custody & Assignments
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                {filteredAssignments.length} Records
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitor physical device custody records, process returns, check-ins, and custody handovers.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              onClick={loadAssignments}
              disabled={isLoading}
            >
              Refresh
            </Button>

            {hasPermission(AppPermissions.ASSIGN_ASSET) && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsAssignOpen(true)}
              >
                Assign Asset
              </Button>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-slate-200/90 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex-1 min-w-0">
              <SearchInput
                value={search}
                onChange={(val) => {
                  setSearch(val);
                  setCurrentPage(1);
                }}
                placeholder="Search assignments by asset name, asset ID, or custodian employee..."
              />
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Custody Records</option>
                <option value="Active">Active Custody</option>
                <option value="Returned">Returned</option>
                <option value="Transferred">Transferred</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Data Area (ONLY this section vertically scrolls) */}
      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-4 flex-1 overflow-auto">
            <TableSkeleton rows={5} cols={6} />
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
            <EmptyState
              icon={<ArrowLeftRight className="w-8 h-8" />}
              title="No assignments found"
              description="There are currently no active or historical custody records matching your criteria."
              actionText={
                hasPermission(AppPermissions.ASSIGN_ASSET) ? 'Create Assignment' : undefined
              }
              onAction={() => setIsAssignOpen(true)}
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-auto relative">
            <table className="w-full text-left text-xs border-collapse min-w-[760px]">
              {/* Sticky Table Header */}
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px] shadow-2xs">
                <tr>
                  <th className="py-2.5 px-4 font-bold">Hardware Asset</th>
                  <th className="py-2.5 px-4 font-bold">Custodian Employee</th>
                  <th className="py-2.5 px-4 font-bold">Assignment Date</th>
                  <th className="py-2.5 px-4 font-bold">Expected Return</th>
                  <th className="py-2.5 px-4 font-bold">Status</th>
                  <th className="py-2.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedAssignments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900">{item.assetName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Asset ID: {item.assetId}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">
                      <div className="font-semibold text-slate-900">{item.assignedToName}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                        {item.assignedToEmail}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                      {item.assignmentDate}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                      {item.expectedReturnDate || 'Indefinite'}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">{getStatusBadge(item.status)}</td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      {item.status === 'Active' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {hasPermission(AppPermissions.TRANSFER_ASSET) && (
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                              onClick={() => {
                                setActiveModalItem(item);
                                setModalMode('transfer');
                              }}
                              className="text-xs py-1"
                            >
                              Transfer
                            </Button>
                          )}

                          {hasPermission(AppPermissions.RETURN_ASSET) && (
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-blue-600" />}
                              onClick={() => {
                                setActiveModalItem(item);
                                setModalMode('return');
                              }}
                              className="text-xs py-1"
                            >
                              Return
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          {item.returnedDate ? `Returned ${item.returnedDate}` : 'Archived'}
                        </span>
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
            totalItems={filteredAssignments.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Assign Modal */}
      <AssignAssetModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onSubmit={handleAssignSubmit}
        isLoading={isSubmitting}
      />

      {/* Return or Transfer Modal */}
      <ReturnTransferModal
        assignment={activeModalItem}
        mode={modalMode}
        isOpen={!!activeModalItem}
        onClose={() => setActiveModalItem(null)}
        onReturn={handleReturnSubmit}
        onTransfer={handleTransferSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
};
