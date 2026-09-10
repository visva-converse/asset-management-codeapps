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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Manager Approvals</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              {pendingRequests.length} Pending
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Review and adjudicate corporate equipment requisitions awaiting manager authorization
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={loadPending}
        >
          Refresh Queue
        </Button>
      </div>

      {/* Governance Banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block text-sm">Automated Approval Compliance</span>
          <p className="text-blue-700/90 mt-0.5 leading-relaxed">
            Approving a request updates Microsoft Dataverse status code to <code className="bg-blue-100 px-1 py-0.5 rounded">Approved (805530001)</code> and notifies the Asset Administrator for equipment dispatch. Rejections require an audited rationale.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search pending approvals by request #, employee, or item..."
        />
      </div>

      {/* Content Queue */}
      {isLoading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-8 h-8 text-emerald-600" />}
          title="Approvals queue is clear"
          description="All submitted hardware requests have been reviewed and adjudicated. New employee submissions will appear here automatically."
        />
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
            >
              {/* Left Details */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {req.requestNumber}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {req.requestName}
                  </h3>
                  {getPriorityBadge(req.priority)}
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-500">
                  <div>
                    Employee: <strong className="text-slate-800">{req.requestedBy}</strong> (
                    {req.requestedByEmail})
                  </div>
                  <div>
                    Category: <strong className="text-slate-700">{req.categoryName || 'General'}</strong>
                  </div>
                  <div>
                    Requested Date: <span className="text-slate-700">{req.requestDate}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/70">
                  <span className="font-semibold text-slate-700 block mb-0.5">
                    Business Justification:
                  </span>
                  <p className="line-clamp-2">{req.businessJustification || 'No justification provided.'}</p>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                {hasPermission(AppPermissions.REJECT_REQUEST) && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<X className="w-4 h-4 text-rose-600" />}
                    onClick={() => setRejectingRequest(req)}
                    className="hover:border-rose-300 hover:bg-rose-50/50"
                  >
                    Reject
                  </Button>
                )}

                {hasPermission(AppPermissions.APPROVE_REQUEST) && (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Check className="w-4 h-4" />}
                    onClick={() => setApprovingRequest(req)}
                    className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                  >
                    Approve
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!approvingRequest}
        onClose={() => setApprovingRequest(null)}
        onConfirm={handleApproveConfirm}
        title="Approve Hardware Request"
        message={`Authorize request ${approvingRequest?.requestNumber} for ${approvingRequest?.requestedBy}? This updates Dataverse and assigns fulfillment to the Asset Administrator.`}
        confirmText="Confirm Approval"
        variant="primary"
        isLoading={isSubmitting}
      />

      {/* Rejection Dialog */}
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
