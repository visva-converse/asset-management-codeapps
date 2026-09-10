import React, { useState } from 'react';
import { Dialog } from '../../components/common/Dialog';
import { Button } from '../../components/common/Button';
import { AlertCircle } from 'lucide-react';
import type { AssetRequestItem } from '../../services/request.service';

interface RejectionDialogProps {
  request: AssetRequestItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

export const RejectionDialog: React.FC<RejectionDialogProps> = ({
  request,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A rejection justification is required for corporate audit compliance.');
      return;
    }
    setError(null);
    await onConfirm(reason.trim());
    setReason('');
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Reject Request ${request.requestNumber}`}
      description="Provide an audited reason for rejecting this asset request"
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            Confirm Rejection
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
          <div>
            Item: <strong className="text-slate-900">{request.requestName}</strong>
          </div>
          <div>
            Requested by: <span className="text-slate-700">{request.requestedBy}</span> (
            {request.requestedByEmail})
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reason for Rejection <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            required
            placeholder="e.g. Budget constraints, duplicate hardware already assigned, or non-compliant equipment model..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
          />
        </div>
      </form>
    </Dialog>
  );
};
