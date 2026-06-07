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
    <div className="min-h-screen bg-gray-50 ">
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
    </div>
  );
}
