'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import AdminGuard from '@/components/admin-guard';

interface Settings {
  light_bill_show_expected: string;
  light_bill_expected_amount: string;
}

function AdminContent() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(setSettings)
      .catch(console.error);
  }, []);

  const saveSettings = async () => {
    if (!settings) return;
    setSettingsLoading(true);
    setSettingsSaved(false);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-3">
      <Link href="/admin/members">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Manage Members</h2>
                <p className="text-sm text-gray-500">Add, edit, or remove members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      <Link href="/admin/light-bill">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Light Bill Payments</h2>
                <p className="text-sm text-gray-500">Add or edit payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      <Link href="/admin/sweeping">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Sweeping Payments</h2>
                <p className="text-sm text-gray-500">Add or edit payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      <Link href="/admin/environmental">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Environmental Bill</h2>
                <p className="text-sm text-gray-500">Add or edit payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      <Link href="/admin/electricity">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Electricity Readings</h2>
                <p className="text-sm text-gray-500">Add or edit daily readings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Dashboard Settings */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold text-gray-900 mb-4">Dashboard Settings</h2>
          
          {settings ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Show &quot;Expected&quot; on Light Bill</p>
                  <p className="text-xs text-gray-500">Display expected amount and progress bar</p>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    light_bill_show_expected: settings.light_bill_show_expected === 'true' ? 'false' : 'true',
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.light_bill_show_expected === 'true' ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.light_bill_show_expected === 'true' ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {settings.light_bill_show_expected === 'true' && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Expected Amount (₦)</label>
                  <input
                    type="number"
                    value={settings.light_bill_expected_amount}
                    onChange={(e) => setSettings({
                      ...settings,
                      light_bill_expected_amount: e.target.value,
                    })}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-2.5 rounded-lg text-sm"
                    placeholder="e.g. 130000"
                  />
                </div>
              )}

              <button
                onClick={saveSettings}
                disabled={settingsLoading}
                className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {settingsLoading ? 'Saving...' : settingsSaved ? '✓ Saved!' : 'Save Settings'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Loading settings...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Admin() {
  return (
    <AdminGuard>
      <AdminContent />
    </AdminGuard>
  );
}
