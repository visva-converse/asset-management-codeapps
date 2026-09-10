import React, { useEffect, useState, useCallback } from 'react';
import { StatCard } from '../../components/common/StatCard';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { CardSkeleton, TableSkeleton } from '../../components/common/LoadingSkeleton';
import { AssetService } from '../../services/asset.service';
import { RequestService, type AssetRequestItem } from '../../services/request.service';
import { AssignmentService, type AssetAssignmentItem } from '../../services/assignment.service';
import { MaintenanceService } from '../../services/maintenance.service';
import { usePermission } from '../../hooks/usePermission';
import { AppPermissions } from '../../permissions/permissions';
import type { ActivePage } from '../../components/layout/Sidebar';
import {
  Laptop,
  CheckCircle,
  ArrowLeftRight,
  Clock,
  Wrench,
  Plus,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: ActivePage) => void;
  onRequestNew?: () => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { hasPermission, activeRole } = usePermission();

  const [isLoading, setIsLoading] = useState(true);
  const [totalAssets, setTotalAssets] = useState(0);
  const [availableAssets, setAvailableAssets] = useState(0);
  const [assignedAssets, setAssignedAssets] = useState(0);
  const [underMaintenance, setUnderMaintenance] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [recentRequests, setRecentRequests] = useState<AssetRequestItem[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<AssetAssignmentItem[]>([]);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [assets, requests, assignments, maintenance] = await Promise.all([
        AssetService.getAllAssets(),
        RequestService.getAllRequests(),
        AssignmentService.getAllAssignments(),
        MaintenanceService.getAllMaintenance(),
      ]);

      setTotalAssets(assets.length);
      setAvailableAssets(assets.filter((a) => a.status === 'Available').length);
      setAssignedAssets(assets.filter((a) => a.status === 'Assigned').length);
      setUnderMaintenance(
        assets.filter((a) => a.status === 'Maintenance').length ||
          maintenance.filter((m) => m.status === 'In Progress' || m.status === 'Scheduled').length
      );
      setPendingRequests(requests.filter((r) => r.status === 'Pending').length);

      setRecentRequests(requests.slice(0, 5));
      setRecentAssignments(assignments.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available':
      case 'Approved':
      case 'Active':
      case 'Completed':
        return <Badge variant="success">{status}</Badge>;
      case 'Assigned':
      case 'In Progress':
        return <Badge variant="blue">{status}</Badge>;
      case 'Pending':
      case 'Scheduled':
        return <Badge variant="warning">{status}</Badge>;
      case 'Maintenance':
        return <Badge variant="purple">{status}</Badge>;
      case 'Rejected':
      case 'Cancelled':
      case 'Retired':
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
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
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-blue-200">
            Enterprise Asset Management
          </span>
          <h2 className="text-2xl font-bold mt-1 tracking-tight">System Operations Center</h2>
          <p className="text-sm text-blue-100/90 mt-1 max-w-xl">
            Logged in as <span className="font-semibold">{activeRole}</span>. Centralized visibility
            over hardware inventory, employee requests, custody assignments, and maintenance lifecycles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {hasPermission(AppPermissions.CREATE_REQUEST) && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => onNavigate('requests')}
              className="bg-white text-blue-900 hover:bg-blue-50 border-none shadow-sm"
            >
              Request Hardware
            </Button>
          )}

          {hasPermission(AppPermissions.CREATE_ASSET) && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => onNavigate('assets')}
              className="text-white border-white/30 hover:bg-white/10"
            >
              New Asset
            </Button>
          )}

          {(hasPermission(AppPermissions.APPROVE_REQUEST) ||
            hasPermission(AppPermissions.REJECT_REQUEST)) && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ClipboardList className="w-4 h-4" />}
              onClick={() => onNavigate('approvals')}
              className="text-white border-white/30 hover:bg-white/10"
            >
              Review Approvals ({pendingRequests})
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Assets"
            value={totalAssets}
            subtitle="Cataloged in Dataverse"
            icon={<Laptop className="w-5 h-5" />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            onClick={() => onNavigate('assets')}
          />
          <StatCard
            title="Available"
            value={availableAssets}
            subtitle="Ready for deployment"
            icon={<CheckCircle className="w-5 h-5" />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            onClick={() => onNavigate('assets')}
          />
          <StatCard
            title="Assigned"
            value={assignedAssets}
            subtitle="In employee custody"
            icon={<ArrowLeftRight className="w-5 h-5" />}
            iconBg="bg-sky-50"
            iconColor="text-sky-600"
            onClick={() =>
              hasPermission(AppPermissions.ASSIGN_ASSET)
                ? onNavigate('assignments')
                : onNavigate('assets')
            }
          />
          <StatCard
            title="Pending Requests"
            value={pendingRequests}
            subtitle="Awaiting action"
            icon={<Clock className="w-5 h-5" />}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            onClick={() =>
              hasPermission(AppPermissions.APPROVE_REQUEST)
                ? onNavigate('approvals')
                : onNavigate('requests')
            }
          />
          <StatCard
            title="Maintenance"
            value={underMaintenance}
            subtitle="In repair or servicing"
            icon={<Wrench className="w-5 h-5" />}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            onClick={() =>
              hasPermission(AppPermissions.MANAGE_MAINTENANCE)
                ? onNavigate('maintenance')
                : onNavigate('assets')
            }
          />
        </div>
      )}

      {/* Two Column Section: Recent Requests & Recent Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Recent Requests</h3>
              <p className="text-xs text-slate-500">Hardware & peripheral submissions</p>
            </div>
            <Button
              variant="subtle"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => onNavigate('requests')}
            >
              View All
            </Button>
          </div>

          {isLoading ? (
            <TableSkeleton rows={4} cols={4} />
          ) : recentRequests.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">No requests submitted yet.</div>
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-y border-slate-100 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-5">Request</th>
                    <th className="py-2.5 px-4">Requested By</th>
                    <th className="py-2.5 px-4">Priority</th>
                    <th className="py-2.5 px-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-5">
                        <div className="font-semibold text-slate-900">{req.requestNumber}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {req.requestName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div>{req.requestedBy}</div>
                        <div className="text-[11px] text-slate-400">{req.requestDate}</div>
                      </td>
                      <td className="py-3 px-4">{getPriorityBadge(req.priority)}</td>
                      <td className="py-3 px-5 text-right">{getStatusBadge(req.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Custody Assignments */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Recent Assignments</h3>
              <p className="text-xs text-slate-500">Asset custody transfers and check-outs</p>
            </div>
            {hasPermission(AppPermissions.ASSIGN_ASSET) && (
              <Button
                variant="subtle"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => onNavigate('assignments')}
              >
                View All
              </Button>
            )}
          </div>

          {isLoading ? (
            <TableSkeleton rows={4} cols={4} />
          ) : recentAssignments.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">No active assignments.</div>
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-y border-slate-100 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-5">Hardware Asset</th>
                    <th className="py-2.5 px-4">Assigned To</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAssignments.map((asg) => (
                    <tr key={asg.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-5">
                        <div className="font-semibold text-slate-900 truncate max-w-[200px]">
                          {asg.assetName}
                        </div>
                        <div className="text-[11px] text-slate-400">ID: {asg.assetId}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div className="font-medium">{asg.assignedToName}</div>
                        <div className="text-[11px] text-slate-400">{asg.assignedToEmail}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{asg.assignmentDate}</td>
                      <td className="py-3 px-5 text-right">{getStatusBadge(asg.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
