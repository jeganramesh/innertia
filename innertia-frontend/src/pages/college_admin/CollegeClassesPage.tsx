/**
 * College Classes Page
 * Manage classes within the college - Full CRUD
 */

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/Dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  Search,
  BookOpen,
  User,
  Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ClassItem {
  id: string;
  name: string;
  department: string | null;
  academic_year: string | null;
  faculty_id: string | null;
  is_archived: boolean;
}

interface Faculty {
  id: string;
  full_name: string;
  email: string;
}

interface ClassFormData {
  name: string;
  department: string;
  academic_year: string;
  faculty_id: string;
}

const initialFormData: ClassFormData = {
  name: '',
  department: '',
  academic_year: '',
  faculty_id: ''
};

export const CollegeClassesPage = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [formData, setFormData] = useState<ClassFormData>(initialFormData);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch faculty list
  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('/api/v1/college-admin/users?role=faculty&limit=100', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setFaculty(data.items || []);
        }
      } catch (error) {
        console.error('Error fetching faculty:', error);
      }
    };
    fetchFaculty();
  }, []);

  // Fetch classes
  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/v1/college-admin/classes?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setClasses(data.items || []);
        setTotalPages(data.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleCreateClass = async () => {
    try {
      setFormLoading(true);
      setFormError(null);

      if (!formData.name.trim()) {
        setFormError('Class name is required');
        setFormLoading(false);
        return;
      }

      const token = localStorage.getItem('access_token');
      const body: any = { name: formData.name };
      if (formData.department) body.department = formData.department;
      if (formData.academic_year) body.academic_year = formData.academic_year;
      if (formData.faculty_id) body.faculty_id = formData.faculty_id;

      const response = await fetch('/api/v1/college-admin/classes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create class');
      }

      toast.success('Class created successfully');
      setShowCreateModal(false);
      setFormData(initialFormData);
      fetchClasses();
    } catch (err: any) {
      console.error('Error creating class:', err);
      setFormError(err.message || 'Failed to create class');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateClass = async () => {
    if (!selectedClass) return;
    
    try {
      setFormLoading(true);
      setFormError(null);

      const token = localStorage.getItem('access_token');
      const body: any = {};
      if (formData.name) body.name = formData.name;
      if (formData.department !== undefined) body.department = formData.department || null;
      if (formData.academic_year !== undefined) body.academic_year = formData.academic_year || null;
      body.faculty_id = formData.faculty_id || null;

      const response = await fetch(`/api/v1/college-admin/classes/${selectedClass.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update class');
      }

      toast.success('Class updated successfully');
      setShowEditModal(false);
      setSelectedClass(null);
      setFormData(initialFormData);
      fetchClasses();
    } catch (err: any) {
      console.error('Error updating class:', err);
      setFormError(err.message || 'Failed to update class');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    
    try {
      setFormLoading(true);
      setFormError(null);

      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/v1/college-admin/classes/${selectedClass.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete class');
      }

      toast.success('Class deleted successfully');
      setShowDeleteModal(false);
      setSelectedClass(null);
      fetchClasses();
    } catch (err: any) {
      console.error('Error deleting class:', err);
      setFormError(err.message || 'Failed to delete class');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (cls: ClassItem) => {
    setSelectedClass(cls);
    setFormData({
      name: cls.name || '',
      department: cls.department || '',
      academic_year: cls.academic_year || '',
      faculty_id: cls.faculty_id || ''
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const openDeleteModal = (cls: ClassItem) => {
    setSelectedClass(cls);
    setFormError(null);
    setShowDeleteModal(true);
  };

  const getFacultyName = (facultyId: string | null) => {
    if (!facultyId) return '-';
    const f = faculty.find(f => f.id === facultyId);
    return f ? f.full_name : '-';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600">Manage classes in your college</p>
        </div>
        <Button onClick={() => { setFormData(initialFormData); setFormError(null); setShowCreateModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Class
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Classes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Classes ({classes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{cls.name}</TableCell>
                      <TableCell>{cls.department || '-'}</TableCell>
                      <TableCell>{cls.academic_year || '-'}</TableCell>
                      <TableCell>{getFacultyName(cls.faculty_id)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          cls.is_archived 
                            ? 'bg-gray-100 text-gray-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {cls.is_archived ? 'Archived' : 'Active'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(cls)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(cls)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {classes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No classes found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
            <DialogDescription>Create a new class in your college</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {formError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Computer Science 101"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g., Computer Science"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <Input
                value={formData.academic_year}
                onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                placeholder="e.g., 2024-2025"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
              <select
                value={formData.faculty_id}
                onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select faculty</option>
                {faculty.map(f => (
                  <option key={f.id} value={f.id}>{f.full_name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreateClass} disabled={formLoading}>
              {formLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>Update class information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {formError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <Input
                value={formData.academic_year}
                onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
              <select
                value={formData.faculty_id}
                onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select faculty</option>
                {faculty.map(f => (
                  <option key={f.id} value={f.id}>{f.full_name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleUpdateClass} disabled={formLoading}>
              {formLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this class? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {formError}
              </div>
            )}
            {selectedClass && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-10 h-10 text-gray-400" />
                  <div>
                    <p className="font-medium">{selectedClass.name}</p>
                    <p className="text-sm text-gray-500">{selectedClass.department || 'No department'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteClass} disabled={formLoading}>
              {formLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollegeClassesPage;
