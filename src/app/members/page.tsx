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
    <div className="min-h-screen bg-gray-50 ">
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
          <Link key={member.id} href={`/members/${member.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
          </Link>
        ))}
      </div>
    </div>
  );
}

