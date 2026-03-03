/**
 * Platform Admin - Colleges Management Page
 * Allows platform admin to manage colleges and view college details
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  fetchColleges, 
  createCollege, 
  deleteCollege,
  updateCollege,
  toggleCollegeStatus,
  College 
} from '../../modules/admin/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge, CollegeStatusBadge } from '../../components/ui/Badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/Table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '../../components/ui/Dialog';
import { PageHeader } from '../../components/ui/PageHeader';
import { toast } from 'react-hot-toast';

export const CollegesPage = () => {
  const navigate = useNavigate();
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCollege, setNewCollege] = useState({ name: '', code: '', domain: '', add_existing_users: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    loadColleges();
  }, [page]);

  const loadColleges = async () => {
    try {
      setLoading(true);
      const response = await fetchColleges(page, 20);
      setColleges(response.items || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Failed to load colleges:', error);
      toast.error('Failed to load colleges');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollege = async () => {
    if (!newCollege.name || !newCollege.code) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await createCollege(newCollege);
      
      // Show success message with users count if applicable
      if (result.users_added_count && result.users_added_count > 0) {
        toast.success(`College created successfully! ${result.users_added_count} user(s) have been added to the college.`);
      } else {
        toast.success('College created successfully');
      }
      
      setIsCreateDialogOpen(false);
      setNewCollege({ name: '', code: '', domain: '', add_existing_users: false });
      loadColleges();
    } catch (error: any) {
      console.error('Failed to create college:', error);
      toast.error(error.response?.data?.detail || 'Failed to create college');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCollege = async (collegeId: string, collegeName: string) => {
    if (!confirm(`Are you sure you want to deactivate "${collegeName}"?`)) {
      return;
    }

    try {
      await deleteCollege(collegeId);
      toast.success('College deactivated successfully');
      loadColleges();
    } catch (error) {
      console.error('Failed to delete college:', error);
      toast.error('Failed to delete college');
    }
  };

  const handlePermanentDeleteCollege = async (collegeId: string, collegeName: string) => {
    if (!confirm(`WARNING: This will PERMANENTLY delete "${collegeName}" and all associated data.\n\nThis action cannot be undone.\n\nAre you absolutely sure?`)) {
      return;
    }

    // Double confirmation for destructive action
    if (!confirm(`Type "DELETE" to confirm permanent deletion of "${collegeName}"`)) {
      return;
    }

    try {
      await deleteCollege(collegeId);
      toast.success('College deleted successfully');
      loadColleges();
    } catch (error: any) {
      console.error('Failed to delete college:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete college');
    }
  };

  const handleToggleStatus = async (collegeId: string, currentStatus: boolean) => {
    try {
      setTogglingId(collegeId);
      // Use the dedicated toggle endpoint
      await toggleCollegeStatus(collegeId, !currentStatus);
      toast.success(`College ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      loadColleges();
    } catch (error: any) {
      console.error('Failed to toggle college status:', error);
      toast.error(error.response?.data?.detail || 'Failed to toggle college status');
    } finally {
      setTogglingId(null);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Colleges"
        subtitle="Manage colleges on the platform"
        actions={
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add College</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New College</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    College Name *
                  </label>
                  <Input
                    value={newCollege.name}
                    onChange={(e) => setNewCollege({ ...newCollege, name: e.target.value })}
                    placeholder="Enter college name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    College Code *
                  </label>
                  <Input
                    value={newCollege.code}
                    onChange={(e) => setNewCollege({ ...newCollege, code: e.target.value })}
                    placeholder="e.g., MIT, HARVARD"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Domain (optional)
                  </label>
                  <Input
                    value={newCollege.domain}
                    onChange={(e) => setNewCollege({ ...newCollege, domain: e.target.value })}
                    placeholder="e.g., mit.edu"
                  />
                </div>
                
                {/* Add existing users checkbox */}
                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="add_existing_users"
                    checked={newCollege.add_existing_users}
                    onChange={(e) => setNewCollege({ ...newCollege, add_existing_users: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="add_existing_users" className="text-sm text-gray-700">
                    Add all existing users to this college
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCollege} disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create College'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Toggle</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colleges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No colleges found
                    </TableCell>
                  </TableRow>
                ) : (
                  colleges.map((college) => (
                    <TableRow key={college.id}>
                      <TableCell className="font-medium">{college.name}</TableCell>
                      <TableCell>{college.code}</TableCell>
                      <TableCell>{college.domain || '-'}</TableCell>
                      <TableCell>
                        <CollegeStatusBadge isActive={college.is_active} />
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggleStatus(college.id, college.is_active)}
                          disabled={togglingId === college.id}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            college.is_active ? 'bg-green-600' : 'bg-gray-200'
                          } ${togglingId === college.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={college.is_active ? 'Click to deactivate' : 'Click to activate'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              college.is_active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </TableCell>
                      <TableCell>
                        {new Date(college.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/platform-admin/colleges/${college.id}`)}
                          >
                            Manage
                          </Button>
                          {college.is_active && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteCollege(college.id, college.name)}
                            >
                              Deactivate
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handlePermanentDeleteCollege(college.id, college.name)}
                            title="Permanently delete college"
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} colleges
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CollegesPage;
