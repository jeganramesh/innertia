/**
 * College Reports Page
 * Generate and export reports (feature-gated)
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '../../components/ui/Table';
import { 
  Loader2,
  Download,
  FileText,
  Calendar,
  Filter,
  AlertCircle,
  BarChart3,
  Users,
  CheckCircle
} from 'lucide-react';

interface AttendanceReportItem {
  session_id: string;
  class_name: string;
  faculty_name: string;
  date: string;
  time: string;
  enrolled: number;
  attended: number;
  rate: number;
}

interface ReportSummary {
  total_sessions: number;
  total_enrolled: number;
  total_attended: number;
  overall_attendance_rate: number;
}

interface ClassItem {
  id: string;
  name: string;
}

interface FacultyItem {
  id: string;
  full_name: string;
}

export const CollegeReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [hasFeature, setHasFeature] = useState(true);
  const [featureError, setFeatureError] = useState<string | null>(null);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  
  // Data
  const [reportData, setReportData] = useState<AttendanceReportItem[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [faculty, setFaculty] = useState<FacultyItem[]>([]);

  // Check feature access
  useEffect(() => {
    const checkFeature = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('/api/v1/college-admin/features', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          const advancedReports = data.items?.find((f: any) => f.feature_key === 'advanced_reports');
          const collegeAnalytics = data.items?.find((f: any) => f.feature_key === 'college_analytics');
          
          if (!advancedReports?.is_enabled && !collegeAnalytics?.is_enabled) {
            setHasFeature(false);
            setFeatureError('Advanced reports feature is not enabled for your college');
          }
        }
      } catch (error) {
        console.error('Error checking feature:', error);
      }
    };
    
    checkFeature();
  }, []);

  // Fetch classes and faculty for filters
  useEffect(() => {
    const fetchOptions = async () => {
      const token = localStorage.getItem('access_token');
      
      const [classesRes, facultyRes] = await Promise.all([
        fetch('/api/v1/college-admin/classes?limit=100', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/v1/college-admin/users?role=faculty&limit=100', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (classesRes.ok) {
        const data = await classesRes.json();
        setClasses(data.items || []);
      }
      if (facultyRes.ok) {
        const data = await facultyRes.json();
        setFaculty(data.items || []);
      }
    };
    
    if (hasFeature) fetchOptions();
  }, [hasFeature]);

  const generateReport = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (classFilter) params.append('class_id', classFilter);
      if (facultyFilter) params.append('faculty_id', facultyFilter);
      
      const response = await fetch(`/api/v1/college-admin/reports/attendance?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate report');
      }
      
      const data = await response.json();
      setReportData(data.items || []);
      setSummary(data.summary);
    } catch (err: any) {
      console.error('Error generating report:', err);
      setFeatureError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, classFilter, facultyFilter]);

  const exportCSV = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (classFilter) params.append('class_id', classFilter);
      if (facultyFilter) params.append('faculty_id', facultyFilter);
      
      const response = await fetch(`/api/v1/college-admin/reports/attendance/export?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'attendance_report.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting CSV:', err);
    }
  };

  if (!hasFeature) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and export reports</p>
        </div>
        
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Feature Not Available</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {featureError || 'Advanced reports feature is not enabled for your college. Contact your platform administrator to enable this feature.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">Generate and export attendance reports</p>
      </div>

      {/* Error Message */}
      {featureError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {featureError}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
              <select
                value={facultyFilter}
                onChange={(e) => setFacultyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Faculty</option>
                {faculty.map(f => (
                  <option key={f.id} value={f.id}>{f.full_name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button onClick={generateReport} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Generate Report
            </Button>
            {reportData.length > 0 && (
              <Button variant="outline" onClick={exportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{summary.total_sessions}</p>
                  <p className="text-sm text-blue-600">Total Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-900">{summary.total_enrolled}</p>
                  <p className="text-sm text-green-600">Total Enrolled</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-purple-900">{summary.total_attended}</p>
                  <p className="text-sm text-purple-600">Total Attended</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-orange-900">{summary.overall_attendance_rate}%</p>
                  <p className="text-sm text-orange-600">Attendance Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Table */}
      {reportData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Report</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead className="text-right">Enrolled</TableHead>
                  <TableHead className="text-right">Attended</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((item) => (
                  <TableRow key={item.session_id}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.time}</TableCell>
                    <TableCell className="font-medium">{item.class_name}</TableCell>
                    <TableCell>{item.faculty_name}</TableCell>
                    <TableCell className="text-right">{item.enrolled}</TableCell>
                    <TableCell className="text-right">{item.attended}</TableCell>
                    <TableCell className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.rate >= 80 ? 'bg-green-100 text-green-800' :
                        item.rate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.rate}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {reportData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CollegeReportsPage;
