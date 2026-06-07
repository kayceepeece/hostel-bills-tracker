'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

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

export default function PaymentsContent() {
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
    return member ? member.name : 'Unknown';
  };

  const formatAmount = (amount: number) => `₦${amount.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-gray-50 ">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900 mb-3">Payments</h1>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-2.5 rounded-lg text-sm font-medium mb-3"
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
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab === 'light' ? '💡 Light' :
                 tab === 'sweeping' ? '🧹 Sweep' : '🌍 Env'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment List */}
      <div className="p-4 space-y-3">
        {payments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No payments recorded for this period</p>
            </CardContent>
          </Card>
        ) : (
          payments.map(payment => (
            <Card key={payment.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-semibold text-gray-900">{getMemberName(payment.memberId)}</h2>
                    <p className="text-sm text-gray-500">{payment.datePaid}</p>
                  </div>
                  <p className="text-lg font-bold text-emerald-600">{formatAmount(payment.amount)}</p>
                </div>
                {payment.method && (
                  <p className="text-sm text-gray-500 mt-1">via {payment.method}</p>
                )}
                {payment.notes && (
                  <p className="text-sm text-gray-500 mt-1">{payment.notes}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

