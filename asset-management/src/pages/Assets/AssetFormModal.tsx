import React, { useState, useEffect } from 'react';
import { Dialog } from '../../components/common/Dialog';
import { Button } from '../../components/common/Button';
import { CategoryService, type CategoryItem } from '../../services/category.service';
import { LocationService, type LocationItem } from '../../services/location.service';
import type { AssetItem, AssetStatus } from '../../services/asset.service';

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    categoryId?: string;
    categoryName?: string;
    locationId?: string;
    locationName?: string;
    purchaseDate?: string;
    value?: number;
    status?: AssetStatus;
  }) => Promise<void>;
  initialData?: AssetItem | null;
  isLoading?: boolean;
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [value, setValue] = useState<string>('');
  const [status, setStatus] = useState<AssetStatus>('Available');

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      CategoryService.getAllCategories().then(setCategories);
      LocationService.getAllLocations().then(setLocations);

      if (initialData) {
        setName(initialData.name);
        setCategoryId(initialData.categoryId || '');
        setLocationId(initialData.locationId || '');
        setPurchaseDate(initialData.purchaseDate || '');
        setValue(initialData.value !== undefined ? String(initialData.value) : '');
        setStatus(initialData.status || 'Available');
      } else {
        setName('');
        setCategoryId('');
        setLocationId('');
        setPurchaseDate(new Date().toISOString().split('T')[0]);
        setValue('');
        setStatus('Available');
      }
      setFormError(null);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Asset name is required.');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === categoryId);
    const selectedLocation = locations.find((l) => l.id === locationId);

    setFormError(null);
    await onSubmit({
      name: name.trim(),
      categoryId: categoryId || undefined,
      categoryName: selectedCategory?.name,
      locationId: locationId || undefined,
      locationName: selectedLocation?.name,
      purchaseDate: purchaseDate || undefined,
      value: value ? parseFloat(value) : undefined,
      status,
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Update Enterprise Asset' : 'Register New Asset'}
      description="Record asset hardware specifications into Microsoft Dataverse"
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {initialData ? 'Save Changes' : 'Create Asset'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {formError}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Asset Name & Model <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Dell XPS 15 9530 (i9, 32GB)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category
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
              Location
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">Select Location...</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Acquisition Date
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Book Value (USD)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 1999.00"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {initialData && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AssetStatus)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="Available">Available</option>
              <option value="Assigned">Assigned</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Retired">Retired</option>
            </select>
          </div>
        )}
      </form>
    </Dialog>
  );
};
