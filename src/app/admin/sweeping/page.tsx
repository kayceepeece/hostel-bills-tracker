'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import AdminGuard from '@/components/admin-guard';

interface Member { id: string; name: string; room: string; type: string; sweepingRole: string | null; }
interface Payment { id: string; memberId: string; period: string; amount: number | null; datePaid: string | null; }

function SweepingContent() {
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [period, setPeriod] = useState(() => new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  const [sweepingAmount, setSweepingAmount] = useState(1500);
  const [toggling, setToggling] = useState<string | null>(null);

  const loadData = useCallback(() => {
    fetch('/api/members').then(r => r.json()).then(setMembers).catch(console.error);
    fetch(`/api/sweeping?period=${encodeURIComponent(period)}`).then(r => r.json()).then(setPayments).catch(console.error);
    fetch('/api/settings').then(r => r.json()).then(s => {
      if (s.sweeping_amount) setSweepingAmount(parseInt(s.sweeping_amount, 10));
    }).catch(console.error);
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  const individuals = members.filter(m => m.type === 'individual');
  const payers = individuals.filter(m => m.sweepingRole === 'pay');
  const sweepers = individuals.filter(m => m.sweepingRole === 'sweep');
  const unassigned = individuals.filter(m => !m.sweepingRole);

  const paymentMap = new Map<string, Payment>();
  payments.forEach(p => paymentMap.set(p.memberId, p));

  const togglePayer = async (memberId: string) => {
    const existing = paymentMap.get(memberId);
    setToggling(memberId);
    if (existing) {
      await fetch(`/api/sweeping/${existing.id}`, { method: 'DELETE' });
    } else {
      await fetch('/api/sweeping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, period, amount: sweepingAmount, datePaid: new Date().toISOString().split('T')[0] }),
      });
    }
    setToggling(null);
    const res = await fetch(`/api/sweeping?period=${encodeURIComponent(period)}`);
    setPayments(await res.json());
  };

  const toggleSweeper = async (memberId: string) => {
    const existing = paymentMap.get(memberId);
    setToggling(memberId);
    if (existing) {
      await fetch(`/api/sweeping/${existing.id}`, { method: 'DELETE' });
    } else {
      await fetch('/api/sweeping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, period, amount: null, datePaid: new Date().toISOString().split('T')[0] }),
      });
    }
    setToggling(null);
    const res = await fetch(`/api/sweeping?period=${encodeURIComponent(period)}`);
    setPayments(await res.json());
  };

  const switchRole = async (memberId: string, newRole: 'pay' | 'sweep') => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    setToggling(memberId);
    await fetch(`/api/members/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...member, sweepingRole: newRole }),
    });
    setToggling(null);
    loadData();
  };

  const paidCount = payers.filter(m => {
    const p = paymentMap.get(m.id);
    return p && p.amount && p.amount > 0;
  }).length;
  const sweptCount = sweepers.filter(m => paymentMap.has(m.id)).length;
  const collected = payers.reduce((sum, m) => {
    const p = paymentMap.get(m.id);
    return sum + (p && p.amount ? p.amount : 0);
  }, 0);
  const expected = payers.length * sweepingAmount;
  const share = sweepers.length > 0 ? Math.round(collected / sweepers.length) : 0;

  return (
    <div className="p-4 space-y-4">
      {/* Period selector */}
      <div className="bg-white border-b border-gray-200 -mx-4 px-4 py-3">
        <select value={period} onChange={e => setPeriod(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-2.5 rounded-lg text-sm font-medium">
          {Array.from({ length: 12 }, (_, i) => {
            const d = new Date(); d.setMonth(d.getMonth() - i);
            return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          }).map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Collected</p>
              <p className="text-2xl font-bold text-gray-900">₦{collected.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Expected</p>
              <p className="text-lg text-gray-600">₦{expected.toLocaleString()}</p>
            </div>
          </div>
          {expected > 0 && (
            <>
              <div className="bg-gray-100 rounded-full h-2 overflow-hidden mb-2">
                <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.round((collected / expected) * 100))}%` }} />
              </div>
              <p className="text-xs text-gray-500 text-center">
                {paidCount}/{payers.length} paid • {sweptCount}/{sweepers.length} swept
                {sweepers.length > 0 && ` • ₦${share.toLocaleString()}/sweeper`}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payers Section */}
      {payers.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">💰 Payers ({payers.length})</h3>
          <div className="space-y-2">
            {payers.map(m => {
              const paid = paymentMap.get(m.id) && paymentMap.get(m.id)!.amount && paymentMap.get(m.id)!.amount! > 0;
              const loading = toggling === m.id;
              return (
                <div key={m.id} className={`rounded-xl border transition-all ${paid ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'} ${loading ? 'opacity-60' : ''}`}>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-500">{m.room}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => switchRole(m.id, 'sweep')}
                          disabled={loading}
                          className="text-[11px] text-blue-600 hover:text-blue-800 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          → Sweep
                        </button>
                        <button
                          onClick={() => togglePayer(m.id)}
                          disabled={loading}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            paid ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {paid ? `✅ ₦${sweepingAmount.toLocaleString()}` : `💰 Mark Paid`}
                        </button>
                      </div>
                    </div>
                    {paid && <p className="text-[10px] text-gray-400 mt-1 text-right">Tap paid to undo</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Sweepers Section */}
      {sweepers.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide pt-2">🧹 Sweepers ({sweepers.length})</h3>
          <div className="space-y-2">
            {sweepers.map(m => {
              const swept = paymentMap.has(m.id);
              const loading = toggling === m.id;
              return (
                <div key={m.id} className={`rounded-xl border transition-all ${swept ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'} ${loading ? 'opacity-60' : ''}`}>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-500">{m.room}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => switchRole(m.id, 'pay')}
                          disabled={loading}
                          className="text-[11px] text-amber-600 hover:text-amber-800 px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 transition-colors"
                        >
                          → Pay
                        </button>
                        <button
                          onClick={() => toggleSweeper(m.id)}
                          disabled={loading}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            swept ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {swept ? '✅ Swept' : '🧹 Mark Swept'}
                        </button>
                      </div>
                    </div>
                    {swept && <p className="text-[10px] text-gray-400 mt-1 text-right">Tap swept to undo</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Unassigned */}
      {unassigned.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide pt-2">❌ Unassigned ({unassigned.length})</h3>
          <p className="text-xs text-gray-400 -mt-1">Assign a role to include them in sweeping</p>
          <div className="space-y-2">
            {unassigned.map(m => {
              const loading = toggling === m.id;
              return (
                <div key={m.id} className={`rounded-xl border bg-white border-gray-200 p-4 ${loading ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.room}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => switchRole(m.id, 'pay')}
                        disabled={loading}
                        className="text-[11px] text-amber-600 hover:text-amber-800 px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 transition-colors"
                      >
                        💰 Pay
                      </button>
                      <button
                        onClick={() => switchRole(m.id, 'sweep')}
                        disabled={loading}
                        className="text-[11px] text-blue-600 hover:text-blue-800 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        🧹 Sweep
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminSweeping() {
  return <AdminGuard><SweepingContent /></AdminGuard>;
}
