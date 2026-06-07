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
    <div className="min-h-screen bg-gray-50 ">
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
    </div>
}

