'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardData {
  period: string;
  summary: {
    lightBill: {
      collected: number;
      expected: number;
      percentPaid: number;
    };
    sweeping: {
      collected: number;
      payers: number;
      sweepers: number;
      share: number;
    };
    environmental: {
      collected: number;
      paid: number;
      total: number;
    };
    electricity: {
      unitsUsed: number;
      cost: number;
      avgDaily: number;
    };
  };
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  useEffect(() => {
    fetch(`/api/dashboard?period=${encodeURIComponent(period)}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, [period]);

  const formatAmount = (amount: number) => `₦${amount.toLocaleString()}`;

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900 mb-3">Hostel Bills</h1>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-2.5 rounded-lg text-sm font-medium"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            }).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Light Bill */}
        <Link href="/payments?tab=light">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-amber-500">💡</span>
                Light Bill
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Collected</p>
                  <p className="text-2xl font-bold text-gray-900">{formatAmount(data.summary.lightBill.collected)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Expected</p>
                  <p className="text-lg text-gray-600">{formatAmount(data.summary.lightBill.expected)}</p>
                </div>
              </div>
              <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${data.summary.lightBill.percentPaid}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{data.summary.lightBill.percentPaid}% paid</p>
            </CardContent>
          </Card>
        </Link>

        {/* Sweeping */}
        <Link href="/payments?tab=sweeping">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-blue-500">🧹</span>
                Sweeping
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Collected</p>
                  <p className="text-2xl font-bold text-gray-900">{formatAmount(data.summary.sweeping.collected)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Share/Sweeper</p>
                  <p className="text-2xl font-bold text-gray-900">{formatAmount(data.summary.sweeping.share)}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {data.summary.sweeping.payers} pay • {data.summary.sweeping.sweepers} sweep
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Environmental */}
        <Link href="/payments?tab=environmental">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-green-500">🌍</span>
                Environmental Bill
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Collected</p>
                  <p className="text-2xl font-bold text-gray-900">{formatAmount(data.summary.environmental.collected)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Paid</p>
                  <p className="text-lg text-gray-600">{data.summary.environmental.paid}/{data.summary.environmental.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Electricity */}
        <Link href="/electricity">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-yellow-500">⚡</span>
                Electricity Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Units Used</p>
                  <p className="text-2xl font-bold text-gray-900">{data.summary.electricity.unitsUsed}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Cost</p>
                  <p className="text-2xl font-bold text-gray-900">{formatAmount(data.summary.electricity.cost)}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Avg: {data.summary.electricity.avgDaily} units/day
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom">
        <div className="flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center py-2 px-3 text-gray-900">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1 font-medium">Home</span>
          </Link>
          <Link href="/members" className="flex flex-col items-center py-2 px-3 text-gray-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-xs mt-1">Members</span>
          </Link>
          <Link href="/payments" className="flex flex-col items-center py-2 px-3 text-gray-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs mt-1">Payments</span>
          </Link>
          <Link href="/electricity" className="flex flex-col items-center py-2 px-3 text-gray-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs mt-1">Electric</span>
          </Link>
          <Link href="/admin" className="flex flex-col items-center py-2 px-3 text-gray-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs mt-1">Admin</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
