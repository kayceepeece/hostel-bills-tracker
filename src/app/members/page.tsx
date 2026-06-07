'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900 p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold mb-4">Members</h1>
        <input
          type="text"
          placeholder="Search by name or room..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl"
        />
      </div>

      {/* Member List */}
      <div className="p-4 space-y-3">
        {filteredMembers.map(member => (
          <div key={member.id} className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-lg font-semibold">{member.name}</h2>
                <p className="text-gray-400">{member.room} • {member.type === 'individual' ? 'Individual' : 'Shop'}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                member.sweepingRole === 'pay' ? 'bg-blue-900 text-blue-300' :
                member.sweepingRole === 'sweep' ? 'bg-green-900 text-green-300' :
                'bg-gray-700 text-gray-300'
              }`}>
                {member.sweepingRole === 'pay' ? '💰 Pay' :
                 member.sweepingRole === 'sweep' ? '🧹 Sweep' : 'N/A'}
              </span>
            </div>
            {member.phone && (
              <p className="text-sm text-gray-400">📱 {member.phone}</p>
            )}
            {member.altContact && (
              <p className="text-sm text-gray-400">💬 {member.altContact}</p>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-2">
        <div className="flex justify-around">
          <Link href="/" className="flex flex-col items-center py-2 text-gray-400">
            <span className="text-xl">🏠</span>
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link href="/members" className="flex flex-col items-center py-2 text-white">
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
