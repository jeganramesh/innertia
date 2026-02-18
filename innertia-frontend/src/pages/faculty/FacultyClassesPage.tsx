import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Search, 
  Plus, 
  Play, 
  Users, 
  FileText, 
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Download
} from 'lucide-react';
import { FacultyClass } from './types';

// Mock data
const mockClasses: FacultyClass[] = [
  { id: '1', name: 'Introduction to Programming', code: 'CS101', studentCount: 45, sessionCount: 15, lastSession: '2024-02-17', status: 'active' },
  { id: '2', name: 'Data Structures', code: 'CS201', studentCount: 38, sessionCount: 12, lastSession: '2024-02-16', status: 'active' },
  { id: '3', name: 'Web Development', code: 'CS301', studentCount: 32, sessionCount: 8, lastSession: '2024-02-15', status: 'active' },
  { id: '4', name: 'Algorithm Design', code: 'CS401', studentCount: 28, sessionCount: 5, lastSession: '2024-02-14', status: 'active' },
  { id: '5', name: 'Machine Learning', code: 'CS501', studentCount: 25, sessionCount: 2, lastSession: '2024-02-10', status: 'archived' },
];

export const FacultyClassesPage = () => {
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
          <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
          <p className="text-gray-500 mt-1">Manage your classes and view details</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Class
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
                <span>{cls.studentCount} students</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span>{cls.sessionCount} sessions</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Last: {cls.lastSession}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              {cls.status === 'active' && (
                <Button className="flex-1 flex items-center justify-center gap-1">
                  <Play className="w-4 h-4" />
                  Start Session
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FacultyClassesPage;
