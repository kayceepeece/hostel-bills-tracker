'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Payment {
  id: string;
  memberId: string;
  period: string;
  amount: number;
  datePaid: string;
  method?: string;
  notes?: string;
}

interface Member {
  id: string;
  name: string;
  room: string;
}

export default function Payments() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'light');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  useEffect(() => {
    fetch('/api/members').then(res => res.json()).then(setMembers);
  }, []);

  useEffect(() => {
    const endpoint = activeTab === 'light' ? 'light-bill' : activeTab;
    fetch(`/api/${endpoint}?period=${encodeURIComponent(period)}`)
      .then(res => res.json())
      .then(setPayments)
      .catch(console.error);
  }, [activeTab, period]);

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member ? `${member.name} (${member.room})` : 'Unknown';
  };

  const formatAmount = (amount: number) => `₦${amount.toLocaleString()}`;

  return (
    <div className="min-h-screen pb-20">
      {/* Month Selector */}
      <div className="sticky top-0 z-10 bg-gray-900 p-4 border-b border-gray-800">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl text-lg font-medium mb-4"
        >
          {Array.from({ length: 12 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          }).map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {/* Sub-tabs */}
        <div className="flex gap-2">
          {['light', 'sweeping', 'environmental'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium ${
                activeTab === tab
                  ? 'bg-white text-gray-900'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              {tab === 'light' ? '💡 Light' :
               tab === 'sweeping' ? '🧹 Sweep' : '🌍 Env'}
            </button>
          ))}
        </div>
      </div>

      {/* Payment List */}
      <div className="p-4 space-y-3">
        {payments.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No payments recorded for this period
          </div>
        ) : (
          payments.map(payment => (
            <div key={payment.id} className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-lg font-semibold">{getMemberName(payment.memberId)}</h2>
                  <p className="text-gray-400 text-sm">{payment.datePaid}</p>
                </div>
                <p className="text-xl font-bold text-green-400">{formatAmount(payment.amount)}</p>
              </div>
              {payment.method && (
                <p className="text-sm text-gray-400">via {payment.method}</p>
              )}
              {payment.notes && (
                <p className="text-sm text-gray-400 mt-1">{payment.notes}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-2">
        <div className="flex justify-around">
          <Link href="/" className="flex flex-col items-center py-2 text-gray-400">
            <span className="text-xl">🏠</span>
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link href="/members" className="flex flex-col items-center py-2 text-gray-400">
            <span className="text-xl">👥</span>
            <span className="text-xs mt-1">Members</span>
          </Link>
          <Link href="/payments" className="flex flex-col items-center py-2 text-white">
            <span className="text-xl">💰</span>
            <span className="text-xs mt-1">Payments</span>
          </Link>
          <Link href="/electricity" className="flex flex-col items-center py-2 text-gray-400">
            <span className="text-xl">⚡</span>
            <span className="text-xs mt-1">Electric</span>
          </Link>
          <Link href="/admin" className="flex flex-col items-center py-2 text-gray-400">
            <span className="text-xl">🔧</span>
            <span className="text-xs mt-1">Admin</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
