import { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  UserCog,
  ToggleLeft,
  ToggleRight,
  Upload,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/Dialog';
import { adminApiService, UserOutAdmin, UserCreateAdmin, UserUpdateAdmin } from '../../services/adminApi';
import { useAuth } from '../../hooks/useAuth';

// Types
interface UserFormData {
  email: string;
  name: string;
  role: 'student' | 'faculty' | 'admin';
  password?: string;
  is_active: boolean;
}

const initialFormData: UserFormData = {
  email: '',
  name: '',
  role: 'student',
  password: '',
  is_active: true
};

export const UsersPage = () => {
  const { user: currentUser } = useAuth();
  
  // State
  const [users, setUsers] = useState<UserOutAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'faculty' | 'admin'>('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOutAdmin | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Fetch users - using real API only
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        page_size: pageSize,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        search: debouncedSearch || undefined,
      };
      
      const response = await adminApiService.listUsers(params);
      setUsers(response.users);
      setTotal(response.total);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users. Please try again.');
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, roleFilter, debouncedSearch]);
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [roleFilter, debouncedSearch]);
  
  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  
  // Handlers
  const handleCreateUser = async () => {
    try {
      setFormLoading(true);
      setFormError(null);
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setFormError('Please enter a valid email address');
        setFormLoading(false);
        return;
      }
      
      // Validate password
      if (!formData.password || formData.password.length < 8) {
        setFormError('Password must be at least 8 characters');
        setFormLoading(false);
        return;
      }
      
      const userData: UserCreateAdmin = {
        email: formData.email,
        name: formData.name || undefined,
        role: formData.role,
        is_active: formData.is_active,
        password: formData.password
      };
      
      await adminApiService.createUser(userData);
      setShowCreateModal(false);
      setFormData(initialFormData);
      fetchUsers();
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail;
      if (typeof errorDetail === 'string') {
        setFormError(errorDetail);
      } else if (Array.isArray(errorDetail)) {
        setFormError(errorDetail.map((e: any) => e.msg || JSON.stringify(e)).join(', '));
      } else {
        setFormError('Failed to create user. Please try again.');
      }
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    try {
      setFormLoading(true);
      setFormError(null);
      
      const userData: UserUpdateAdmin = {
        name: formData.name || undefined,
        role: formData.role,
        is_active: formData.is_active
      };
      
      await adminApiService.updateUser(selectedUser.id, userData);
      setShowEditModal(false);
      setSelectedUser(null);
      setFormData(initialFormData);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to update user');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleToggleUser = async (user: UserOutAdmin) => {
    try {
      await adminApiService.toggleUser(user.id);
      fetchUsers();
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail || 'Failed to toggle user status';
      // Show more specific error messages
      if (errorDetail.includes('Cannot disable your own account')) {
        alert('You cannot disable your own account.');
      } else if (errorDetail.includes('Cannot disable the last admin')) {
        alert('Cannot disable the last admin account.');
      } else {
        alert(errorDetail);
      }
    }
  };
  
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setFormLoading(true);
      await adminApiService.deleteUser(selectedUser.id);
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to delete user');
    } finally {
      setFormLoading(false);
    }
  };
  
  const openEditModal = (user: UserOutAdmin) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      name: user.name || '',
      role: user.role as 'student' | 'faculty' | 'admin',
      is_active: user.is_active
    });
    setFormError(null);
    setShowEditModal(true);
  };
  
  const openDeleteModal = (user: UserOutAdmin) => {
    setSelectedUser(user);
    setFormError(null);
    setShowDeleteModal(true);
  };
  
  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-700',
      faculty: 'bg-purple-100 text-purple-700',
      student: 'bg-blue-100 text-blue-700'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[role as keyof typeof colors]}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };
  
  const canModifyUser = (user: UserOutAdmin) => {
    // Cannot modify/delete own account
    return user.id !== currentUser?.id;
  };
  
  const isLastAdmin = (user: UserOutAdmin) => {
    // Check if this is the last admin (simplified check)
    return user.role === 'admin' && users.filter(u => u.role === 'admin' && u.id !== user.id).length === 0;
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Page Header - Apple Style */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-semibold text-[#1d1d1f] tracking-tight">
            User Management
          </h1>
          <p className="text-base text-[#86868b] mt-2 max-w-xl">
            Manage students, faculty, and admin accounts across your institution.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="h-11 px-5 rounded-xl flex items-center gap-2"
            onClick={() => window.location.href = '/admin/users/bulk-upload'}
          >
            <Upload className="w-4 h-4" />
            Bulk Upload
          </Button>
          <Button 
            className="h-11 px-5 rounded-xl flex items-center gap-2" 
            onClick={() => {
              setFormData(initialFormData);
              setFormError(null);
              setShowCreateModal(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters - Apple Style */}
      <div className="bg-white rounded-2xl p-4 lg:p-5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 rounded-xl bg-[#f5f5f7] border-0 focus:bg-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {(['all', 'student', 'faculty', 'admin'] as const).map((role) => (
              <Button
                key={role}
                variant={roleFilter === role ? 'primary' : 'outline'}
                size="sm"
                className="h-11 px-5 rounded-xl"
                onClick={() => setRoleFilter(role)}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table - Apple Style */}
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f5f5f7]">
              <tr>
                <th className="px-6 py-4 text-left text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">User</th>
                <th className="px-6 py-4 text-left text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Role</th>
                <th className="px-6 py-4 text-left text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Status</th>
                <th className="px-6 py-4 text-left text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Created</th>
                <th className="px-6 py-4 text-right text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f7]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-2">Loading users...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <UserCog className="w-12 h-12 mx-auto text-gray-300" />
                    <p className="text-gray-500 mt-2">No users found</p>
                    {searchTerm && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSearchTerm('')}
                        className="mt-2"
                      >
                        Clear search
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#f5f5f7]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                          <UserCog className="w-5 h-5 text-[#86868b]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1d1d1f]">{user.name || 'N/A'}</p>
                          <p className="text-sm text-[#86868b]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <ToggleRight className="w-4 h-4" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-400">
                            <ToggleLeft className="w-4 h-4" />
                            Inactive
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#86868b]">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {canModifyUser(user) ? (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="p-2"
                              onClick={() => openEditModal(user)}
                              title="Edit user"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="p-2"
                              onClick={() => handleToggleUser(user)}
                              title={user.is_active ? 'Deactivate user' : 'Activate user'}
                            >
                              {user.is_active ? (
                                <ToggleLeft className="w-4 h-4 text-orange-500" />
                              ) : (
                                <ToggleRight className="w-4 h-4 text-green-500" />
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="p-2 text-red-600 hover:text-red-700"
                              onClick={() => openDeleteModal(user)}
                              title="Delete user"
                              disabled={isLastAdmin(user)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">This is you</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} users
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. They will receive login credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4" />
                {formError}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password (min 8 characters)"
              />
              <p className="text-xs text-gray-500">Default: "changeme123" if left blank</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm">Active</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateUser} 
              disabled={formLoading || !formData.email}
            >
              {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Email cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4" />
                {formError}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                value={formData.email}
                disabled
                className="bg-gray-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={selectedUser?.id === currentUser?.id}
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
              {selectedUser?.id === currentUser?.id && (
                <p className="text-xs text-gray-500">Cannot change your own role</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editIsActive"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-gray-300"
                disabled={selectedUser?.id === currentUser?.id}
              />
              <label htmlFor="editIsActive" className="text-sm">Active</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditUser} 
              disabled={formLoading}
            >
              {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action can be undone by reactivating the user.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700 mb-4">
                <AlertCircle className="w-4 h-4" />
                {formError}
              </div>
            )}
            {selectedUser && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium">{selectedUser.name || 'N/A'}</p>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
                <p className="text-xs text-gray-400 mt-1">Role: {selectedUser.role}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="danger"
              onClick={handleDeleteUser} 
              disabled={formLoading}
            >
              {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
