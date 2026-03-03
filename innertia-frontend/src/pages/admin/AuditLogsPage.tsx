import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Calendar,
  User,
  Activity
} from 'lucide-react';
import { adminApiService, AuditLogResponse } from '../../services/adminApi';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        page_size: pageSize,
        action: actionFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };
      const response = await adminApiService.getAuditLogs(params);
      setLogs(response.logs);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, actionFilter, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const getActionBadge = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADD')) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Created</span>;
    }
    if (action.includes('UPDATE') || action.includes('EDIT') || action.includes('PATCH')) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Updated</span>;
    }
    if (action.includes('DELETE') || action.includes('REMOVE')) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Deleted</span>;
    }
    if (action.includes('LOGIN') || action.includes('AUTH')) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Auth</span>;
    }
    if (action.includes('VIOLATION')) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Violation</span>;
    }
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#f5f5f7] text-[#86868b]">{action}</span>;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Page Header - Apple Style */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-semibold text-[#1d1d1f] tracking-tight">
            Audit Logs
          </h1>
          <p className="text-base text-[#86868b] mt-2 max-w-xl">
            Track all system activities and administrative actions across the platform.
          </p>
        </div>
      </div>

      {/* Filters - Apple Style */}
      <div className="bg-white rounded-2xl p-4 lg:p-5">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
              <Input
                placeholder="Filter by action type..."
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="pl-12 h-12 rounded-xl bg-[#f5f5f7] border-0 focus:bg-white"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#86868b]" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-12 rounded-xl bg-[#f5f5f7] border-0 focus:bg-white w-40"
              />
            </div>
            <span className="text-[#86868b] self-center">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-12 rounded-xl bg-[#f5f5f7] border-0 focus:bg-white w-40"
            />
            <Button 
              variant="outline" 
              className="h-12 px-5 rounded-xl"
              onClick={() => {
                setActionFilter('');
                setStartDate('');
                setEndDate('');
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Audit Logs Table - Apple Style */}
      <div className="bg-white rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#86868b]" />
            <p className="text-[#86868b] mt-3">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText className="w-12 h-12 text-[#d2d2d7]" />
            <p className="text-[#86868b] mt-3">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f5f5f7]">
                <tr>
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Timestamp</th>
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Action</th>
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Admin</th>
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Target</th>
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f7]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#f5f5f7]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-[#1d1d1f]">{formatDate(log.created_at)}</p>
                        <p className="text-xs text-[#86868b]">{formatTime(log.created_at)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#86868b]" />
                        <span className="text-sm text-[#1d1d1f]">{log.performed_by}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {log.target_type && (
                          <span className="text-xs text-[#86868b] bg-[#f5f5f7] px-2 py-1 rounded">
                            {log.target_type}
                          </span>
                        )}
                        {log.target_id && (
                          <span className="text-sm text-[#1d1d1f]">#{log.target_id}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#86868b] font-mono">
                        {log.ip_address || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[#f5f5f7] flex items-center justify-between">
            <div className="text-sm text-[#86868b]">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} logs
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-10 rounded-xl"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-[#86868b] px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-10 rounded-xl"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;
