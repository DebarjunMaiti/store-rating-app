import React, { useState } from 'react';
import { X, Store as StoreIcon } from 'lucide-react';
import api from '../../api/client';
import { validateStoreForm } from '../../utils/validation';

interface AddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoreAdded: () => void;
  availableOwners: { id: string; name: string; email: string; role: string }[];
  showToast: (type: 'success' | 'error', text: string) => void;
}

export const AddStoreModal: React.FC<AddStoreModalProps> = ({
  isOpen,
  onClose,
  onStoreAdded,
  availableOwners,
  showToast
}) => {
  const [formData, setFormData] = useState({ name: '', email: '', address: '', ownerId: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = validateStoreForm({
      name: formData.name,
      email: formData.email,
      address: formData.address
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/admin/stores', {
        name: formData.name,
        email: formData.email,
        address: formData.address,
        ownerId: formData.ownerId || null
      });

      if (res.data.success) {
        showToast('success', 'Store created successfully!');
        setFormData({ name: '', email: '', address: '', ownerId: '' });
        onStoreAdded();
        onClose();
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        showToast('error', err.response?.data?.message || 'Failed to create store.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
            <StoreIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Add New Store</h3>
            <p className="text-xs text-slate-400">Register a new store into the rating platform</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Store Name <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Apex Fitness and Wellness Hub"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>Min 8, Max 60 characters</span>
              <span>{formData.name.length}/60</span>
            </div>
            {errors.name && <p className="text-xs text-red-400 mt-0.5">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Store Email <span className="text-emerald-400">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="contact@storedomain.com"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
            />
            {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Store Address <span className="text-emerald-400">*</span>
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="e.g. 120 Silicon Way, Tech District, San Jose, CA 95110"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>Max 400 characters</span>
              <span>{formData.address.length}/400</span>
            </div>
            {errors.address && <p className="text-xs text-red-400 mt-0.5">{errors.address}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Assign Store Owner (Optional)
            </label>
            <select
              value={formData.ownerId}
              onChange={(e) => setFormData(prev => ({ ...prev, ownerId: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- No Owner Assigned Yet --</option>
              {availableOwners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name} ({owner.email}) [{owner.role}]
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 text-sm disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};