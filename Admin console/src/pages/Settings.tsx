import React from 'react';
import { Settings as SettingsIcon, Bell, Lock, User, Globe, Database, Palette, Mail, Shield, Save } from 'lucide-react';
import { motion } from 'framer-motion';

import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardContent } from '../components/ui/Card';

const Settings: React.FC = () => {
  const settingsSections = [
    {
      id: 'account',
      title: 'Account Settings',
      icon: <User size={20} />,
      color: 'bg-blue-50 text-blue-600',
      settings: [
        { label: 'Email Address', value: 'admin@example.com', type: 'email' },
        { label: 'Full Name', value: 'Admin User', type: 'text' },
        { label: 'Phone Number', value: '+1 (555) 123-4567', type: 'tel' },
      ]
    },
    {
      id: 'security',
      title: 'Security',
      icon: <Lock size={20} />,
      color: 'bg-emerald-50 text-emerald-600',
      settings: [
        { label: 'Password', value: '••••••••', type: 'password' },
        { label: 'Two-Factor Authentication', value: false, type: 'toggle' },
        { label: 'Session Timeout', value: '30 minutes', type: 'select' },
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <Bell size={20} />,
      color: 'bg-purple-50 text-purple-600',
      settings: [
        { label: 'Email Notifications', value: true, type: 'toggle' },
        { label: 'Push Notifications', value: true, type: 'toggle' },
        { label: 'SMS Notifications', value: false, type: 'toggle' },
      ]
    },
    {
      id: 'system',
      title: 'System',
      icon: <Database size={20} />,
      color: 'bg-amber-50 text-amber-600',
      settings: [
        { label: 'Data Retention Period', value: '12 months', type: 'select' },
        { label: 'Automatic Backups', value: true, type: 'toggle' },
        { label: 'System Updates', value: 'Automatic', type: 'select' },
      ]
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div>
      <PageHeader
        title="System Settings"
        description="Configure system-wide settings and preferences"
        actions={
          <Button 
            variant="primary"
            size="md"
            icon={<Save size={16} />}
          >
            Save Changes
          </Button>
        }
      />

      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <div className="lg:col-span-2">
          <motion.div className="space-y-6">
            {settingsSections.map((section) => (
              <motion.div
                key={section.id}
                variants={item}
                className="bg-white rounded-xl shadow-sm border border-gray-100"
              >
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${section.color} mr-4`}>
                      {section.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">{section.title}</h3>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  {section.settings.map((setting, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        {setting.label}
                      </label>
                      {setting.type === 'toggle' ? (
                        <button
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            setting.value ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              setting.value ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      ) : setting.type === 'select' ? (
                        <select className="text-sm border-gray-300 rounded-md">
                          <option>{setting.value}</option>
                        </select>
                      ) : (
                        <div className="flex items-center">
                          <input
                            type={setting.type}
                            value={setting.value}
                            className="text-sm border-gray-300 rounded-md"
                            readOnly
                          />
                          <button className="ml-2 text-blue-600 text-sm">
                            Change
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader 
              title="Quick Actions" 
              subtitle="Frequently used settings"
            />
            <CardContent className="space-y-4">
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                  <Shield size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800">Security Check</div>
                  <div className="text-xs text-gray-500">Review security settings</div>
                </div>
              </button>
              
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3">
                  <Mail size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800">Email Settings</div>
                  <div className="text-xs text-gray-500">Configure email preferences</div>
                </div>
              </button>
              
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3">
                  <Globe size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800">Language</div>
                  <div className="text-xs text-gray-500">Change system language</div>
                </div>
              </button>
              
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-3">
                  <Palette size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800">Appearance</div>
                  <div className="text-xs text-gray-500">Customize the interface</div>
                </div>
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader 
              title="System Information" 
              subtitle="Current system status"
            />
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Version</div>
                <div className="text-sm font-medium text-gray-800">1.0.0</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">Last Updated</div>
                <div className="text-sm font-medium text-gray-800">June 15, 2023</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">Environment</div>
                <div className="text-sm font-medium text-gray-800">Production</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">Database Status</div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm font-medium text-gray-800">Connected</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;