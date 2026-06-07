'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  recentPayments: any[];
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Month Selector */}
      <div className="sticky top-0 z-10 bg-gray-900 p-4 border-b border-gray-800">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl text-lg font-medium"
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

      {/* Summary Cards */}
      <div className="p-4 space-y-4">
        {/* Light Bill */}
        <Link href="/payments?tab=light" className="block">
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">💡</span>
              <h2 className="text-lg font-semibold">Light Bill</h2>
            </div>
            <div className="flex justify-between items-end mb-3">
              <div>
                <p className="text-gray-400 text-sm">Collected</p>
                <p className="text-2xl font-bold">{formatAmount(data.summary.lightBill.collected)}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm">Expected</p>
                <p className="text-lg">{formatAmount(data.summary.lightBill.expected)}</p>
              </div>
            </div>
            <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-green-500 h-full rounded-full transition-all"
                style={{ width: `${data.summary.lightBill.percentPaid}%` }}
              />
            </div>
            <p className="text-right text-sm text-gray-400 mt-1">{data.summary.lightBill.percentPaid}% paid</p>
          </div>
        </Link>

        {/* Sweeping */}
        <Link href="/payments?tab=sweeping" className="block">
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🧹</span>
              <h2 className="text-lg font-semibold">Sweeping</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Collected</p>
                <p className="text-2xl font-bold">{formatAmount(data.summary.sweeping.collected)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Share/Sweeper</p>
                <p className="text-2xl font-bold">{formatAmount(data.summary.sweeping.share)}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-3">
              {data.summary.sweeping.payers} pay • {data.summary.sweeping.sweepers} sweep
            </p>
          </div>
        </Link>

        {/* Environmental */}
        <Link href="/payments?tab=environmental" className="block">
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🌍</span>
              <h2 className="text-lg font-semibold">Environmental Bill</h2>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-gray-400 text-sm">Collected</p>
                <p className="text-2xl font-bold">{formatAmount(data.summary.environmental.collected)}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm">Paid</p>
                <p className="text-lg">{data.summary.environmental.paid}/{data.summary.environmental.total}</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Electricity */}
        <Link href="/electricity" className="block">
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">⚡</span>
              <h2 className="text-lg font-semibold">Electricity Usage</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Units Used</p>
                <p className="text-2xl font-bold">{data.summary.electricity.unitsUsed}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Cost</p>
                <p className="text-2xl font-bold">{formatAmount(data.summary.electricity.cost)}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-3">
              Avg: {data.summary.electricity.avgDaily} units/day
            </p>
          </div>
        </Link>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-2">
        <div className="flex justify-around">
          <Link href="/" className="flex flex-col items-center py-2 text-white">
            <span className="text-xl">🏠</span>
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link href="/members" className="flex flex-col items-center py-2 text-gray-400">
            <span className="text-xl">👥</span>
            <span className="text-xs mt-1">Members</span>
          </Link>
          <Link href="/payments" className="flex flex-col items-center py-2 text-gray-400">
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
