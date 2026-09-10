import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RequestService, type AssetRequestItem, type RequestStatus } from '../../services/request.service';
import { useCurrentUser } from '../../hooks/useCurrentUser';
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
import { Dialog } from '../../components/common/Dialog';
import { RequestCreateModal } from './RequestCreateModal';
import {
  ClipboardList,
  Plus,
  RefreshCw,
  Eye,
  XCircle,
  Calendar,
  User,
  Shield,
  Tag,
} from 'lucide-react';

export const RequestsPage: React.FC = () => {
  const { user, activeRole } = useCurrentUser();
  const { hasPermission } = usePermission();
  const { showToast } = useToast();

  const isEmployee = activeRole === 'Asset Management - Employee';

  const [requests, setRequests] = useState<AssetRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AssetRequestItem | null>(null);
  const [cancelingRequest, setCancelingRequest] = useState<AssetRequestItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isEmployee && user) {
        const list = await RequestService.getMyRequests(user.userPrincipalName, user.fullName);
        setRequests(list);
      } else {
        const list = await RequestService.getAllRequests();
        setRequests(list);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
      showToast('Error loading requests from Dataverse.', 'error', 'Error');
    } finally {
      setIsLoading(false);
    }
  }, [isEmployee, user, showToast]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Filtering
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        const matchesNum = r.requestNumber.toLowerCase().includes(q);
        const matchesName = r.requestName.toLowerCase().includes(q);
        const matchesReqBy = r.requestedBy.toLowerCase().includes(q);
        const matchesCat = r.categoryName?.toLowerCase().includes(q);
        if (!matchesNum && !matchesName && !matchesReqBy && !matchesCat) return false;
      }
      if (statusFilter !== 'ALL' && r.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [requests, search, statusFilter]);

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  // Handle Create Request
  const handleCreateRequest = async (formData: {
    requestName: string;
    categoryId?: string;
    categoryName?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
    businessJustification?: string;
  }) => {
    setIsSubmitting(true);
    try {
      await RequestService.createRequest({
        ...formData,
        requestedBy: user?.fullName || 'Visva V',
        requestedByEmail: user?.userPrincipalName || 'visva@company.com',
      });
      showToast('Hardware request submitted. Pending manager approval.', 'success', 'Submitted');
      setIsCreateOpen(false);
      await loadRequests();
    } catch (err) {
      console.error('Create request error:', err);
      showToast('Failed to submit request to Dataverse.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Cancel Request
  const handleCancelConfirm = async () => {
    if (!cancelingRequest) return;
    setIsSubmitting(true);
    try {
      await RequestService.cancelRequest(cancelingRequest.id);
      showToast(`Request ${cancelingRequest.requestNumber} cancelled.`, 'info', 'Cancelled');
      setCancelingRequest(null);
      await loadRequests();
    } catch (err) {
      console.error('Cancel request error:', err);
      showToast('Cannot cancel request in current Dataverse state.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'Approved':
        return <Badge variant="success">Approved</Badge>;
      case 'Pending':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'Rejected':
        return <Badge variant="danger">Rejected</Badge>;
      case 'Cancelled':
        return <Badge variant="neutral">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isEmployee ? 'My Hardware Requests' : 'All Asset Requests'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isEmployee
              ? 'Track your submitted equipment requisitions and approval status'
              : 'Review organization-wide hardware requisitions and approvals'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={loadRequests}
          >
            Refresh
          </Button>

          {hasPermission(AppPermissions.CREATE_REQUEST) && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              New Request
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val);
              setCurrentPage(1);
            }}
            placeholder="Search by request #, title, or requester..."
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
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-8 h-8" />}
          title="No requests found"
          description={
            isEmployee
              ? 'You have not submitted any hardware requests yet.'
              : 'No equipment requests match the current filters.'
          }
          actionText={
            hasPermission(AppPermissions.CREATE_REQUEST) ? 'Submit a Request' : undefined
          }
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Request #</th>
                  <th className="py-3 px-4">Item & Title</th>
                  <th className="py-3 px-4">Category</th>
                  {!isEmployee && <th className="py-3 px-4">Requester</th>}
                  <th className="py-3 px-4">Requested Date</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-semibold text-blue-700">
                      {req.requestNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {req.requestName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {req.categoryName || 'General'}
                    </td>
                    {!isEmployee && (
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-medium">{req.requestedBy}</div>
                        <div className="text-[11px] text-slate-400">{req.requestedByEmail}</div>
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-slate-600">{req.requestDate}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700">{req.priority}</span>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(req.status)}</td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="View Request Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Cancel request button when allowed (status is Pending) */}
                        {req.status === 'Pending' && (
                          <button
                            onClick={() => setCancelingRequest(req)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Cancel Request"
                          >
                            <XCircle className="w-4 h-4" />
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
            totalItems={filteredRequests.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Create Request Modal */}
      <RequestCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateRequest}
        isLoading={isSubmitting}
      />

      {/* Request Details Dialog */}
      {selectedRequest && (
        <Dialog
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title={`Request ${selectedRequest.requestNumber}`}
          description="Detailed requisition profile and approval lifecycle"
          maxWidth="md"
          footer={
            <Button variant="outline" size="sm" onClick={() => setSelectedRequest(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="font-semibold text-slate-900 text-sm">
                  {selectedRequest.requestName}
                </span>
                <div className="text-slate-500 mt-0.5">
                  Priority: <strong className="text-slate-800">{selectedRequest.priority}</strong>
                </div>
              </div>
              {getStatusBadge(selectedRequest.status)}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  <span>Requester</span>
                </div>
                <div className="font-semibold text-slate-800">{selectedRequest.requestedBy}</div>
                <div className="text-slate-400">{selectedRequest.requestedByEmail}</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>Request Date</span>
                </div>
                <div className="font-semibold text-slate-800">{selectedRequest.requestDate}</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg col-span-2">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
                  <Tag className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Category</span>
                </div>
                <div className="font-semibold text-slate-800">
                  {selectedRequest.categoryName || 'General Hardware'}
                </div>
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="font-semibold text-slate-700 block mb-1">Business Justification:</span>
              <p className="text-slate-600 leading-relaxed">
                {selectedRequest.businessJustification || 'No justification recorded.'}
              </p>
            </div>

            {selectedRequest.status === 'Approved' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                <div className="flex items-center gap-1.5 font-semibold mb-0.5">
                  <Shield className="w-4 h-4" />
                  <span>Approved by Manager</span>
                </div>
                <p>
                  Approved by {selectedRequest.approvedBy || 'Manager'} on{' '}
                  {selectedRequest.approvedDate || 'Record date'}. Routed to Asset Administrator for
                  fulfillment.
                </p>
              </div>
            )}

            {selectedRequest.status === 'Rejected' && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">
                <div className="font-semibold mb-1">Rejection Justification:</div>
                <p>{selectedRequest.rejectionReason || 'No rejection reason specified.'}</p>
              </div>
            )}
          </div>
        </Dialog>
      )}

      {/* Cancel Confirmation */}
      <ConfirmDialog
        isOpen={!!cancelingRequest}
        onClose={() => setCancelingRequest(null)}
        onConfirm={handleCancelConfirm}
        title="Cancel Hardware Request"
        message={`Are you sure you want to cancel request ${cancelingRequest?.requestNumber}? This will terminate the approval workflow.`}
        confirmText="Cancel Request"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};
