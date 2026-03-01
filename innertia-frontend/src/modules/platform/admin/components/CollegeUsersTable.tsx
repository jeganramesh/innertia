/**
 * College Users Table Component
 * Display users scoped to a specific college
 */

import { CollegeUser } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/Table';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { toast } from 'react-hot-toast';

interface CollegeUsersTableProps {
  users: CollegeUser[];
  isLoading?: boolean;
  onMakeAdmin?: (userId: string) => Promise<void>;
  onRemoveAdmin?: (userId: string) => Promise<void>;
}

export const CollegeUsersTable = ({ 
  users, 
  isLoading, 
  onMakeAdmin,
  onRemoveAdmin 
}: CollegeUsersTableProps) => {
  const handleMakeAdmin = async (userId: string) => {
    if (!onMakeAdmin) return;
    try {
      await onMakeAdmin(userId);
      toast.success('User promoted to college admin');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to promote user');
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!onRemoveAdmin) return;
    try {
      await onRemoveAdmin(userId);
      toast.success('User removed from college admin');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to remove admin privileges');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">No users found in this college</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined</TableHead>
          {(onMakeAdmin || onRemoveAdmin) && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.full_name || '-'}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant={user.role === 'college_admin' ? 'success' : 'outline'}>
                {user.role}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={user.is_active ? 'success' : 'secondary'}>
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell>
              {new Date(user.created_at).toLocaleDateString()}
            </TableCell>
            {(onMakeAdmin || onRemoveAdmin) && (
              <TableCell>
                {user.role !== 'college_admin' && onMakeAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMakeAdmin(user.id)}
                  >
                    Make Admin
                  </Button>
                )}
                {user.role === 'college_admin' && onRemoveAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveAdmin(user.id)}
                  >
                    Remove Admin
                  </Button>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CollegeUsersTable;
