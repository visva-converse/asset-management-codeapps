import React, { useState, useEffect } from 'react';
import { Dialog } from '../../components/common/Dialog';
import { Button } from '../../components/common/Button';
import { CategoryService, type CategoryItem } from '../../services/category.service';
import { useCurrentUser } from '../../hooks/useCurrentUser';

interface RequestCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    requestName: string;
    categoryId?: string;
    categoryName?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
    businessJustification?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export const RequestCreateModal: React.FC<RequestCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const { user } = useCurrentUser();

  const [requestName, setRequestName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [businessJustification, setBusinessJustification] = useState('');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      CategoryService.getAllCategories().then(setCategories);
      setRequestName('');
      setCategoryId('');
      setPriority('Medium');
      setBusinessJustification('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestName.trim()) {
      setError('Please provide a descriptive title for your hardware request.');
      return;
    }
    if (!businessJustification.trim()) {
      setError('Please provide a business justification for management review.');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === categoryId);

    setError(null);
    await onSubmit({
      requestName: requestName.trim(),
      categoryId: categoryId || undefined,
      categoryName: selectedCategory?.name,
      priority,
      businessJustification: businessJustification.trim(),
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Asset Hardware Request"
      description="Initiate an automated approval workflow via Power Automate and Dataverse"
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isLoading}>
            Submit Request
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

        {/* Requester Identity Info */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center justify-between">
          <span>
            Requester: <strong className="text-slate-800">{user?.fullName || 'Visva V'}</strong>
          </span>
          <span className="text-slate-500 font-mono">{user?.userPrincipalName || 'visva@company.com'}</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Request Title / Item Description <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Dell XPS 15 or 4K UltraSharp Display"
            value={requestName}
            onChange={(e) => setRequestName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Asset Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">Select Category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Priority Level
            </label>
            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as 'Low' | 'Medium' | 'High' | 'Critical')
              }
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Business Justification & Use Case <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            placeholder="Explain why this hardware is necessary for your work duties..."
            value={businessJustification}
            onChange={(e) => setBusinessJustification(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
          />
        </div>
      </form>
    </Dialog>
  );
};
