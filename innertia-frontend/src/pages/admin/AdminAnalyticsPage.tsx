import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  TrendingUp, 
  Users, 
  Activity,
  AlertTriangle,
  Clock,
  Download,
  Calendar,
  Loader2
} from 'lucide-react';
import { adminApiService, AttendanceAnalyticsSummary } from '../../services/adminApi';

export const AdminAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<AttendanceAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const data = await adminApiService.getAttendanceAnalytics({
          start_date: startDate,
          end_date: endDate
        });
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange]);

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Page Header - Apple Style */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-semibold text-[#1d1d1f] tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-base text-[#86868b] mt-2 max-w-xl">
            Comprehensive insights into attendance patterns and session performance across your institution.
          </p>
        </div>
        <div className="flex gap-3">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-11 px-4 rounded-xl border border-[#d2d2d7] bg-white text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
          <Button className="h-11 px-5 rounded-xl flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics - Apple Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white rounded-2xl p-6 lg:p-8 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Average Attendance</p>
              <p className="text-4xl font-semibold text-[#1d1d1f] mt-2">
                {loading ? '-' : `${analytics?.average_attendance_rate || 0}%`}
              </p>
              <span className="text-xs text-green-600 flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3" />
                Across all sessions
              </span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
              <Users className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 lg:p-8 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Total Sessions</p>
              <p className="text-4xl font-semibold text-[#1d1d1f] mt-2">
                {loading ? '-' : analytics?.total_sessions || 0}
              </p>
              <span className="text-xs text-[#86868b] flex items-center gap-1 mt-2">
                <Calendar className="w-3 h-3" />
                In selected period
              </span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-[#f5f5f7] flex items-center justify-center">
              <Activity className="w-7 h-7 text-[#86868b]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 lg:p-8 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Total Violations</p>
              <p className="text-4xl font-semibold text-[#1d1d1f] mt-2">
                {loading ? '-' : analytics?.total_violations || 0}
              </p>
              <span className="text-xs text-[#86868b] flex items-center gap-1 mt-2">
                <AlertTriangle className="w-3 h-3" />
                Detected in period
              </span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 lg:p-8 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Date Range</p>
              <p className="text-4xl font-semibold text-[#1d1d1f] mt-2">{dateRange}</p>
              <span className="text-xs text-[#86868b] flex items-center gap-1 mt-2">
                <Clock className="w-3 h-3" />
                Days analyzed
              </span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-[#f5f5f7] flex items-center justify-center">
              <Calendar className="w-7 h-7 text-[#86868b]" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 - Apple Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <div className="bg-white rounded-2xl p-6 lg:p-8">
          <h3 className="text-lg font-semibold text-[#1d1d1f] mb-6">Attendance Trend</h3>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#86868b]" />
            </div>
          ) : analytics?.daily_data && analytics.daily_data.length > 0 ? (
            <div className="h-48 flex items-end justify-between gap-2">
              {analytics.daily_data.map((data, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full bg-[#0071e3] rounded-t-lg transition-all duration-300 hover:bg-[#0077ed] min-h-[4px]"
                    style={{ height: `${Math.max(data.attendance_rate, 4)}%` }}
                  />
                  <span className="text-[11px] text-[#86868b] mt-2">
                    {new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-[#86868b]">
              No data available
            </div>
          )}
        </div>

        {/* Violations Trend */}
        <div className="bg-white rounded-2xl p-6 lg:p-8">
          <h3 className="text-lg font-semibold text-[#1d1d1f] mb-6">Violations per Day</h3>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#86868b]" />
            </div>
          ) : analytics?.daily_data && analytics.daily_data.length > 0 ? (
            <div className="h-48 flex items-end justify-between gap-2">
              {analytics.daily_data.map((data, index) => {
                const maxViolations = Math.max(...analytics.daily_data.map(d => d.violation_count), 1);
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div 
                      className="w-full bg-[#86868b] rounded-t-lg transition-all duration-300 hover:bg-red-500 min-h-[4px]"
                      style={{ height: `${Math.max((data.violation_count / maxViolations) * 100, 4)}%` }}
                    />
                    <span className="text-[11px] text-[#86868b] mt-2">
                      {new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-[#86868b]">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Daily Breakdown Table - Apple Style */}
      <div className="bg-white rounded-2xl p-6 lg:p-8">
        <h3 className="text-lg font-semibold text-[#1d1d1f] mb-6">Daily Breakdown</h3>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#86868b]" />
          </div>
        ) : analytics?.daily_data && analytics.daily_data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#d2d2d7]">
                  <th className="text-left py-3 px-4 text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Date</th>
                  <th className="text-left py-3 px-4 text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Sessions</th>
                  <th className="text-left py-3 px-4 text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Attendance Rate</th>
                  <th className="text-left py-3 px-4 text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px]">Violations</th>
                </tr>
              </thead>
              <tbody>
                {analytics.daily_data.map((data, index) => (
                  <tr key={index} className="border-b border-[#f5f5f7] hover:bg-[#f5f5f7]/50">
                    <td className="py-4 px-4 text-[#1d1d1f] font-medium">
                      {new Date(data.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-4 px-4 text-[#86868b]">{data.session_count}</td>
                    <td className="py-4 px-4">
                      <span className={`font-medium ${
                        data.attendance_rate >= 90 ? 'text-green-600' :
                        data.attendance_rate >= 75 ? 'text-[#86868b]' : 'text-red-600'
                      }`}>
                        {data.attendance_rate}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[#86868b]">{data.violation_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-[#86868b]">
            No data available for the selected period
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
