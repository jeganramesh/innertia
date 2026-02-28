/**
 * College Form Modal Component
 * Create/Edit college form with validation
 */

import { useState } from 'react';
import { CollegeCreatePayload } from '../types';
import { useCreateCollege, useUpdateCollege } from '../hooks';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../../components/ui/Dialog';

interface CollegeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  college?: {
    id: string;
    name: string;
    code: string;
    domain?: string;
    is_active: boolean;
  };
}

export const CollegeFormModal = ({ isOpen, onClose, college }: CollegeFormModalProps) => {
  const [formData, setFormData] = useState({
    name: college?.name || '',
    code: college?.code || '',
    domain: college?.domain || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateCollege();
  const updateMutation = useUpdateCollege();

  const isEditing = !!college;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.code.trim()) newErrors.code = 'Code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          collegeId: college.id,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData as CollegeCreatePayload);
      }
      onClose();
      setFormData({ name: '', code: '', domain: '' });
    } catch (error) {
      // Error handled by mutations
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit College' : 'Create New College'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              College Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter college name"
              error={errors.name}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              College Code *
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., MIT, HARVARD"
              error={errors.code}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domain (optional)
            </label>
            <Input
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              placeholder="e.g., mit.edu"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading 
              ? (isEditing ? 'Saving...' : 'Creating...') 
              : (isEditing ? 'Save Changes' : 'Create College')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CollegeFormModal;
