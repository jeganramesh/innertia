/**
 * College Settings Page
 * Configure college-level settings
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Loader2,
  Settings,
  Save,
  CheckCircle,
  Clock,
  AlertTriangle,
  Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CollegeSettings {
  attendance_threshold: number;
  max_violations: number;
  session_timeout: number;
  auto_archive_classes: boolean;
  require_approval: boolean;
}

const defaultSettings: CollegeSettings = {
  attendance_threshold: 75,
  max_violations: 5,
  session_timeout: 30,
  auto_archive_classes: true,
  require_approval: false
};

export const CollegeSettingsPage = () => {
  const [settings, setSettings] = useState<CollegeSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        const response = await fetch('/api/v1/college-admin/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setSettings({ ...defaultSettings, ...data });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('access_token');
      
      const params = new URLSearchParams();
      params.append('attendance_threshold', settings.attendance_threshold.toString());
      params.append('max_violations', settings.max_violations.toString());
      params.append('session_timeout', settings.session_timeout.toString());
      params.append('auto_archive_classes', settings.auto_archive_classes.toString());
      params.append('require_approval', settings.require_approval.toString());
      
      const response = await fetch(`/api/v1/college-admin/settings?${params}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      toast.success('Settings saved successfully');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">College Settings</h1>
        <p className="text-gray-600">Configure operational parameters for your college</p>
      </div>

      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Attendance Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Minimum Attendance Threshold
              </div>
            </label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min={0}
                max={100}
                value={settings.attendance_threshold}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  attendance_threshold: parseInt(e.target.value) || 0 
                })}
                className="w-32"
              />
              <span className="text-sm text-gray-500">% (minimum to pass)</span>
            </div>
          </div>

          {/* Max Violations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                Maximum Violations
              </div>
            </label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min={0}
                value={settings.max_violations}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  max_violations: parseInt(e.target.value) || 0 
                })}
                className="w-32"
              />
              <span className="text-sm text-gray-500">before action is taken</span>
            </div>
          </div>

          {/* Session Timeout */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Session Timeout
              </div>
            </label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min={5}
                max={120}
                value={settings.session_timeout}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  session_timeout: parseInt(e.target.value) || 30 
                })}
                className="w-32"
              />
              <span className="text-sm text-gray-500">minutes (5-120)</span>
            </div>
          </div>

          {/* Auto Archive Classes */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Auto-Archive Classes
              </label>
              <p className="text-sm text-gray-500">
                Automatically archive classes at end of academic year
              </p>
            </div>
            <button
              onClick={() => setSettings({ 
                ...settings, 
                auto_archive_classes: !settings.auto_archive_classes 
              })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.auto_archive_classes ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.auto_archive_classes ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Require Approval */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  Require Enrollment Approval
                </div>
              </label>
              <p className="text-sm text-gray-500">
                Students need approval to enroll in classes
              </p>
            </div>
            <button
              onClick={() => setSettings({ 
                ...settings, 
                require_approval: !settings.require_approval 
              })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.require_approval ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.require_approval ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t">
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <h3 className="font-medium text-gray-900 mb-2">About Settings</h3>
          <p className="text-sm text-gray-600">
            These settings control the operational parameters for your college. 
            Changes take effect immediately for new sessions and enrollments.
          </p>
          <ul className="mt-3 text-sm text-gray-500 space-y-1">
            <li>• Attendance threshold affects pass/fail calculations</li>
            <li>• Max violations triggers automatic notifications</li>
            <li>• Session timeout controls idle session duration</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CollegeSettingsPage;
