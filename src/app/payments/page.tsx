'use client';

import { Suspense } from 'react';
import PaymentsContent from './PaymentsContent';

export default function Payments() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    }>
      <PaymentsContent />
    </Suspense>
  );
}
