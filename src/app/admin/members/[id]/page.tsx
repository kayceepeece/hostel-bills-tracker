'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import AdminGuard from '@/components/admin-guard';

interface Member {
  id: string;
  name: string;
  room: string;
  type: string;
  sweepingRole: string | null;
  lightBillAmount: number | null;
  phone: string | null;
  altContact: string | null;
  notes: string | null;
}

interface Payment {
  id: string;
  period: string;
  amount: number;
  datePaid: string | null;
  category: 'light' | 'sweeping' | 'environmental';
  categoryLabel: string;
}

interface PaymentData {
  payments: Payment[];
  streak: number;
  currentPeriod: string;
  currentStatus: { light: boolean; sweeping: boolean; environmental: boolean };
  totals: { light: number; sweeping: number; environmental: number };
  defaultAmount: number;
}

function AdminMemberContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [member, setMember] = useState<Member | null>(null);
  const [data, setData] = useState<PaymentData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '', room: '', type: 'individual', sweepingRole: '',
    lightBillAmount: '', phone: '', altContact: '', notes: '',
  });

  const loadData = () => {
    Promise.all([
      fetch('/api/members').then(r => r.json()).then((members: Member[]) => members.find(m => m.id === id)),
      fetch(`/api/members/${id}/payments`).then(r => r.json()),
    ]).then(([m, d]) => {
      if (m) {
        setMember(m);
        setForm({
          name: m.name,
          room: m.room,
          type: m.type,
          sweepingRole: m.sweepingRole || '',
          lightBillAmount: m.lightBillAmount !== null ? String(m.lightBillAmount) : '',
          phone: m.phone || '',
          altContact: m.altContact || '',
          notes: m.notes || '',
        });
      }
      setData(d);
    }).catch(console.error);
  };

  useEffect(() => { loadData(); }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sweepingRole: form.sweepingRole || null,
          lightBillAmount: form.lightBillAmount ? parseInt(form.lightBillAmount) : null,
          notes: form.notes || null,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const formatAmount = (amount: number) => `₦${amount.toLocaleString()}`;

  if (!member) {
    return <div className="p-4 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      {/* Profile + Edit Form */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Profile Settings</h2>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm" required />
              <input placeholder="Room" value={form.room} onChange={e => setForm({...form, room: e.target.value})} className="bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm">
                <option value="individual">Individual</option>
                <option value="shop">Shop</option>
              </select>
              <select value={form.sweepingRole} onChange={e => setForm({...form, sweepingRole: e.target.value})} className="bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm">
                <option value="">No Role</option>
                <option value="pay">Pay</option>
                <option value="sweep">Sweep</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">💡 Light Bill Amount (per month) — leave empty for default</label>
              <input
                type="number"
                placeholder={data?.defaultAmount ? `Default: ₦${data.defaultAmount.toLocaleString()}` : 'Default amount'}
                value={form.lightBillAmount}
                onChange={e => setForm({...form, lightBillAmount: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm" />
              <input placeholder="Alt Contact" value={form.altContact} onChange={e => setForm({...form, altContact: e.target.value})} className="bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">📝 Admin Notes (not visible to members)</label>
              <textarea
                placeholder="Internal notes about this member..."
                value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm h-20 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Profile'}
              </button>
              <button type="button" onClick={() => router.push('/admin/members')} className="px-4 text-sm text-gray-500 hover:text-gray-700">
                Back
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Status + Streak */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">
              {data?.currentPeriod} Status
            </h2>
            {data && data.streak > 0 && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                data.streak >= 6 ? 'bg-emerald-50 text-emerald-700' : data.streak >= 3 ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
              }`}>
                🔥 {data.streak} month{data.streak !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>💡 Light Bill</span>
              <span className={data?.currentStatus.light ? 'text-emerald-600 font-medium' : 'text-red-500'}>
                {data?.currentStatus.light ? 'Paid' : 'Not paid'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>🧹 Sweeping</span>
              <span className={data?.currentStatus.sweeping ? 'text-emerald-600 font-medium' : 'text-red-500'}>
                {data?.currentStatus.sweeping ? 'Paid' : member.sweepingRole === 'sweep' ? 'Sweeps' : 'Not paid'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>🌍 Environmental</span>
              <span className={data?.currentStatus.environmental ? 'text-emerald-600 font-medium' : 'text-red-500'}>
                {data?.currentStatus.environmental ? 'Paid' : 'Not paid'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold text-gray-900 mb-3">All-Time Totals</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">Light Bill</p>
              <p className="text-lg font-bold text-gray-900">{formatAmount(data?.totals.light ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Sweeping</p>
              <p className="text-lg font-bold text-gray-900">{formatAmount(data?.totals.sweeping ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Environmental</p>
              <p className="text-lg font-bold text-gray-900">{formatAmount(data?.totals.environmental ?? 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Payment History</h3>
      {!data?.payments.length ? (
        <Card><CardContent className="py-8 text-center text-gray-500">No payments recorded</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {data.payments.map(p => (
            <Card key={p.id}>
              <CardContent className="p-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    p.category === 'light' ? 'bg-amber-400' : p.category === 'sweeping' ? 'bg-blue-400' : 'bg-green-400'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.period}</p>
                    <p className="text-xs text-gray-500">{p.categoryLabel}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatAmount(p.amount)}</p>
                  {p.datePaid && <p className="text-[10px] text-gray-400">{p.datePaid}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminMemberPage() {
  return <AdminGuard><AdminMemberContent /></AdminGuard>;
}
