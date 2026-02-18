import { Card } from '../../components/ui/Card';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BookOpen, 
  Activity,
  AlertTriangle,
  Clock,
  Download,
  Calendar
} from 'lucide-react';

// Mock analytics data
const attendanceData = [
  { week: 'Week 1', rate: 82 },
  { week: 'Week 2', rate: 85 },
  { week: 'Week 3', rate: 78 },
  { week: 'Week 4', rate: 88 },
  { week: 'Week 5', rate: 91 },
  { week: 'Week 6', rate: 87 },
];

const focusData = [
  { day: 'Mon', focus: 75 },
  { day: 'Tue', focus: 82 },
  { day: 'Wed', focus: 78 },
  { day: 'Thu', focus: 85 },
  { day: 'Fri', focus: 80 },
];

const violationData = [
  { type: 'Tab Switch', count: 45 },
  { type: 'No Face Detected', count: 23 },
  { type: 'Multiple Faces', count: 12 },
  { type: 'Phone Detected', count: 8 },
  { type: 'Audio Detection', count: 5 },
];

const sessionDurationData = [
  { range: '0-30m', count: 15 },
  { range: '30-60m', count: 45 },
  { range: '60-90m', count: 80 },
  { range: '90-120m', count: 35 },
  { range: '120m+', count: 10 },
];

export const AdminAnalyticsPage = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">System-wide metrics and insights</p>
        </div>
        <div className="flex gap-3">
          <select className="px-4 py-2 border rounded-lg text-sm">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
            <option>This Semester</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average Attendance</p>
              <p className="text-2xl font-bold mt-1">87.5%</p>
              <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +5.2% from last month
              </span>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average Focus</p>
              <p className="text-2xl font-bold mt-1">78.3%</p>
              <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +3.1% from last month
              </span>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Violations</p>
              <p className="text-2xl font-bold mt-1">93</p>
              <span className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +12 from last month
              </span>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Session Duration</p>
              <p className="text-2xl font-bold mt-1">72m</p>
              <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                65 sessions this week
              </span>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Attendance Trend</h3>
          <div className="h-48">
            <div className="flex items-end justify-between h-full">
              {attendanceData.map((data, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600"
                    style={{ height: `${data.rate}%` }}
                  />
                  <span className="text-xs text-gray-500 mt-2">{data.week}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Focus Percentage */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Focus Percentage by Day</h3>
          <div className="h-48">
            <div className="flex items-end justify-between h-full">
              {focusData.map((data, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                    style={{ height: `${data.focus}%` }}
                  />
                  <span className="text-xs text-gray-500 mt-2">{data.day}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Violations Breakdown */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Violation Types</h3>
          <div className="space-y-4">
            {violationData.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-32 text-sm text-gray-600">{item.type}</div>
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${(item.count / 45) * 100}%` }}
                  />
                </div>
                <div className="w-12 text-sm font-medium text-gray-900 text-right">{item.count}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Session Duration */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Session Duration Distribution</h3>
          <div className="h-48">
            <div className="flex items-end justify-between h-full">
              {sessionDurationData.map((data, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full bg-purple-500 rounded-t transition-all duration-300 hover:bg-purple-600"
                    style={{ height: `${(data.count / 80) * 100}%` }}
                  />
                  <span className="text-xs text-gray-500 mt-2">{data.range}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
