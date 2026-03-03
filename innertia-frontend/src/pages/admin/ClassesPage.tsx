import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  BookOpen,
  Users,
  Archive,
  ArchiveRestore,
  Download
} from 'lucide-react';
import { ClassManagementItem } from './types';

// Mock data
const mockClasses: ClassManagementItem[] = [
  { id: '1', name: 'Introduction to Programming', code: 'CS101', facultyId: '1', facultyName: 'Dr. John Smith', studentCount: 45, status: 'active', createdAt: '2024-01-10' },
  { id: '2', name: 'Advanced Mathematics', code: 'MATH301', facultyId: '2', facultyName: 'Dr. Jane Doe', studentCount: 32, status: 'active', createdAt: '2024-01-12' },
  { id: '3', name: 'English Composition', code: 'ENG201', facultyId: '3', facultyName: 'Prof. Mary Johnson', studentCount: 28, status: 'active', createdAt: '2024-01-15' },
  { id: '4', name: 'Physics I', code: 'PHYS101', facultyId: '1', facultyName: 'Dr. John Smith', studentCount: 50, status: 'archived', createdAt: '2023-09-01' },
];

export const AdminClassesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');

  const filteredClasses = mockClasses.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cls.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cls.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>
          <p className="text-gray-500 mt-1">Manage classes and enrollments</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Class
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'archived'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.map((cls) => (
          <Card key={cls.id} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                <p className="text-sm text-gray-500">{cls.code}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                cls.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {cls.status.charAt(0).toUpperCase() + cls.status.slice(1)}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{cls.studentCount} students enrolled</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <BookOpen className="w-4 h-4" />
                <span>{cls.facultyName}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              {cls.status === 'active' ? (
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-600">
                  <Archive className="w-4 h-4" />
                  Archive
                </Button>
              ) : (
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-green-600">
                  <ArchiveRestore className="w-4 h-4" />
                  Restore
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminClassesPage;
