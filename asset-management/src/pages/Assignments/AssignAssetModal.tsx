import React, { useState, useEffect } from 'react';
import { Dialog } from '../../components/common/Dialog';
import { Button } from '../../components/common/Button';
import { AssetService, type AssetItem } from '../../services/asset.service';
import { UserService, type DirectoryUser } from '../../services/user.service';

interface AssignAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    assetId: string;
    assetName: string;
    assignedToName: string;
    assignedToEmail?: string;
    assignmentDate?: string;
    expectedReturnDate?: string;
    notes?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export const AssignAssetModal: React.FC<AssignAssetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [availableAssets, setAvailableAssets] = useState<AssetItem[]>([]);
  const [users, setUsers] = useState<DirectoryUser[]>([]);

  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [customUser, setCustomUser] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [assignmentDate, setAssignmentDate] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      AssetService.getAllAssets({ status: 'Available' }).then(setAvailableAssets);
      UserService.getAllUsers().then(setUsers);
      setSelectedAssetId('');
      setSelectedUserId('');
      setCustomUser('');
      setCustomEmail('');
      setAssignmentDate(new Date().toISOString().split('T')[0]);
      setExpectedReturnDate('');
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) {
      setError('Please select an available hardware asset.');
      return;
    }

    const asset = availableAssets.find((a) => a.id === selectedAssetId);
    if (!asset) {
      setError('Selected asset not found.');
      return;
    }

    let assigneeName = customUser.trim();
    let assigneeEmail = customEmail.trim();

    if (selectedUserId) {
      const u = users.find((x) => x.id === selectedUserId);
      if (u) {
        assigneeName = u.fullName;
        assigneeEmail = u.email;
      }
    }

    if (!assigneeName) {
      setError('Please select or enter an employee for custody assignment.');
      return;
    }

    setError(null);
    await onSubmit({
      assetId: asset.id,
      assetName: asset.name,
      assignedToName: assigneeName,
      assignedToEmail: assigneeEmail || undefined,
      assignmentDate: assignmentDate || undefined,
      expectedReturnDate: expectedReturnDate || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Hardware to Employee"
      description="Record asset check-out custody in Microsoft Dataverse"
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isLoading}>
            Confirm Assignment
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

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Available Asset <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">Select Available Asset...</option>
            {availableAssets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.categoryName || 'General'})
              </option>
            ))}
          </select>
          {availableAssets.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              No assets currently flagged as Available. Register or release an asset first.
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Assign to Employee (Directory) <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => {
              setSelectedUserId(e.target.value);
              if (e.target.value) {
                setCustomUser('');
                setCustomEmail('');
              }
            }}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">Choose from corporate directory...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName} — {u.jobTitle} ({u.email})
              </option>
            ))}
          </select>
        </div>

        {!selectedUserId && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Or Enter Name
              </label>
              <input
                type="text"
                placeholder="Employee full name"
                value={customUser}
                onChange={(e) => setCustomUser(e.target.value)}
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assignment Date
            </label>
            <input
              type="date"
              value={assignmentDate}
              onChange={(e) => setAssignmentDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Expected Return Date
            </label>
            <input
              type="date"
              value={expectedReturnDate}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Custody Notes
          </label>
          <textarea
            rows={2}
            placeholder="Equipment condition, accessories included (chargers, dongles)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
          />
        </div>
      </form>
    </Dialog>
  );
};
