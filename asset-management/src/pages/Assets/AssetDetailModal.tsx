import React from 'react';
import { Dialog } from '../../components/common/Dialog';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import type { AssetItem } from '../../services/asset.service';
import { Laptop, Calendar, MapPin, Tag, DollarSign, ShieldAlert } from 'lucide-react';

interface AssetDetailModalProps {
  asset: AssetItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (asset: AssetItem) => void;
  canEdit?: boolean;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  isOpen,
  onClose,
  onEdit,
  canEdit = false,
}) => {
  if (!asset) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available':
        return <Badge variant="success">Available</Badge>;
      case 'Assigned':
        return <Badge variant="blue">Assigned</Badge>;
      case 'Maintenance':
        return <Badge variant="purple">Under Maintenance</Badge>;
      case 'Retired':
        return <Badge variant="danger">Retired</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Asset Specification & Record"
      description={`Dataverse Identifier: ${asset.id}`}
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-400">
            {asset.createdOn ? `Registered: ${new Date(asset.createdOn).toLocaleDateString()}` : ''}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {canEdit && onEdit && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(asset);
                }}
              >
                Edit Asset
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Header Block */}
        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-xl shrink-0">
            <Laptop className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">{asset.name}</h3>
              {getStatusBadge(asset.status)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Category: <span className="font-medium text-slate-700">{asset.categoryName || 'General Equipment'}</span>
            </p>
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3.5 bg-white border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <Tag className="w-3.5 h-3.5 text-blue-500" />
              <span>Asset Category</span>
            </div>
            <div className="text-sm font-medium text-slate-800">
              {asset.categoryName || 'Unassigned Category'}
            </div>
          </div>

          <div className="p-3.5 bg-white border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              <span>Current Location</span>
            </div>
            <div className="text-sm font-medium text-slate-800">
              {asset.locationName || 'Main Office'}
            </div>
          </div>

          <div className="p-3.5 bg-white border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>Acquisition Date</span>
            </div>
            <div className="text-sm font-medium text-slate-800">
              {asset.purchaseDate || 'Not specified'}
            </div>
          </div>

          <div className="p-3.5 bg-white border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
              <span>Book Value</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              {asset.value ? `$${asset.value.toLocaleString()}` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Security & Governance notice */}
        <div className="flex items-start gap-2.5 p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-800">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <p>
            This hardware asset is registered in Microsoft Dataverse with role-based security boundaries.
            Modifications and custody reassignments are audited and restricted to authorized personnel.
          </p>
        </div>
      </div>
    </Dialog>
  );
};
