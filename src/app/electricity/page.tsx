'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface Summary {
  rate: number;
  currentMeterReading: number | null;
  currentMeterTime: string | null;
  currentRemaining: number;
  remainingTime: string | null;
  currentLoad: number | null;
  currentLoadTime: string | null;
  consumptionRateKwhPerDay: number;
  estimatedDaysLeft: number | null;
  costPerDay: number;
  recentTopups: { count: number; totalKwh: number };
}

interface Observation {
  id: string;
  type: string;
  value: number;
  recordedAt: string;
  notes: string | null;
}

const COLORS: Record<string, string> = {
  meter_reading: '\u{1F522}',
  units_remaining: '\u{26FD}',
  current_load: '\u{26A1}',
  topup: '\u{1F4B0}',
};

const LABELS: Record<string, string> = {
  meter_reading: 'Meter Reading',
  units_remaining: 'Remaining',
  current_load: 'Load',
  topup: 'Top-Up',
};

function StatusBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">No data</span>;
  if (days < 3) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">🔴 ~{days} days left</span>;
  if (days < 7) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">🟡 ~{days} days left</span>;
  return <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">🟢 ~{days} days left</span>;
}

function fmt(ts: string | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function ElectricityPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/electricity/summary').then(r => r.json()),
      fetch('/api/electricity/observations').then(r => r.json()),
    ]).then(([s, o]) => {
      setSummary(s);
      setObservations(o);
    }).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">⚡ Electricity</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Live Status</h2>
              <StatusBadge days={summary?.estimatedDaysLeft ?? null} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">🔢 Meter Reading</span>
                <span className="font-semibold text-gray-900">{summary?.currentMeterReading ?? '—'} kWh</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">⛽ Units Remaining</span>
                <span className="font-semibold text-gray-900">{summary?.currentRemaining ?? 0} kWh</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">⚡ Current Load</span>
                <span className="font-semibold text-gray-900">
                  {summary && summary.currentLoad !== null ? `${summary.currentLoad} kW` : '—'}
                </span>
              </div>
            </div>
            {summary?.currentMeterTime && (
              <p className="text-xs text-gray-400 mt-2">Last reading: {fmt(summary.currentMeterTime)}</p>
            )}
          </CardContent>
        </Card>

        {/* Consumption Card */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Consumption</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Rate</span>
                <span className="font-semibold text-gray-900">{summary?.consumptionRateKwhPerDay ?? 0} kWh/day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Cost</span>
                <span className="font-semibold text-gray-900">₦{summary?.costPerDay ?? 0}/day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Rate</span>
                <span className="font-semibold text-gray-900">₦{summary?.rate ?? 0}/kWh</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top-ups Card */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Top-Ups (30 days)</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Purchases</p>
                <p className="text-lg font-bold text-gray-900">{summary?.recentTopups.count ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total kWh</p>
                <p className="text-lg font-bold text-gray-900">{summary?.recentTopups.totalKwh ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observation Feed */}
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Observation Log</h3>
        {observations.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-gray-500">No observations yet</CardContent></Card>
        ) : observations.slice(0, 20).map(o => (
          <Card key={o.id}>
            <CardContent className="p-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-base">{COLORS[o.type] || '📝'}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{o.value} {o.type === 'topup' ? 'kWh' : o.type === 'current_load' ? 'kW' : 'kWh'}</p>
                  <p className="text-xs text-gray-500">{LABELS[o.type] || o.type} • {fmt(o.recordedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
