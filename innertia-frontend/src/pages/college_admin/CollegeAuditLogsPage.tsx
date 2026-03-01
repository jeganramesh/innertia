import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

interface AuditLog {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata_json: string | null;
  ip_address: string | null;
  created_at: string;
  performed_by: string;
  performed_by_name: string | null;
}

interface AuditLogResponse {
  items: AuditLog[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

const ACTION_LABELS: Record<string, string> = {
  'CREATE': 'Created',
  'UPDATE': 'Updated',
  'DELETE': 'Deleted',
  'LOGIN': 'Logged in',
  'LOGOUT': 'Logged out',
  'USER_CREATE': 'User Created',
  'USER_UPDATE': 'User Updated',
  'USER_DELETE': 'User Deleted',
  'CLASS_CREATE': 'Class Created',
  'CLASS_UPDATE': 'Class Updated',
  'CLASS_DELETE': 'Class Deleted',
  'ROLE_FEATURE_TOGGLE': 'Feature Toggled',
  'SETTINGS_UPDATE': 'Settings Updated',
  'ENROLLMENT_CREATE': 'Enrollment Created',
  'ENROLLMENT_DELETE': 'Enrollment Deleted',
};

export function CollegeAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const limit = 20;

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (action) params.append('action', action);
      if (targetType) params.append('target_type', targetType);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/college-admin/audit-logs?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      
      const data: AuditLogResponse = await response.json();
      setLogs(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setAction('');
    setTargetType('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    setTimeout(fetchLogs, 0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionBadgeVariant = (action: string): 'default' | 'primary' | 'success' | 'warning' | 'danger' => {
    if (action.includes('CREATE')) return 'success';
    if (action.includes('DELETE')) return 'danger';
    if (action.includes('UPDATE')) return 'warning';
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'primary';
    return 'default';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Audit Logs</h1>
          <p className="mt-2 text-lg text-gray-600">
            View all actions performed within your college
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action
                </label>
                <Input
                  placeholder="e.g., CREATE, UPDATE"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Type
                </label>
                <Input
                  placeholder="e.g., User, Class"
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Button onClick={handleSearch}>Apply Filters</Button>
              <Button variant="secondary" onClick={handleClearFilters}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              Activity Log {total > 0 && <span className="text-gray-500 font-normal">({total} total)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-gray-500">
                <div className="animate-pulse">Loading...</div>
              </div>
            ) : error ? (
              <div className="py-12 text-center text-red-500">
                {error}
              </div>
            ) : logs.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                No audit logs found
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Timestamp</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Action</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Target</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Performed By</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {formatDate(log.created_at)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={getActionBadgeVariant(log.action)}>
                              {ACTION_LABELS[log.action] || log.action}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {log.target_type && (
                              <span>
                                {log.target_type}
                                {log.target_id && <span className="text-gray-400"> #{log.target_id.slice(0, 8)}</span>}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {log.performed_by_name || 'Unknown'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {log.ip_address || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Page {page} of {pages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={page === pages}
                        onClick={() => setPage(p => p + 1)}
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
      </div>
    </div>
  );
}
