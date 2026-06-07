'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ElectricityReading {
  id: string;
  date: string;
  meterReading: number;
  unitsUsed: number;
  bought: number;
  remaining: number;
  notes: string | null;
}

export default function Electricity() {
  const [readings, setReadings] = useState<ElectricityReading[]>([]);
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  useEffect(() => {
    const date = new Date(period + ' 1');
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    fetch(`/api/electricity?month=${month}&year=${year}`)
      .then(res => res.json())
      .then(setReadings)
      .catch(console.error);
  }, [period]);

  const totalUnits = readings.reduce((sum, r) => sum + r.unitsUsed, 0);
  const totalCost = readings.reduce((sum, r) => sum + r.bought, 0);
  const avgDaily = readings.length > 0 ? Math.round(totalUnits / readings.length) : 0;

  const formatAmount = (amount: number) => `₦${amount.toLocaleString()}`;

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

      {/* Summary Card */}
      <div className="p-4">
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">⚡</span>
            <h2 className="text-lg font-semibold">Monthly Summary</h2>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-gray-400 text-sm">Units Used</p>
              <p className="text-2xl font-bold">{totalUnits}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Cost</p>
              <p className="text-2xl font-bold">{formatAmount(totalCost)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Avg/Day</p>
              <p className="text-2xl font-bold">{avgDaily}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Readings List */}
      <div className="px-4 space-y-3">
        <h3 className="text-lg font-semibold mb-3">Daily Readings</h3>
        {readings.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No readings recorded for this period
          </div>
        ) : (
          readings.map(reading => (
            <div key={reading.id} className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-gray-400 text-sm">{reading.date}</p>
                  <p className="text-lg font-semibold">Reading: {reading.meterReading.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold">{reading.unitsUsed} units</p>
                  <p className="text-gray-400 text-sm">{formatAmount(reading.bought)}</p>
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>Remaining: {reading.remaining} units</span>
                {reading.notes && <span>{reading.notes}</span>}
              </div>
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
          <Link href="/payments" className="flex flex-col items-center py-2 text-gray-400">
            <span className="text-xl">💰</span>
            <span className="text-xs mt-1">Payments</span>
          </Link>
          <Link href="/electricity" className="flex flex-col items-center py-2 text-white">
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
