'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface Summary {
  rate: number;
  currentRemaining: number;
  lastReadingTime: string | null;
  consumptionRateKwhPerDay: number;
  estimatedDaysLeft: number | null;
  costPerDay: number;
  recentTopups: { count: number; totalUnits: number; totalNaira: number };
  totalReadings: number;
}

interface Topup {
  id: string;
  amountNaira: number;
  unitsKwh: number;
  recordedAt: string;
}

interface Reading {
  id: string;
  meterReading: number | null;
  readingTime: string | null;
  unitsRemaining: number | null;
  remainingTime: string | null;
}

function formatTs(ts: string | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
}

function StatusBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">No data</span>;
  if (days < 3) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">🔴 Low — {days} days left</span>;
  if (days < 7) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">🟡 {days} days left</span>;
  return <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">🟢 {days} days left</span>;
}

export default function ElectricityPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [topups, setTopups] = useState<Topup[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/electricity/summary').then(r => r.json()),
      fetch('/api/electricity/topups').then(r => r.json()),
      fetch('/api/electricity/readings').then(r => r.json()),
    ]).then(([s, t, r]) => {
      setSummary(s);
      setTopups(t);
      setReadings(r);
    }).catch(console.error);
  }, []);

  const formatAmount = (amount: number) => `₦${amount.toLocaleString()}`;

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
              <h2 className="font-semibold text-gray-900">Current Status</h2>
              <StatusBadge days={summary?.estimatedDaysLeft ?? null} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Units Remaining</p>
                <p className="text-2xl font-bold text-gray-900">{summary?.currentRemaining ?? 0} kWh</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Rate</p>
                <p className="text-2xl font-bold text-gray-900">₦{summary?.rate ?? 0}/kWh</p>
              </div>
            </div>
            {summary?.lastReadingTime && (
              <p className="text-xs text-gray-400 mt-2">Last reading: {formatTs(summary.lastReadingTime)}</p>
            )}
          </CardContent>
        </Card>

        {/* Consumption Card */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Consumption</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Usage Rate</p>
                <p className="text-lg font-bold text-gray-900">{summary?.consumptionRateKwhPerDay ?? 0} kWh/day</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Cost/Day</p>
                <p className="text-lg font-bold text-gray-900">{formatAmount(summary?.costPerDay ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top-Up Summary */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Recent Top-Ups (30 days)</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Purchases</p>
                <p className="text-lg font-bold text-gray-900">{summary?.recentTopups.count ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Units</p>
                <p className="text-lg font-bold text-gray-900">{summary?.recentTopups.totalUnits ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Spent</p>
                <p className="text-lg font-bold text-gray-900">{formatAmount(summary?.recentTopups.totalNaira ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Top-Ups */}
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Top-Up History</h3>
        {topups.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-gray-500">No top-ups recorded</CardContent></Card>
        ) : topups.slice(0, 10).map(t => (
          <Card key={t.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">₦{t.amountNaira.toLocaleString()} → {t.unitsKwh} kWh</p>
                <p className="text-xs text-gray-500">{formatTs(t.recordedAt)}</p>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Recent Readings */}
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Meter Observations</h3>
        {readings.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-gray-500">No meter observations recorded</CardContent></Card>
        ) : readings.slice(0, 10).map(r => (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Meter Reading</p>
                  <p className="font-medium text-gray-900">{r.meterReading !== null ? `${r.meterReading} kWh` : '—'}</p>
                  <p className="text-[10px] text-gray-400">{formatTs(r.readingTime)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Remaining</p>
                  <p className="font-medium text-gray-900">{r.unitsRemaining !== null ? `${r.unitsRemaining} kWh` : '—'}</p>
                  <p className="text-[10px] text-gray-400">{formatTs(r.remainingTime)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
