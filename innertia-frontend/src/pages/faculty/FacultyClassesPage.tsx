import { useState, useEffect } from 'react';
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
  Edit,
  Upload,
  Archive,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { facultyApiService, ClassWithEnrollment } from '../../services/facultyApi';
import { useNavigate } from 'react-router-dom';

export const FacultyClassesPage = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassWithEnrollment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await facultyApiService.getClasses();
        setClasses(data);
      } catch (err: any) {
        console.error('Failed to fetch classes:', err);
        setError(err.response?.data?.detail || 'Failed to load classes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Filter classes based on search
  const filteredClasses = classes.filter(cls => 
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cls.description && cls.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle start session
  const handleStartSession = async (classId: string) => {
    try {
      await facultyApiService.startSession({ class_id: classId });
      navigate('/faculty/session');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to start session');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0071e3]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header - Apple Style */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-semibold text-[#1d1d1f] tracking-tight">
            Your Classes
          </h1>
          <p className="text-base text-[#86868b] mt-2">
            Manage your classes, upload content, and start sessions.
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="h-12 px-6 rounded-xl">
            <Plus className="w-5 h-5 mr-2" />
            New Class
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-xl">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Search - Apple Style */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
        <Input
          placeholder="Search classes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-14 pl-14 rounded-2xl bg-[#f5f5f7] border-0 focus:bg-white text-lg"
        />
      </div>

      {/* Classes List - Apple Style */}
      {filteredClasses.length === 0 ? (
        <Card className="p-12 rounded-2xl text-center">
          <FileText className="w-16 h-16 text-[#d2d2d7] mx-auto mb-4" />
          <p className="text-lg text-[#86868b]">
            {searchTerm ? 'No classes match your search.' : 'No classes assigned yet.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredClasses.map((cls) => (
            <Card 
              key={cls.id} 
              className="p-6 lg:p-8 rounded-2xl border-0 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Class Info */}
                <div className="flex items-start gap-5 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-[#f5f5f7] flex items-center justify-center shrink-0">
                    <FileText className="w-7 h-7 text-[#86868b]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-[#1d1d1f] truncate">{cls.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
                        cls.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {cls.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-base text-[#86868b] mb-3 line-clamp-2">
                      {cls.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-6 text-base text-[#86868b]">
                      <span className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        {cls.enrollment_count || 0} students
                      </span>
                      <span className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Created: {formatDate(cls.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:shrink-0 w-full sm:w-auto">
                  <Button className="h-12 px-6 rounded-xl w-full sm:w-auto" onClick={() => handleStartSession(cls.id)}>
                    <Play className="w-5 h-5 mr-2" />
                    Start Session
                  </Button>
                  <Button variant="outline" className="h-12 px-5 rounded-xl">
                    <Upload className="w-5 h-5 mr-2" />
                    Upload PPT
                  </Button>
                  <Button variant="ghost" className="h-12 px-4 rounded-xl">
                    <Edit className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" className="h-12 px-4 rounded-xl">
                    <Archive className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacultyClassesPage;
