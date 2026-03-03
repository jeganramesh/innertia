import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useFacultyStore } from '../../stores/facultyStore';
import { useToast } from '../ui/Toast';
import type { Class, CreateClassDto } from '../../types';

interface CreateClassFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newClass: Class) => void;
  editClass?: Class | null;
}

export const CreateClassForm = ({
  isOpen,
  onClose,
  onSuccess,
  editClass,
}: CreateClassFormProps) => {
  const { createClass, updateClass, isLoading } = useFacultyStore();
  const { addToast } = useToast();

  const [formData, setFormData] = useState<CreateClassDto>({
    name: '',
    subject: '',
    studentCount: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!editClass;

  // Reset form when dialog opens/closes or editClass changes
  useEffect(() => {
    if (isOpen) {
      if (editClass) {
        setFormData({
          name: editClass.name,
          subject: editClass.subject,
          studentCount: editClass.studentCount,
        });
      } else {
        setFormData({
          name: '',
          subject: '',
          studentCount: 0,
        });
      }
      setErrors({});
    }
  }, [isOpen, editClass]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Class name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Class name must be at least 3 characters';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (formData.studentCount !== undefined && formData.studentCount < 0) {
      newErrors.studentCount = 'Student count cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing && editClass) {
        await updateClass(editClass.id, formData);
        addToast({
          title: 'Success',
          description: 'Class updated successfully',
          variant: 'success',
        });
      } else {
        const newClass = await createClass(formData);
        addToast({
          title: 'Success',
          description: 'Class created successfully',
          variant: 'success',
        });
        onSuccess?.(newClass);
      }

      handleClose();
    } catch (error) {
      addToast({
        title: 'Error',
        description: isEditing
          ? 'Failed to update class'
          : 'Failed to create class',
        variant: 'error',
      });
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      subject: '',
      studentCount: 0,
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Class' : 'Create New Class'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the class information below'
              : 'Fill in the details to create a new class'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Class Name"
            placeholder="e.g., Introduction to Computer Science"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            error={errors.name}
            required
          />

          <Input
            label="Subject"
            placeholder="e.g., Computer Science"
            value={formData.subject}
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
            error={errors.subject}
            required
          />

          <Input
            label="Number of Students"
            type="number"
            placeholder="0"
            value={formData.studentCount || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                studentCount: parseInt(e.target.value) || 0,
              })
            }
            error={errors.studentCount}
            min="0"
          />

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {isEditing ? 'Update Class' : 'Create Class'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Button to trigger the dialog
interface CreateClassButtonProps {
  onCreate?: (newClass: Class) => void;
  editClass?: Class | null;
}

export const CreateClassButton = ({
  onCreate,
  editClass,
}: CreateClassButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} leftIcon={<Plus size={18} />}>
        {editClass ? 'Edit Class' : 'Create Class'}
      </Button>
      <CreateClassForm
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={(newClass) => {
          onCreate?.(newClass);
          setIsOpen(false);
        }}
        editClass={editClass}
      />
    </>
  );
};
