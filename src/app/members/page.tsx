'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

interface Member {
  id: string;
  name: string;
  room: string;
  type: string;
  sweepingRole: string | null;
  phone: string | null;
  altContact: string | null;
}

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/members')
      .then(res => res.json())
      .then(setMembers)
      .catch(console.error);
  }, []);

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.room.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900 mb-3">Members</h1>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 pl-10 pr-4 py-2.5 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Member List */}
      <div className="p-4 space-y-3">
        {filteredMembers.map(member => (
          <Card key={member.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold text-gray-900">{member.name}</h2>
                  <p className="text-sm text-gray-500">{member.room} • {member.type === 'individual' ? 'Individual' : 'Shop'}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  member.sweepingRole === 'pay' ? 'bg-blue-50 text-blue-700' :
                  member.sweepingRole === 'sweep' ? 'bg-green-50 text-green-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {member.sweepingRole === 'pay' ? '💰 Pay' :
                   member.sweepingRole === 'sweep' ? '🧹 Sweep' : 'N/A'}
                </span>
              </div>
              {member.phone && (
                <p className="text-sm text-gray-500 mt-2">📱 {member.phone}</p>
              )}
              {member.altContact && (
                <p className="text-sm text-gray-500">💬 {member.altContact}</p>
              )}
            </CardContent>
          </Card>
        ))}
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
          <Link href="/members" className="flex flex-col items-center py-2 px-3 text-gray-900">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-xs mt-1 font-medium">Members</span>
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
