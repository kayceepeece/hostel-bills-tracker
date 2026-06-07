'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import AdminGuard from '@/components/admin-guard';

interface Member { id: string; name: string; room: string; type: string; }
interface Payment { id: string; memberId: string; period: string; amount: number; datePaid: string; notes: string | null; }

function EnvironmentalContent() {
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [period, setPeriod] = useState(() => new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  const [form, setForm] = useState({ memberId: '', amount: '', datePaid: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const loadData = () => {
    fetch('/api/members').then(r => r.json()).then(setMembers).catch(console.error);
    fetch(`/api/environmental?period=${encodeURIComponent(period)}`).then(r => r.json()).then(setPayments).catch(console.error);
  };

  useEffect(() => { loadData(); }, [period]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/environmental', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: form.memberId, period, amount: parseInt(form.amount), datePaid: form.datePaid, notes: form.notes || null }),
    });
    setForm({ memberId: '', amount: '', datePaid: '', notes: '' });
    setLoading(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payment?')) return;
    await fetch(`/api/environmental/${id}`, { method: 'DELETE' });
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
          <h2 className="font-semibold text-gray-900 mb-3">Add Payment</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <select value={form.memberId} onChange={e => setForm({...form, memberId: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm" required>
              <option value="">Select member</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.room})</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Amount (₦)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm" required />
              <input type="date" value={form.datePaid} onChange={e => setForm({...form, datePaid: e.target.value})} className="bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm" required />
            </div>
            <input placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm" />
            <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
              {loading ? 'Saving...' : 'Add Payment'}
            </button>
          </form>
        </CardContent>
      </Card>

      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Payments ({payments.length})</h3>
      {payments.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-gray-500">No payments for this period</CardContent></Card>
      ) : payments.map(p => {
        const member = members.find(m => m.id === p.memberId);
        return (
          <Card key={p.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">{member?.name || 'Unknown'}</p>
                <p className="text-sm text-gray-500">₦{p.amount.toLocaleString()} • {p.datePaid}</p>
              </div>
              <button onClick={() => handleDelete(p.id)} className="text-sm text-red-600 hover:text-red-800">Delete</button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function AdminEnvironmental() {
  return <AdminGuard><EnvironmentalContent /></AdminGuard>;
}
