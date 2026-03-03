/**
 * IP Restrictions Configuration Panel
 * 
 * Configure IP-based access control for exams.
 * Toggle on/off, manage allowed/blocked IPs and ranges.
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { examDesktopApiService, IPRestrictionConfig } from '../api/examDesktopApi';
import {
  Shield,
  Plus,
  Trash2,
  Globe,
  AlertCircle,
  CheckCircle,
  XCircle,
  Save
} from 'lucide-react';

interface IPRestrictionsPanelProps {
  examId: string;
}

export const IPRestrictionsPanel: React.FC<IPRestrictionsPanelProps> = ({ examId }) => {
  const [config, setConfig] = useState<IPRestrictionConfig>({
    enabled: false,
    allowed_ips: [],
    allowed_ranges: [],
    blocked_ips: [],
    allow_localhost: true,
    check_x_forwarded_for: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Input fields
  const [newAllowedIP, setNewAllowedIP] = useState('');
  const [newAllowedRange, setNewAllowedRange] = useState('');
  const [newBlockedIP, setNewBlockedIP] = useState('');

  useEffect(() => {
    fetchConfig();
  }, [examId]);

  const fetchConfig = async () => {
    try {
      const exam = await examDesktopApiService.getExam(examId);
      if (exam.ip_restrictions) {
        setConfig(exam.ip_restrictions);
      }
    } catch (error) {
      console.error('Failed to fetch IP config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await examDesktopApiService.updateIPRestrictions(examId, config);
      alert('IP restrictions saved successfully');
    } catch (error) {
      alert('Failed to save IP restrictions');
    } finally {
      setSaving(false);
    }
  };

  const addAllowedIP = () => {
    if (!newAllowedIP || config.allowed_ips.includes(newAllowedIP)) return;
    if (!isValidIP(newAllowedIP)) {
      alert('Invalid IP address');
      return;
    }
    setConfig({
      ...config,
      allowed_ips: [...config.allowed_ips, newAllowedIP]
    });
    setNewAllowedIP('');
  };

  const removeAllowedIP = (ip: string) => {
    setConfig({
      ...config,
      allowed_ips: config.allowed_ips.filter(i => i !== ip)
    });
  };

  const addAllowedRange = () => {
    if (!newAllowedRange || config.allowed_ranges.includes(newAllowedRange)) return;
    if (!isValidCIDR(newAllowedRange)) {
      alert('Invalid CIDR range (e.g., 192.168.1.0/24)');
      return;
    }
    setConfig({
      ...config,
      allowed_ranges: [...config.allowed_ranges, newAllowedRange]
    });
    setNewAllowedRange('');
  };

  const removeAllowedRange = (range: string) => {
    setConfig({
      ...config,
      allowed_ranges: config.allowed_ranges.filter(r => r !== range)
    });
  };

  const addBlockedIP = () => {
    if (!newBlockedIP || config.blocked_ips.includes(newBlockedIP)) return;
    if (!isValidIP(newBlockedIP)) {
      alert('Invalid IP address');
      return;
    }
    setConfig({
      ...config,
      blocked_ips: [...config.blocked_ips, newBlockedIP]
    });
    setNewBlockedIP('');
  };

  const removeBlockedIP = (ip: string) => {
    setConfig({
      ...config,
      blocked_ips: config.blocked_ips.filter(i => i !== ip)
    });
  };

  const isValidIP = (ip: string): boolean => {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip);
  };

  const isValidCIDR = (cidr: string): boolean => {
    const cidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$/;
    return cidrRegex.test(cidr);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            IP Access Control
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {config.enabled ? 'Enabled' : 'Disabled'}
            </span>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Banner */}
        <div className={`p-4 rounded-lg flex items-start gap-3 ${config.enabled ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
          {config.enabled ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">IP Restrictions Enabled</p>
                <p className="text-sm text-green-600">
                  Only students from allowed IPs can access the exam.
                  {config.allow_localhost && ' Localhost access is permitted.'}
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">IP Restrictions Disabled</p>
                <p className="text-sm text-gray-600">
                  All students can access the exam from any IP address.
                </p>
              </div>
            </>
          )}
        </div>

        {config.enabled && (
          <>
            {/* Allowed IPs */}
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Allowed IP Addresses
              </h3>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., 192.168.1.100"
                  value={newAllowedIP}
                  onChange={(e) => setNewAllowedIP(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addAllowedIP()}
                />
                <Button onClick={addAllowedIP} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {config.allowed_ips.length === 0 ? (
                  <p className="text-sm text-gray-400">No specific IPs allowed (use ranges below)</p>
                ) : (
                  config.allowed_ips.map((ip) => (
                    <Badge key={ip} variant="secondary" className="flex items-center gap-1">
                      {ip}
                      <button
                        onClick={() => removeAllowedIP(ip)}
                        className="ml-1 hover:text-red-500"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {/* Allowed Ranges */}
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Allowed IP Ranges (CIDR)
              </h3>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., 192.168.1.0/24"
                  value={newAllowedRange}
                  onChange={(e) => setNewAllowedRange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addAllowedRange()}
                />
                <Button onClick={addAllowedRange} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Use CIDR notation (e.g., 192.168.1.0/24 for 192.168.1.x range)
              </p>
              <div className="flex flex-wrap gap-2">
                {config.allowed_ranges.length === 0 ? (
                  <p className="text-sm text-gray-400">No ranges configured</p>
                ) : (
                  config.allowed_ranges.map((range) => (
                    <Badge key={range} variant="secondary" className="flex items-center gap-1">
                      {range}
                      <button
                        onClick={() => removeAllowedRange(range)}
                        className="ml-1 hover:text-red-500"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {/* Blocked IPs */}
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2 text-red-600">
                <XCircle className="w-4 h-4" />
                Blocked IP Addresses
              </h3>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., 192.168.1.200"
                  value={newBlockedIP}
                  onChange={(e) => setNewBlockedIP(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addBlockedIP()}
                />
                <Button onClick={addBlockedIP} size="sm" variant="destructive">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {config.blocked_ips.length === 0 ? (
                  <p className="text-sm text-gray-400">No IPs blocked</p>
                ) : (
                  config.blocked_ips.map((ip) => (
                    <Badge key={ip} variant="destructive" className="flex items-center gap-1">
                      {ip}
                      <button
                        onClick={() => removeBlockedIP(ip)}
                        className="ml-1 hover:text-white"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-medium">Additional Options</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Allow Localhost</p>
                  <p className="text-xs text-gray-500">Permit access from 127.0.0.1</p>
                </div>
                <Switch
                  checked={config.allow_localhost}
                  onCheckedChange={(checked) => setConfig({ ...config, allow_localhost: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Check X-Forwarded-For</p>
                  <p className="text-xs text-gray-500">Useful when behind proxy/load balancer</p>
                </div>
                <Switch
                  checked={config.check_x_forwarded_for}
                  onCheckedChange={(checked) => setConfig({ ...config, check_x_forwarded_for: checked })}
                />
              </div>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="pt-4 border-t flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save IP Restrictions'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default IPRestrictionsPanel;
