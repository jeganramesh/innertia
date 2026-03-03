import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Settings, 
  Shield, 
  Database, 
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { adminApiService, SystemSettings } from '../../services/adminApi';

export const AdminSettingsPage = () => {
  const [config, setConfig] = useState<SystemSettings>({
    attendance_threshold: 75,
    max_focus_violations: 5,
    session_timeout_minutes: 60
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const data = await adminApiService.getSettings();
        setConfig(data);
      } catch (err) {
        console.error('Failed to fetch settings:', err);
        // Use defaults on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await adminApiService.updateSettings(config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#86868b]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Page Header - Apple Style */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-semibold text-[#1d1d1f] tracking-tight">
            System Configuration
          </h1>
          <p className="text-base text-[#86868b] mt-2 max-w-xl">
            Manage system-wide settings and preferences for your institution.
          </p>
        </div>
        <Button 
          className="h-12 px-6 rounded-xl flex items-center gap-2" 
          onClick={handleSave} 
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saveSuccess ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-green-700 text-sm">Settings saved successfully!</p>
        </div>
      )}

      {/* Attendance Rules - Apple Style */}
      <div className="bg-white rounded-2xl p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#f5f5f7] flex items-center justify-center">
            <Settings className="w-6 h-6 text-[#86868b]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1d1d1f]">Attendance Rules</h2>
            <p className="text-sm text-[#86868b]">Configure attendance thresholds and calculations</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <div>
            <label className="block text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px] mb-2">
              Minimum Attendance Threshold (%)
            </label>
            <Input
              type="number"
              value={config.attendance_threshold}
              onChange={(e) => setConfig({...config, attendance_threshold: parseInt(e.target.value) || 0})}
              min={0}
              max={100}
              className="h-12 rounded-xl bg-[#f5f5f7] border-0 focus:bg-white"
            />
            <p className="text-xs text-[#86868b] mt-2">
              Students below this threshold will be marked as absent
            </p>
          </div>
          
          <div>
            <label className="block text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px] mb-2">
              Max Focus Violations
            </label>
            <Input
              type="number"
              value={config.max_focus_violations}
              onChange={(e) => setConfig({...config, max_focus_violations: parseInt(e.target.value) || 1})}
              min={1}
              max={50}
              className="h-12 rounded-xl bg-[#f5f5f7] border-0 focus:bg-white"
            />
            <p className="text-xs text-[#86868b] mt-2">
              Maximum violations before session is terminated
            </p>
          </div>
        </div>
      </div>

      {/* Session Controls - Apple Style */}
      <div className="bg-white rounded-2xl p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#f5f5f7] flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#86868b]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1d1d1f]">Session Controls</h2>
            <p className="text-sm text-[#86868b]">Configure session and security settings</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <div>
            <label className="block text-[13px] font-medium text-[#86868b] uppercase tracking-[0.5px] mb-2">
              Session Timeout (minutes)
            </label>
            <Input
              type="number"
              value={config.session_timeout_minutes}
              onChange={(e) => setConfig({...config, session_timeout_minutes: parseInt(e.target.value) || 15})}
              min={15}
              max={480}
              className="h-12 rounded-xl bg-[#f5f5f7] border-0 focus:bg-white"
            />
            <p className="text-xs text-[#86868b] mt-2">
              How long a session remains active without activity
            </p>
          </div>
        </div>
      </div>

      {/* Data Management - Apple Style */}
      <div className="bg-white rounded-2xl p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#f5f5f7] flex items-center justify-center">
            <Database className="w-6 h-6 text-[#86868b]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1d1d1f]">Data & Compliance</h2>
            <p className="text-sm text-[#86868b]">Manage data export, backup, and audit logs</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-12 rounded-xl flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Export All Data
          </Button>
          <Button variant="outline" className="h-12 rounded-xl flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Download Backup
          </Button>
          <Button variant="outline" className="h-12 rounded-xl flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" />
            Import Data
          </Button>
        </div>

        <div className="mt-6 p-5 bg-[#fff9f9] border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-[#1d1d1f]">Danger Zone</p>
              <p className="text-sm text-[#86868b] mt-1">
                These actions are irreversible. Please proceed with caution.
              </p>
              <Button variant="outline" className="mt-4 h-10 px-4 rounded-xl border-red-300 text-red-600 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Session Data
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
