import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RequestService, type AssetRequestItem } from '../../services/request.service';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../../hooks/useToast';
import { AppPermissions } from '../../permissions/permissions';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { SearchInput } from '../../components/common/SearchInput';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { RejectionDialog } from './RejectionDialog';
import {
  Check,
  X,
  RefreshCw,
  Clock,
  ShieldCheck,
} from 'lucide-react';


export const ApprovalsPage: React.FC = () => {
  const { user } = useCurrentUser();
  const { hasPermission } = usePermission();
  const { showToast } = useToast();

  const [pendingRequests, setPendingRequests] = useState<AssetRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Workflow Dialog States
  const [approvingRequest, setApprovingRequest] = useState<AssetRequestItem | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<AssetRequestItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPending = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await RequestService.getPendingApprovals();
      setPendingRequests(list);
    } catch (err) {
      console.error('Failed to load pending approvals:', err);
      showToast('Error loading approvals from Dataverse.', 'error', 'Error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const filteredRequests = useMemo(() => {
    if (!search) return pendingRequests;
    const q = search.toLowerCase();
    return pendingRequests.filter(
      (r) =>
        r.requestNumber.toLowerCase().includes(q) ||
        r.requestName.toLowerCase().includes(q) ||
        r.requestedBy.toLowerCase().includes(q) ||
        r.categoryName?.toLowerCase().includes(q)
    );
  }, [pendingRequests, search]);

  // Handle Approve
  const handleApproveConfirm = async () => {
    if (!approvingRequest) return;
    setIsSubmitting(true);
    try {
      await RequestService.executeApprovalWorkflow(
        approvingRequest.id,
        user?.fullName || 'Manager'
      );
      showToast(
        `Request ${approvingRequest.requestNumber} approved and routed to Asset Admin for fulfillment.`,
        'success',
        'Approved'
      );
      setApprovingRequest(null);
      await loadPending();
    } catch (err) {
      console.error('Approval workflow error:', err);
      showToast('Dataverse authorization error during approval.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reject
  const handleRejectConfirm = async (reason: string) => {
    if (!rejectingRequest) return;
    setIsSubmitting(true);
    try {
      await RequestService.executeRejectionWorkflow(
        rejectingRequest.id,
        user?.fullName || 'Manager',
        reason
      );
      showToast(
        `Request ${rejectingRequest.requestNumber} has been rejected.`,
        'info',
        'Rejected'
      );
      setRejectingRequest(null);
      await loadPending();
    } catch (err) {
      console.error('Rejection workflow error:', err);
      showToast('Dataverse authorization error during rejection.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (priority?: string) => {
    const p = priority || 'Medium';
    const variantMap: Record<string, BadgeVariant> = {
      Critical: 'danger',
      High: 'warning',
      Medium: 'info',
      Low: 'neutral',
    };
    return <Badge variant={variantMap[p] || 'neutral'}>{p}</Badge>;
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Fixed Page Header & Context (Does NOT scroll) */}
      <div className="shrink-0 space-y-2.5 mb-3">
        {/* Title, Badge & Primary Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Manager Approvals Queue
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200/70">
                {pendingRequests.length} Pending Requests
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and adjudicate corporate equipment requisitions awaiting manager authorization and compliance sign-off.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={loadPending}
            disabled={isLoading}
          >
            Refresh Queue
          </Button>
        </div>

        {/* Approval Compliance & Audit Trail Banner */}
        <div className="flex items-start gap-2.5 p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg text-xs text-blue-900">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-blue-950">Approval Compliance & Audit Trail: </span>
            Approving updates the Dataverse lifecycle status to <code className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-[11px] font-mono">Approved (805530001)</code> and routes fulfillment to the Asset Administrator. Rejections require an audited rationale.
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex-1 min-w-0">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search approvals queue by request #, requested by, or asset item..."
            />
          </div>
          {search && (
            <div className="text-xs text-slate-500 shrink-0 self-center">
              Found {filteredRequests.length} of {pendingRequests.length}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Data Area (ONLY this section vertically scrolls) */}
      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-4 flex-1 overflow-auto">
            <TableSkeleton rows={5} cols={6} />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
            <EmptyState
              icon={<Clock className="w-8 h-8 text-emerald-600" />}
              title="Approvals Queue is Clear"
              description={
                search
                  ? 'No pending requisitions matched your search query.'
                  : 'All corporate equipment requests have been adjudicated. New employee submissions will appear here automatically.'
              }
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-auto relative">
            <table className="w-full text-left text-xs border-collapse min-w-[840px]">
              {/* Sticky Table Header */}
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px] shadow-2xs">
                <tr>
                  <th className="py-2.5 px-4 font-bold">Request ID</th>
                  <th className="py-2.5 px-4 font-bold">Asset / Requisition Item</th>
                  <th className="py-2.5 px-4 font-bold">Requested By</th>
                  <th className="py-2.5 px-4 font-bold">Submitted On</th>
                  <th className="py-2.5 px-4 font-bold">Priority</th>
                  <th className="py-2.5 px-4 font-bold">Approval Status</th>
                  <th className="py-2.5 px-4 font-bold text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Request ID */}
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 align-top">
                      <span className="bg-blue-50/90 px-2 py-1 rounded border border-blue-200/80 inline-block text-[11px]">
                        {req.requestNumber}
                      </span>
                    </td>

                    {/* Asset / Item & Justification */}
                    <td className="py-3 px-4 align-top max-w-[280px]">
                      <div className="font-bold text-slate-900 text-xs">
                        {req.requestName}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                          {req.categoryName || 'General Equipment'}
                        </span>
                      </div>
                      {req.businessJustification && (
                        <p
                          className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed italic bg-slate-50 p-1.5 rounded border border-slate-200/60"
                          title={req.businessJustification}
                        >
                          "{req.businessJustification}"
                        </p>
                      )}
                    </td>

                    {/* Requester Details */}
                    <td className="py-3 px-4 align-top text-slate-700">
                      <div className="font-semibold text-slate-900">{req.requestedBy}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                        {req.requestedByEmail}
                      </div>
                    </td>

                    {/* Submitted Date */}
                    <td className="py-3 px-4 align-top text-slate-600 font-medium whitespace-nowrap">
                      {req.requestDate}
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4 align-top whitespace-nowrap">
                      {getPriorityBadge(req.priority)}
                    </td>

                    {/* Approval Status */}
                    <td className="py-3 px-4 align-top whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Pending Authorization
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {hasPermission(AppPermissions.REJECT_REQUEST) && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<X className="w-3.5 h-3.5 text-rose-600" />}
                            onClick={() => setRejectingRequest(req)}
                            className="hover:border-rose-300 hover:bg-rose-50/50 text-xs py-1"
                          >
                            Reject
                          </Button>
                        )}

                        {hasPermission(AppPermissions.APPROVE_REQUEST) && (
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Check className="w-3.5 h-3.5" />}
                            onClick={() => setApprovingRequest(req)}
                            className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 text-xs py-1"
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Stable Table Footer / Summary Bar */}
        <div className="shrink-0 py-2 px-4 bg-slate-50/80 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center select-none">
          <span>
            Queue: <strong className="text-slate-700">{filteredRequests.length}</strong> active item(s)
          </span>
          <span className="text-[11px] text-slate-400">
            Adjudication decisions recorded to audit trail
          </span>
        </div>
      </div>

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!approvingRequest}
        onClose={() => setApprovingRequest(null)}
        onConfirm={handleApproveConfirm}
        title="Authorize Corporate Hardware Requisition"
        message={`Confirm manager authorization for request ${approvingRequest?.requestNumber} submitted by ${approvingRequest?.requestedBy}? Upon approval, Dataverse will assign fulfillment to the Asset Administrator.`}
        confirmText="Authorize Request"
        variant="primary"
        isLoading={isSubmitting}
      />

      {/* Rejection Dialog with Audited Reason */}
      <RejectionDialog
        request={rejectingRequest}
        isOpen={!!rejectingRequest}
        onClose={() => setRejectingRequest(null)}
        onConfirm={handleRejectConfirm}
        isLoading={isSubmitting}
      />
    </div>
  );
};
