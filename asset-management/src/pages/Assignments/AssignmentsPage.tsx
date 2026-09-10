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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Asset Assignments</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor custody records, process check-ins, returns, and custody transfers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={loadAssignments}
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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val);
              setCurrentPage(1);
            }}
            placeholder="Search by asset name or employee..."
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Records</option>
            <option value="Active">Active Custody</option>
            <option value="Returned">Returned</option>
            <option value="Transferred">Transferred</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight className="w-8 h-8" />}
          title="No assignments found"
          description="There are currently no active or historical custody records matching your criteria."
          actionText={
            hasPermission(AppPermissions.ASSIGN_ASSET) ? 'Create Assignment' : undefined
          }
          onAction={() => setIsAssignOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Hardware Asset</th>
                  <th className="py-3 px-4">Custodian Employee</th>
                  <th className="py-3 px-4">Assignment Date</th>
                  <th className="py-3 px-4">Expected Return</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedAssignments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900">{item.assetName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Asset ID: {item.assetId}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-semibold">{item.assignedToName}</div>
                      <div className="text-[11px] text-slate-400">{item.assignedToEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{item.assignmentDate}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {item.expectedReturnDate || 'Indefinite'}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>
                    <td className="py-3.5 px-5 text-right">
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
      )}

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
