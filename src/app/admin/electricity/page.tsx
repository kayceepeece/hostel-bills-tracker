'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import AdminGuard from '@/components/admin-guard';

interface Reading { id: string; date: string; meterReading: number; unitsUsed: number; bought: number; remaining: number; notes: string | null; }

function ElectricityContent() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [period, setPeriod] = useState(() => new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  const [form, setForm] = useState({ date: '', meterReading: '', bought: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const loadData = () => {
    const date = new Date(period + ' 1');
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    fetch(`/api/electricity?month=${month}&year=${year}`).then(r => r.json()).then(setReadings).catch(console.error);
  };

  useEffect(() => { loadData(); }, [period]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const lastReading = readings.length > 0 ? readings[readings.length - 1] : null;
    const prevRemaining = lastReading ? lastReading.remaining : 0;
    const meterReading = parseInt(form.meterReading);
    const bought = parseInt(form.bought);
    const unitsUsed = lastReading ? meterReading - lastReading.meterReading : 0;
    const remaining = prevRemaining + bought - unitsUsed;

    await fetch('/api/electricity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: form.date, meterReading, unitsUsed, bought, remaining, notes: form.notes || null }),
    });
    setForm({ date: '', meterReading: '', bought: '', notes: '' });
    setLoading(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this reading?')) return;
    await fetch(`/api/electricity/${id}`, { method: 'DELETE' });
    loadData();
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white border-b border-gray-200 -mx-4 px-4 py-3">
        <select value={period} onChange={e => setPeriod(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-2.5 rounded-lg text-sm font-medium">
          {Array.from({ length: 12 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - i); return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); }).map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Add Daily Reading</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm" required />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Meter Reading" value={form.meterReading} onChange={e => setForm({...form, meterReading: e.target.value})} className="bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm" required />
              <input type="number" placeholder="Units Bought" value={form.bought} onChange={e => setForm({...form, bought: e.target.value})} className="bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm" required />
            </div>
            <input placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm" />
            <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
              {loading ? 'Saving...' : 'Add Reading'}
            </button>
          </form>
        </CardContent>
      </Card>

      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Readings ({readings.length})</h3>
      {readings.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-gray-500">No readings for this period</CardContent></Card>
      ) : readings.map(r => (
        <Card key={r.id}>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-900">Meter: {r.meterReading.toLocaleString()}</p>
              <p className="text-sm text-gray-500">{r.unitsUsed} units used • ₦{r.bought.toLocaleString()} bought • {r.remaining} remaining</p>
              <p className="text-xs text-gray-400">{r.date}{r.notes ? ` • ${r.notes}` : ''}</p>
            </div>
            <button onClick={() => handleDelete(r.id)} className="text-sm text-red-600 hover:text-red-800">Delete</button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminElectricity() {
  return <AdminGuard><ElectricityContent /></AdminGuard>;
}
