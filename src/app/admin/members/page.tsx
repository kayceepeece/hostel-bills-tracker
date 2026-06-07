'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import AdminGuard from '@/components/admin-guard';

interface Member {
  id: string;
  name: string;
  room: string;
  type: string;
  sweepingRole: string | null;
  phone: string | null;
  altContact: string | null;
}

function MembersContent() {
  const [members, setMembers] = useState<Member[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', room: '', type: 'individual', sweepingRole: '', phone: '', altContact: '' });
  const [loading, setLoading] = useState(false);

  const loadMembers = () => {
    fetch('/api/members').then(r => r.json()).then(setMembers).catch(console.error);
  };

  useEffect(() => { loadMembers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/members/${editing}` : '/api/members';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, sweepingRole: form.sweepingRole || null }),
    });
    setForm({ name: '', room: '', type: 'individual', sweepingRole: '', phone: '', altContact: '' });
    setEditing(null);
    setLoading(false);
    loadMembers();
  };

  const handleEdit = (m: Member) => {
    setEditing(m.id);
    setForm({ name: m.name, room: m.room, type: m.type, sweepingRole: m.sweepingRole || '', phone: m.phone || '', altContact: m.altContact || '' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this member?')) return;
    await fetch(`/api/members/${id}`, { method: 'DELETE' });
    loadMembers();
  };

  return (
    <div className="p-4 space-y-4">
      {/* Add/Edit Form */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold text-gray-900 mb-3">{editing ? 'Edit Member' : 'Add Member'}</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm" required />
            <input placeholder="Room (e.g. Room 1 or Shop 1)" value={form.room} onChange={e => setForm({...form, room: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm" required />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm">
                <option value="individual">Individual</option>
                <option value="shop">Shop</option>
              </select>
              <select value={form.sweepingRole} onChange={e => setForm({...form, sweepingRole: e.target.value})} className="bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm">
                <option value="">No Role</option>
                <option value="pay">Pay</option>
                <option value="sweep">Sweep</option>
              </select>
            </div>
            <input placeholder="Phone (optional)" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm" />
            <input placeholder="Alt Contact (optional)" value={form.altContact} onChange={e => setForm({...form, altContact: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm" />
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
                {loading ? 'Saving...' : editing ? 'Update' : 'Add Member'}
              </button>
              {editing && (
                <button type="button" onClick={() => { setEditing(null); setForm({ name: '', room: '', type: 'individual', sweepingRole: '', phone: '', altContact: '' }); }} className="px-4 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Members List */}
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">All Members ({members.length})</h3>
      {members.map(m => (
        <Link key={m.id} href={`/admin/members/${m.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{m.name}</h3>
                  <p className="text-sm text-gray-500">{m.room} • {m.type === 'individual' ? 'Individual' : 'Shop'}</p>
                  {m.sweepingRole && (
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${m.sweepingRole === 'pay' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                      {m.sweepingRole === 'pay' ? '💰 Pay' : '🧹 Sweep'}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.preventDefault(); handleEdit(m); }} className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                  <button onClick={(e) => { e.preventDefault(); handleDelete(m.id); }} className="text-sm text-red-600 hover:text-red-800">Delete</button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default function AdminMembers() {
  return <AdminGuard><MembersContent /></AdminGuard>;
}
