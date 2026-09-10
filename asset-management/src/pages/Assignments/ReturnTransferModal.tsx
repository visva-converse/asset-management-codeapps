import React, { useState, useEffect } from 'react';
import { Dialog } from '../../components/common/Dialog';
import { Button } from '../../components/common/Button';
import { UserService, type DirectoryUser } from '../../services/user.service';
import type { AssetAssignmentItem } from '../../services/assignment.service';

interface ReturnTransferModalProps {
  assignment: AssetAssignmentItem | null;
  mode: 'return' | 'transfer';
  isOpen: boolean;
  onClose: () => void;
  onReturn: (assignmentId: string, assetId: string) => Promise<void>;
  onTransfer: (
    assignmentId: string,
    newAssigneeName: string,
    newAssigneeEmail?: string,
    assetId?: string
  ) => Promise<void>;
  isLoading?: boolean;
}

export const ReturnTransferModal: React.FC<ReturnTransferModalProps> = ({
  assignment,
  mode,
  isOpen,
  onClose,
  onReturn,
  onTransfer,
  isLoading = false,
}) => {
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'transfer') {
        UserService.getAllUsers().then(setUsers);
      }
      setSelectedUserId('');
      setCustomName('');
      setCustomEmail('');
      setError(null);
    }
  }, [isOpen, mode]);

  if (!assignment) return null;

  const isReturn = mode === 'return';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReturn) {
      await onReturn(assignment.id, assignment.assetId);
    } else {
      let targetName = customName.trim();
      let targetEmail = customEmail.trim();

      if (selectedUserId) {
        const u = users.find((x) => x.id === selectedUserId);
        if (u) {
          targetName = u.fullName;
          targetEmail = u.email;
        }
      }

      if (!targetName) {
        setError('Please select or enter the new custodian employee.');
        return;
      }

      setError(null);
      await onTransfer(assignment.id, targetName, targetEmail || undefined, assignment.assetId);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isReturn ? 'Return Hardware Asset' : 'Transfer Asset Custody'}
      description={
        isReturn
          ? 'Process equipment check-in and release hardware back to inventory'
          : 'Reassign asset custody to another authorized employee'
      }
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={isReturn ? 'primary' : 'primary'}
            size="sm"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {isReturn ? 'Confirm Return' : 'Confirm Transfer'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
          <div>
            Asset: <strong className="text-slate-900">{assignment.assetName}</strong>
          </div>
          <div>
            Current Custodian:{' '}
            <span className="text-slate-700 font-medium">{assignment.assignedToName}</span>
          </div>
          <div>
            Checked Out Since:{' '}
            <span className="text-slate-600">{assignment.assignmentDate}</span>
          </div>
        </div>

        {isReturn ? (
          <p className="text-xs text-slate-600 leading-relaxed">
            By confirming return, the assignment record in Dataverse will be flagged as{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded">Returned</code> and the asset status
            will be updated to <code className="bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded">Available</code>.
          </p>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select New Employee (Directory) <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  if (e.target.value) {
                    setCustomName('');
                    setCustomEmail('');
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Choose new custodian...</option>
                {users
                  .filter((u) => u.fullName !== assignment.assignedToName)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} — {u.jobTitle}
                    </option>
                  ))}
              </select>
            </div>

            {!selectedUserId && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Or Enter Name
                  </label>
                  <input
                    type="text"
                    placeholder="New custodian name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee Email
                  </label>
                  <input
                    type="email"
                    placeholder="user@company.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </Dialog>
  );
};
