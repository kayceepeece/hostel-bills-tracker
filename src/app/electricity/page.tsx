'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface Consumption {
  kwhPerDay: number;
  costPerDay: number;
  method: 'load' | 'balance' | 'meter' | 'topup_only';
  label: string;
}

interface Summary {
  rate: number;
  currentMeterReading: number | null;
  currentMeterTime: string | null;
  currentRemaining: number;
  remainingTime: string | null;
  currentLoad: number | null;
  currentLoadTime: string | null;
  consumption: Consumption;
  estimatedDaysLeft: number | null;
  recentTopups: { count: number; totalKwh: number };
}

interface Observation {
  id: string;
  type: string;
  value: number;
  recordedAt: string;
  notes: string | null;
}

const ICONS: Record<string, string> = {
  meter_reading: '🔢',
  units_remaining: '⛽',
  current_load: '⚡',
  topup: '💰',
};

const LABELS: Record<string, string> = {
  meter_reading: 'Meter Reading',
  units_remaining: 'Remaining',
  current_load: 'Load',
  topup: 'Top-Up',
};

const METHODS: Record<string, { label: string; color: string }> = {
  load: { label: 'Live', color: 'bg-blue-50 text-blue-700' },
  balance: { label: 'Avg (Balance)', color: 'bg-purple-50 text-purple-700' },
  meter: { label: 'Avg (Meter)', color: 'bg-cyan-50 text-cyan-700' },
  topup_only: { label: 'Rough Avg', color: 'bg-amber-50 text-amber-700' },
};

function Badge({ days }: { days: number | null }) {
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

  const c = summary?.consumption;
  const meth = c ? METHODS[c.method] : null;

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
              <Badge days={summary?.estimatedDaysLeft ?? null} />
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
                  {summary?.currentLoad != null ? `${summary.currentLoad} kW` : '—'}
                </span>
              </div>
            </div>
            {summary?.currentMeterTime && (
              <p className="text-xs text-gray-400 mt-2">Last reading: {fmt(summary.currentMeterTime)}</p>
            )}
          </CardContent>
        </Card>

        {/* Consumption Card — NOW USEFUL */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Consumption</h2>
              {c && c.kwhPerDay > 0 && meth && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${meth.color}`}>{meth.label}</span>
              )}
            </div>

            {c && c.kwhPerDay > 0 ? (
              <>
                {/* Big number display */}
                <div className="flex gap-4 mb-3">
                  <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{c.kwhPerDay}</p>
                    <p className="text-xs text-gray-500">kWh / day</p>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600">₦{c.costPerDay.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">/ day</p>
                  </div>
                </div>

                {/* Weekly / monthly projection */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Weekly</span>
                    <span className="font-medium text-gray-900">₦{(c.costPerDay * 7).toLocaleString()} / {(c.kwhPerDay * 7).toFixed(0)} kWh</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Monthly (30d)</span>
                    <span className="font-medium text-gray-900">₦{(c.costPerDay * 30).toLocaleString()} / {(c.kwhPerDay * 30).toFixed(0)} kWh</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Rate</span>
                    <span className="font-medium text-gray-900">₦{summary?.rate ?? 73.5}/kWh</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{c.label}</p>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-2">Not enough data yet</p>
                <p className="text-xs text-gray-400">
                  Record a ⚡ Current Load or 💰 Top-Up + ⛽ Remaining to see consumption
                </p>
              </div>
            )}
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
                <span className="text-base">{ICONS[o.type] || '📝'}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {o.value} {o.type === 'topup' ? 'kWh' : o.type === 'current_load' ? 'kW' : 'kWh'}
                  </p>
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
