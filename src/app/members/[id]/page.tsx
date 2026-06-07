'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

interface Member {
  id: string;
  name: string;
  room: string;
  type: string;
  sweepingRole: string | null;
  lightBillAmount: number | null;
  phone: string | null;
  altContact: string | null;
}

interface Payment {
  id: string;
  period: string;
  amount: number;
  datePaid: string | null;
  notes: string | null;
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

function StatusDot({ paid }: { paid: boolean }) {
  return paid
    ? <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
    : <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400" />;
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return null;
  const color = streak >= 6 ? 'bg-emerald-50 text-emerald-700' : streak >= 3 ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
      🔥 {streak} month{streak !== 1 ? 's' : ''}
    </span>
  );
}

export default function MemberProfile() {
  const params = useParams();
  const id = params.id as string;
  const [member, setMember] = useState<Member | null>(null);
  const [data, setData] = useState<PaymentData | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch('/api/members').then(r => r.json()).then((members: Member[]) => members.find(m => m.id === id)),
      fetch(`/api/members/${id}/payments`).then(r => r.json()),
    ]).then(([m, d]) => {
      setMember(m || null);
      setData(d);
    }).catch(console.error);
  }, [id]);

  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const formatAmount = (amount: number) => `₦${amount.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <Link href="/members" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Members
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{member.name}</h1>
              <p className="text-sm text-gray-500">{member.room} • {member.type === 'individual' ? 'Individual' : 'Shop'}</p>
            </div>
            <StreakBadge streak={data?.streak ?? 0} />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Current Month Status */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">{data?.currentPeriod} Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusDot paid={data?.currentStatus.light ?? false} />
                  <span className="text-sm font-medium text-gray-900">💡 Light Bill</span>
                </div>
                <span className="text-sm text-gray-500">{data?.currentStatus.light ? 'Paid' : 'Not paid'}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusDot paid={data?.currentStatus.sweeping ?? false} />
                  <span className="text-sm font-medium text-gray-900">🧹 Sweeping</span>
                </div>
                <span className="text-sm text-gray-500">{member.sweepingRole === 'sweep' ? 'Sweeps' : data?.currentStatus.sweeping ? 'Paid' : 'Not paid'}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusDot paid={data?.currentStatus.environmental ?? false} />
                  <span className="text-sm font-medium text-gray-900">🌍 Environmental</span>
                </div>
                <span className="text-sm text-gray-500">{data?.currentStatus.environmental ? 'Paid' : 'Not paid'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">All-Time Totals</h2>
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

        {/* Contact */}
        {(member.phone || member.altContact) && (
          <Card>
            <CardContent className="p-4">
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Contact</h2>
              {member.phone && <p className="text-sm text-gray-900">📱 {member.phone}</p>}
              {member.altContact && <p className="text-sm text-gray-900">💬 {member.altContact}</p>}
            </CardContent>
          </Card>
        )}

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
                      p.category === 'light' ? 'bg-amber-400' :
                      p.category === 'sweeping' ? 'bg-blue-400' : 'bg-green-400'
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
    </div>
  );
}
