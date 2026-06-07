'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import AdminGuard from '@/components/admin-guard';

interface Topup {
  id: string;
  amountNaira: number;
  unitsKwh: number;
  rateUsed: number;
  recordedAt: string;
  notes: string | null;
  createdAt: string;
}

interface Reading {
  id: string;
  meterReading: number | null;
  readingTime: string | null;
  unitsRemaining: number | null;
  remainingTime: string | null;
  notes: string | null;
  createdAt: string;
}

function formatTimestamp(ts: string | null) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'medium' });
}

function toDatetimeLocal(ts: string | null) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function AdminElectricityContent() {
  const [topups, setTopups] = useState<Topup[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [rate, setRate] = useState(73.5);

  // Top-up form
  const [topupAmount, setTopupAmount] = useState('');
  const [topupNotes, setTopupNotes] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);

  // Meter reading form
  const [meterReading, setMeterReading] = useState('');
  const [readingTime, setReadingTime] = useState('');
  const [unitsRemaining, setUnitsRemaining] = useState('');
  const [remainingTime, setRemainingTime] = useState('');
  const [readingNotes, setReadingNotes] = useState('');
  const [readingLoading, setReadingLoading] = useState(false);

  // Editing
  const [editingTopup, setEditingTopup] = useState<string | null>(null);
  const [editingReading, setEditingReading] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [tRes, rRes, sRes] = await Promise.all([
        fetch('/api/electricity/topups'),
        fetch('/api/electricity/readings'),
        fetch('/api/settings'),
      ]);
      setTopups(await tRes.json());
      setReadings(await rRes.json());
      const settings = await sRes.json();
      if (settings.electricity_rate) setRate(parseFloat(settings.electricity_rate));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadData(); }, []);

  const calculatedKwh = topupAmount ? (parseFloat(topupAmount) / rate).toFixed(2) : '—';

  // Record top-up
  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopupLoading(true);
    const now = new Date().toISOString();
    await fetch('/api/electricity/topups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount_naira: parseInt(topupAmount),
        recorded_at: now,
        notes: topupNotes || null,
      }),
    });
    setTopupAmount('');
    setTopupNotes('');
    setTopupLoading(false);
    loadData();
  };

  // Record meter observation
  const handleReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meterReading && !unitsRemaining) return;
    setReadingLoading(true);
    const now = new Date().toISOString();
    await fetch('/api/electricity/readings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meter_reading: meterReading ? parseFloat(meterReading) : undefined,
        reading_time: meterReading ? now : undefined,
        units_remaining: unitsRemaining ? parseFloat(unitsRemaining) : undefined,
        remaining_time: unitsRemaining ? now : undefined,
        notes: readingNotes || null,
      }),
    });
    setMeterReading('');
    setUnitsRemaining('');
    setReadingNotes('');
    setReadingLoading(false);
    loadData();
  };

  // Update timestamp on a reading
  const updateReadingTime = async (id: string, field: 'reading_time' | 'remaining_time', value: string) => {
    await fetch(`/api/electricity/readings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: new Date(value).toISOString() }),
    });
    loadData();
  };

  // Update timestamp on a top-up
  const updateTopupTime = async (id: string, value: string) => {
    await fetch(`/api/electricity/topups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recorded_at: new Date(value).toISOString() }),
    });
    loadData();
  };

  const handleDeleteTopup = async (id: string) => {
    if (!confirm('Delete this top-up?')) return;
    await fetch(`/api/electricity/topups/${id}`, { method: 'DELETE' });
    loadData();
  };

  const handleDeleteReading = async (id: string) => {
    if (!confirm('Delete this reading?')) return;
    await fetch(`/api/electricity/readings/${id}`, { method: 'DELETE' });
    loadData();
  };

  return (
    <div className="p-4 space-y-4">
      {/* Section A: Record Top-Up */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold text-gray-900 mb-1">⚡ Record Top-Up</h2>
          <p className="text-xs text-gray-500 mb-3">How much did you buy? Auto-calculates kWh at ₦{rate}/kWh</p>
          <form onSubmit={handleTopup} className="space-y-3">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Amount (₦)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={topupAmount}
                  onChange={e => setTopupAmount(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Calculated kWh</label>
                <div className="bg-gray-100 border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium">
                  {calculatedKwh} kWh
                </div>
              </div>
            </div>
            <input
              placeholder="Notes (optional)"
              value={topupNotes}
              onChange={e => setTopupNotes(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm"
            />
            <button
              type="submit"
              disabled={topupLoading}
              className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {topupLoading ? 'Saving...' : 'Record Top-Up'}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Section B: Record Meter Observation */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold text-gray-900 mb-1">👁 Record Meter Observation</h2>
          <p className="text-xs text-gray-500 mb-3">Two screens on the meter — record each as you see it. Timestamp auto-captures.</p>
          <form onSubmit={handleReading} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Meter Reading (kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Cumulative kWh"
                  value={meterReading}
                  onChange={e => setMeterReading(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm"
                />
                {meterReading && (
                  <p className="text-[10px] text-emerald-600 mt-1">✓ Will timestamp now</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Units Remaining (kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Remaining kWh"
                  value={unitsRemaining}
                  onChange={e => setUnitsRemaining(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm"
                />
                {unitsRemaining && (
                  <p className="text-[10px] text-emerald-600 mt-1">✓ Will timestamp now</p>
                )}
              </div>
            </div>
            <input
              placeholder="Notes (optional)"
              value={readingNotes}
              onChange={e => setReadingNotes(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm"
            />
            <button
              type="submit"
              disabled={readingLoading || (!meterReading && !unitsRemaining)}
              className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {readingLoading ? 'Saving...' : 'Record Observation'}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Top-Up History */}
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Top-Up History ({topups.length})</h3>
      {topups.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-gray-500">No top-ups recorded</CardContent></Card>
      ) : topups.map(t => (
        <Card key={t.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-900">₦{t.amountNaira.toLocaleString()} → {t.unitsKwh} kWh</p>
                <p className="text-xs text-gray-500">Rate: ₦{t.rateUsed}/kWh</p>
              </div>
              <button onClick={() => handleDeleteTopup(t.id)} className="text-xs text-red-600 hover:text-red-800">Delete</button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {editingTopup === t.id ? (
                <>
                  <input
                    type="datetime-local"
                    defaultValue={toDatetimeLocal(t.recordedAt)}
                    onChange={e => updateTopupTime(t.id, e.target.value)}
                    className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1"
                    step="1"
                  />
                  <button onClick={() => setEditingTopup(null)} className="text-xs text-blue-600">Done</button>
                </>
              ) : (
                <button onClick={() => setEditingTopup(t.id)} className="text-xs text-gray-500 hover:text-gray-700">
                  🕐 {formatTimestamp(t.recordedAt)} ✏️
                </button>
              )}
            </div>
            {t.notes && <p className="text-xs text-gray-400 mt-1">{t.notes}</p>}
          </CardContent>
        </Card>
      ))}

      {/* Reading History */}
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Meter Observations ({readings.length})</h3>
      {readings.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-gray-500">No meter observations recorded</CardContent></Card>
      ) : readings.map(r => (
        <Card key={r.id}>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-2">
              {/* Meter Reading */}
              <div>
                <p className="text-xs text-gray-500 uppercase">Meter Reading</p>
                <p className="font-semibold text-gray-900">{r.meterReading !== null ? `${r.meterReading} kWh` : '—'}</p>
                {editingReading === `${r.id}-reading` ? (
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="datetime-local"
                      defaultValue={toDatetimeLocal(r.readingTime)}
                      onChange={e => updateReadingTime(r.id, 'reading_time', e.target.value)}
                      className="text-[10px] bg-gray-50 border border-gray-200 rounded px-1 py-0.5 w-full"
                      step="1"
                    />
                    <button onClick={() => setEditingReading(null)} className="text-[10px] text-blue-600">✓</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingReading(`${r.id}-reading`)}
                    className="text-[10px] text-gray-500 hover:text-gray-700"
                  >
                    🕐 {formatTimestamp(r.readingTime)} ✏️
                  </button>
                )}
              </div>
              {/* Units Remaining */}
              <div>
                <p className="text-xs text-gray-500 uppercase">Units Remaining</p>
                <p className="font-semibold text-gray-900">{r.unitsRemaining !== null ? `${r.unitsRemaining} kWh` : '—'}</p>
                {editingReading === `${r.id}-remaining` ? (
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="datetime-local"
                      defaultValue={toDatetimeLocal(r.remainingTime)}
                      onChange={e => updateReadingTime(r.id, 'remaining_time', e.target.value)}
                      className="text-[10px] bg-gray-50 border border-gray-200 rounded px-1 py-0.5 w-full"
                      step="1"
                    />
                    <button onClick={() => setEditingReading(null)} className="text-[10px] text-blue-600">✓</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingReading(`${r.id}-remaining`)}
                    className="text-[10px] text-gray-500 hover:text-gray-700"
                  >
                    🕐 {formatTimestamp(r.remainingTime)} ✏️
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              {r.notes && <p className="text-xs text-gray-400">{r.notes}</p>}
              <button onClick={() => handleDeleteReading(r.id)} className="text-xs text-red-600 hover:text-red-800">Delete</button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminElectricity() {
  return <AdminGuard><AdminElectricityContent /></AdminGuard>;
}
