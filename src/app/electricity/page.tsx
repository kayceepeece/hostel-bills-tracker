'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface MethodResult {
  kwhPerDay: number;
  costPerDay: number;
  method: 'load_avg' | 'load_latest' | 'balance' | 'meter';
  label: string;
  confidence: 'high' | 'medium' | 'low' | 'insufficient_data';
  reason: string;
}

interface Summary {
  rate: number;
  readings: {
    meter: { value: number; time: string } | null;
    remaining: { value: number; time: string } | null;
    load: { value: number; time: string } | null;
  };
  methods: MethodResult[];
  primary: MethodResult | null;
  estimatedDaysLeft: number | null;
  dataAge: { firstTopup: string | null; trackDays: number; loadSpan: number };
  recentTopups: { count: number; totalKwh: number };
}

interface Observation {
  id: string;
  type: string;
  value: number;
  recordedAt: string;
  notes: string | null;
}

const OBS_ICONS: Record<string, string> = {
  meter_reading: '🔢',
  units_remaining: '⛽',
  current_load: '⚡',
  topup: '💰',
};

const OBS_LABELS: Record<string, string> = {
  meter_reading: 'Meter Reading',
  units_remaining: 'Remaining',
  current_load: 'Load',
  topup: 'Top-Up',
};

const CONFIDENCE_STYLES: Record<string, string> = {
  high: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-red-50 text-red-700 border-red-200',
  insufficient_data: 'bg-gray-100 text-gray-500 border-gray-200',
};

const METHOD_NAMES: Record<string, string> = {
  load_avg: 'Average Load',
  load_latest: 'Instant Load',
  balance: 'Balance',
  meter: 'Meter Reading',
};

const METHOD_ICONS: Record<string, string> = {
  load_avg: '📊',
  load_latest: '⚡',
  balance: '💰',
  meter: '🔢',
};

function fmt(ts: string | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
}

function DaysBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">No data</span>;
  if (days < 3) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">🔴 ~{days} days left</span>;
  if (days < 7) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">🟡 ~{days} days left</span>;
  return <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">🟢 ~{days} days left</span>;
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

  const p = summary?.primary;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">⚡ Electricity</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-8">
        {/* ── Live Status Card ── */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Live Status</h2>
              <DaysBadge days={summary?.estimatedDaysLeft ?? null} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">🔢 Meter Reading</span>
                <span className="font-semibold text-gray-900">
                  {summary?.readings.meter ? `${summary.readings.meter.value} kWh` : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">⛽ Units Remaining</span>
                <span className="font-semibold text-gray-900">
                  {summary?.readings.remaining ? `${summary.readings.remaining.value} kWh` : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">⚡ Current Load</span>
                <span className="font-semibold text-gray-900">
                  {summary?.readings.load != null ? `${summary.readings.load.value} kW` : '—'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Primary Consumption Card ── */}
        <Card>
          <CardContent className="p-4">
            {p && p.kwhPerDay > 0 ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-900">{METHOD_ICONS[p.method]} Consumption</h2>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${CONFIDENCE_STYLES[p.confidence]}`}>
                    {p.confidence === 'high' ? '✅ Reliable' : p.confidence === 'medium' ? '⚠️ Estimate' : '🟡 Rough'}
                  </span>
                </div>
                <div className="flex gap-3 mb-3">
                  <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{p.kwhPerDay}</p>
                    <p className="text-xs text-gray-500">kWh / day</p>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600">₦{p.costPerDay.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">/ day</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Weekly</span>
                    <span className="font-medium text-gray-900">₦{(p.costPerDay * 7).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Monthly (30d)</span>
                    <span className="font-medium text-gray-900">₦{(p.costPerDay * 30).toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">{p.label}</p>
                <p className="text-xs text-gray-400">{p.reason}</p>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-2">Not enough data yet</p>
                <p className="text-xs text-gray-400">
                  Record a ⚡ Load, 💰 Top-Up + ⛽ Remaining, or 🔢 Meter Readings
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── All Methods Card ── */}
        {summary?.methods && summary.methods.length > 1 && (
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold text-gray-900 mb-3">📐 All Estimates</h2>
              <div className="space-y-2">
                {summary.methods.map(m => {
                  const isPrimary = m === summary.primary;
                  const remainingKwh = summary?.readings?.remaining?.value ?? 0;
                  const daysLeft = m.kwhPerDay > 0 ? Math.round((remainingKwh / m.kwhPerDay) * 10) / 10 : null;
                  return (
                    <div
                      key={m.method}
                      className={`rounded-lg p-3 ${isPrimary ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 text-sm">
                            {METHOD_ICONS[m.method]} {METHOD_NAMES[m.method]}
                          </span>
                          {isPrimary && <span className="text-[10px] text-emerald-600 font-medium">✓ used</span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {daysLeft !== null && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              daysLeft < 3 ? 'bg-red-50 text-red-700' :
                              daysLeft < 7 ? 'bg-amber-50 text-amber-700' :
                              'bg-emerald-50 text-emerald-700'
                            }`}>
                              ~{daysLeft}d left
                            </span>
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${CONFIDENCE_STYLES[m.confidence]}`}>
                            {m.confidence}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-sm font-bold text-gray-900">{m.kwhPerDay} kWh/day</span>
                        <span className="text-sm font-bold text-emerald-600">₦{m.costPerDay}/day</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">{m.reason}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-gray-400 mt-3 text-center">
                {summary.dataAge.trackDays >= 7
                  ? `✅ ${summary.dataAge.trackDays} days of data — estimates are converging`
                  : `🕐 Only ${summary.dataAge.trackDays} days of data — estimates will improve with time`}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Top-Ups Card ── */}
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

        {/* ── Observation Feed ── */}
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide pt-2">Observation Log</h3>
        {observations.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-gray-500">No observations yet</CardContent></Card>
        ) : observations.slice(0, 30).map(o => (
          <Card key={o.id}>
            <CardContent className="p-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-base">{OBS_ICONS[o.type] || '📝'}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {o.value} {o.type === 'topup' ? 'kWh' : o.type === 'current_load' ? 'kW' : 'kWh'}
                  </p>
                  <p className="text-xs text-gray-500">{OBS_LABELS[o.type] || o.type} • {fmt(o.recordedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
