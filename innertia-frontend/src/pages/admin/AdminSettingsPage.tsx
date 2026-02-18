import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Settings, 
  Bell, 
  Shield, 
  Database, 
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface SystemConfig {
  attendanceThreshold: number;
  violationPenalty: number;
  slideLockDefault: boolean;
  aiEnabled: boolean;
  tokenExpiry: number;
  autoLogout: number;
  maxSessionDuration: number;
  requireVerification: boolean;
}

export const AdminSettingsPage = () => {
  const [config, setConfig] = useState<SystemConfig>({
    attendanceThreshold: 75,
    violationPenalty: 5,
    slideLockDefault: true,
    aiEnabled: true,
    tokenExpiry: 60,
    autoLogout: 30,
    maxSessionDuration: 180,
    requireVerification: true
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('Settings saved successfully!');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
          <p className="text-gray-500 mt-1">Manage system-wide settings and preferences</p>
        </div>
        <Button className="flex items-center gap-2" onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Attendance Rules */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Settings className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Attendance Rules</h2>
            <p className="text-sm text-gray-500">Configure attendance thresholds and calculations</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Attendance Threshold (%)
            </label>
            <Input
              type="number"
              value={config.attendanceThreshold}
              onChange={(e) => setConfig({...config, attendanceThreshold: parseInt(e.target.value)})}
              min={0}
              max={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              Students below this threshold will be marked as absent
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Violation Penalty (points)
            </label>
            <Input
              type="number"
              value={config.violationPenalty}
              onChange={(e) => setConfig({...config, violationPenalty: parseInt(e.target.value)})}
              min={0}
              max={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              Points deducted per violation detected
            </p>
          </div>
        </div>
      </Card>

      {/* Session Controls */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Session Controls</h2>
            <p className="text-sm text-gray-500">Configure session and security settings</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Token Expiry (minutes)
            </label>
            <Input
              type="number"
              value={config.tokenExpiry}
              onChange={(e) => setConfig({...config, tokenExpiry: parseInt(e.target.value)})}
              min={15}
              max={480}
            />
            <p className="text-xs text-gray-500 mt-1">
              How long a session token remains valid
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto Logout (minutes of inactivity)
            </label>
            <Input
              type="number"
              value={config.autoLogout}
              onChange={(e) => setConfig({...config, autoLogout: parseInt(e.target.value)})}
              min={5}
              max={120}
            />
            <p className="text-xs text-gray-500 mt-1">
              Automatically log out users after inactivity
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Session Duration (minutes)
            </label>
            <Input
              type="number"
              value={config.maxSessionDuration}
              onChange={(e) => setConfig({...config, maxSessionDuration: parseInt(e.target.value)})}
              min={30}
              max={480}
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum allowed duration for a single session
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Slide Lock by Default</p>
              <p className="text-sm text-gray-500">Automatically lock student slides when session starts</p>
            </div>
            <button
              onClick={() => setConfig({...config, slideLockDefault: !config.slideLockDefault})}
              className={`w-12 h-6 rounded-full transition-colors ${
                config.slideLockDefault ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                config.slideLockDefault ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">AI Assistance Enabled</p>
              <p className="text-sm text-gray-500">Enable AI features for students during sessions</p>
            </div>
            <button
              onClick={() => setConfig({...config, aiEnabled: !config.aiEnabled})}
              className={`w-12 h-6 rounded-full transition-colors ${
                config.aiEnabled ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                config.aiEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Require Email Verification</p>
              <p className="text-sm text-gray-500">Users must verify email before accessing the system</p>
            </div>
            <button
              onClick={() => setConfig({...config, requireVerification: !config.requireVerification})}
              className={`w-12 h-6 rounded-full transition-colors ${
                config.requireVerification ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                config.requireVerification ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
      </Card>

      {/* Data Management */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <Database className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Data & Compliance</h2>
            <p className="text-sm text-gray-500">Manage data export, backup, and audit logs</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Export All Data
          </Button>
          <Button variant="outline" className="flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Download Backup
          </Button>
          <Button variant="outline" className="flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" />
            Import Data
          </Button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Danger Zone</p>
              <p className="text-sm text-yellow-700 mt-1">
                These actions are irreversible. Please proceed with caution.
              </p>
              <Button variant="outline" className="mt-3 border-red-300 text-red-600 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Session Data
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminSettingsPage;
