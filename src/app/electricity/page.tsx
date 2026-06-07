'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900 mb-3">Electricity Usage</h1>
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

      {/* Summary Card */}
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="text-yellow-500">⚡</span>
              Monthly Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Units Used</p>
                <p className="text-2xl font-bold text-gray-900">{totalUnits}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900">{formatAmount(totalCost)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Avg/Day</p>
                <p className="text-2xl font-bold text-gray-900">{avgDaily}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Readings List */}
      <div className="px-4 pb-4 space-y-3">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Daily Readings</h3>
        {readings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No readings recorded for this period</p>
            </CardContent>
          </Card>
        ) : (
          readings.map(reading => (
            <Card key={reading.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-500">{reading.date}</p>
                    <p className="font-semibold text-gray-900">Reading: {reading.meterReading.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">{reading.unitsUsed} units</p>
                    <p className="text-sm text-gray-500">{formatAmount(reading.bought)}</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Remaining: {reading.remaining} units</span>
                  {reading.notes && <span>{reading.notes}</span>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center py-2 px-3 text-gray-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">Home</span>
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
          <Link href="/electricity" className="flex flex-col items-center py-2 px-3 text-gray-900">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs mt-1 font-medium">Electric</span>
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
