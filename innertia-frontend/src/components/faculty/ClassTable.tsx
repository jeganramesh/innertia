import { useState, useEffect } from 'react';
import { MoreVertical, Edit, Trash2, Users, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
  TableSkeleton,
} from '../ui/Table';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Input';
import { useFacultyStore } from '../../stores/facultyStore';
import { formatRelativeTime, formatNumber } from '../../utils/formatters';
import type { Class, FilterOptions } from '../../types';

interface ClassTableProps {
  onEdit?: (classData: Class) => void;
  onDelete?: (id: string) => void;
}

export const ClassTable = ({ onEdit, onDelete }: ClassTableProps) => {
  const { classes, isLoading, error, fetchClasses, deleteClass } = useFacultyStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Class;
    direction: 'asc' | 'desc';
  }>({ key: 'name', direction: 'asc' });

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Filter and sort classes
  const filteredClasses = classes
    .filter((cls) => {
      const matchesSearch =
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || cls.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (key: keyof Class) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await deleteClass(id);
        onDelete?.(id);
      } catch (error) {
        console.error('Failed to delete class:', error);
      }
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-danger-600 mb-4">{error}</p>
            <Button onClick={fetchClasses}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Classes</CardTitle>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
              leftIcon={<Calendar size={16} />}
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'archived', label: 'Archived' },
              ]}
              className="w-40"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead
                className="cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('name')}
              >
                Class Name
                {sortConfig.key === 'name' && (
                  <span className="ml-1">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('subject')}
              >
                Subject
                {sortConfig.key === 'subject' && (
                  <span className="ml-1">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </TableHead>
              <TableHead>Students</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('lastSession')}
              >
                Last Session
                {sortConfig.key === 'lastSession' && (
                  <span className="ml-1">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton rows={5} columns={6} />
            ) : filteredClasses.length === 0 ? (
              <TableEmptyState
                title="No classes found"
                description={
                  searchQuery || statusFilter
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first class'
                }
                colSpan={6}
              />
            ) : (
              filteredClasses.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell className="font-medium text-slate-900">
                    {cls.name}
                  </TableCell>
                  <TableCell>{cls.subject}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-slate-400" />
                      <span>{formatNumber(cls.studentCount)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {formatRelativeTime(cls.lastSession)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={cls.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit?.(cls)}
                        aria-label="Edit class"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(cls.id)}
                        className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                        aria-label="Delete class"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
