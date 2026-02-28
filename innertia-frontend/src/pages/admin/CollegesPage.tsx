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
  College 
} from '../../modules/admin/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
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
  const [newCollege, setNewCollege] = useState({ name: '', code: '', domain: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await createCollege(newCollege);
      toast.success('College created successfully');
      setIsCreateDialogOpen(false);
      setNewCollege({ name: '', code: '', domain: '' });
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

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Colleges"
        description="Manage colleges on the platform"
        action={
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
                  <TableHead>Active Features</TableHead>
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
                        <Badge variant={college.is_active ? 'success' : 'secondary'}>
                          {college.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{college.active_features_count || 0}</TableCell>
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
