'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import AdminGuard from '@/components/admin-guard';

interface Observation {
  id: string;
  type: 'meter_reading' | 'units_remaining' | 'current_load' | 'topup';
  value: number;
  recordedAt: string;
  notes: string | null;
  createdAt: string;
}

const TYPE_CONFIG = {
  meter_reading: { icon: '🔢', label: 'Meter Reading', unit: 'kWh (cumulative)', color: 'bg-blue-50 text-blue-700' },
  units_remaining: { icon: '⛽', label: 'Units Remaining', unit: 'kWh', color: 'bg-emerald-50 text-emerald-700' },
  current_load: { icon: '⚡', label: 'Current Load', unit: 'W or kW', color: 'bg-amber-50 text-amber-700' },
  topup: { icon: '💰', label: 'Top-Up', unit: '₦', color: 'bg-purple-50 text-purple-700' },
};

function formatDt(ts: string | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'medium' });
}

function toDatetimeLocal(ts: string | null) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function AdminElectricityContent() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [obsType, setObsType] = useState<string>('meter_reading');
  const [obsValue, setObsValue] = useState('');
  const [obsNotes, setObsNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState('');

  const loadData = () => {
    fetch('/api/electricity/observations').then(r => r.json()).then(setObservations).catch(console.error);
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obsValue) return;
    setSaving(true);
    await fetch('/api/electricity/observations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: obsType,
        value: parseFloat(obsValue),
        notes: obsNotes || null,
      }),
    });
    setObsValue('');
    setObsNotes('');
    setSaving(false);
    loadData();
  };

  const updateTime = async (id: string, time: string) => {
    await fetch(`/api/electricity/observations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recorded_at: new Date(time).toISOString() }),
    });
    setEditId(null);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this observation?')) return;
    await fetch(`/api/electricity/observations/${id}`, { method: 'DELETE' });
    loadData();
  };

  const config = TYPE_CONFIG[obsType as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.meter_reading;

  return (
    <div className="p-4 space-y-4">
      {/* Record Observation */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Record Observation</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setObsType(key); setObsValue(''); }}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                    obsType === key
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>

            {/* Value input */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">{config.label} — {config.unit}</label>
              <input
                type="number"
                step="any"
                placeholder={obsType === 'topup' ? 'Enter ₦ amount' : `Enter ${config.unit}`}
                value={obsValue}
                onChange={e => setObsValue(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2.5 rounded-lg text-sm"
                required
              />
            </div>
            <input
              placeholder="Notes (optional)"
              value={obsNotes}
              onChange={e => setObsNotes(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : `Record ${config.label}`}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Observation Feed */}
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
        Observation Log ({observations.length})
      </h3>
      {observations.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-gray-500">No observations recorded. Tap any button above to start.</CardContent></Card>
      ) : observations.map(o => {
        const cfg = TYPE_CONFIG[o.type];
        return (
          <Card key={o.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${cfg.color}`}>
                    {cfg.icon}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">{o.value} {o.type === 'topup' ? 'kWh' : cfg.unit}</p>
                    <p className="text-xs text-gray-500">{cfg.label}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(o.id)} className="text-xs text-red-500 hover:text-red-700">Del</button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {editId === o.id ? (
                  <>
                    <input
                      type="datetime-local"
                      defaultValue={toDatetimeLocal(o.recordedAt)}
                      onChange={e => updateTime(o.id, e.target.value)}
                      className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 flex-1"
                      step="1"
                    />
                    <button onClick={() => setEditId(null)} className="text-xs text-blue-600">✓</button>
                  </>
                ) : (
                  <button onClick={() => { setEditId(o.id); setEditTime(''); }} className="text-xs text-gray-500 hover:text-gray-700">
                    🕐 {formatDt(o.recordedAt)} ✏️
                  </button>
                )}
              </div>
              {o.notes && <p className="text-xs text-gray-400 mt-1">{o.notes}</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function AdminElectricity() {
  return <AdminGuard><AdminElectricityContent /></AdminGuard>;
}
