'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setIsLoggedIn(true);
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Login failed');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <span className="text-4xl">🔧</span>
            <h1 className="text-2xl font-bold mt-4">Admin Login</h1>
            <p className="text-gray-400 mt-2">Enter password to access admin panel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-4 rounded-xl text-lg"
            />
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
            <button
              type="submit"
              className="w-full bg-white text-gray-900 py-4 rounded-xl text-lg font-semibold"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900 p-4 border-b border-gray-800">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <button
            onClick={() => setIsLoggedIn(false)}
            className="text-gray-400 text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="p-4 space-y-4">
        <Link href="/admin/members" className="block">
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👥</span>
              <div>
                <h2 className="text-lg font-semibold">Manage Members</h2>
                <p className="text-gray-400 text-sm">Add, edit, or remove members</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/light-bill" className="block">
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h2 className="text-lg font-semibold">Light Bill Payments</h2>
                <p className="text-gray-400 text-sm">Add or edit payments</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/sweeping" className="block">
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧹</span>
              <div>
                <h2 className="text-lg font-semibold">Sweeping Payments</h2>
                <p className="text-gray-400 text-sm">Add or edit payments</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/environmental" className="block">
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌍</span>
              <div>
                <h2 className="text-lg font-semibold">Environmental Bill</h2>
                <p className="text-gray-400 text-sm">Add or edit payments</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/electricity" className="block">
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <h2 className="text-lg font-semibold">Electricity Readings</h2>
                <p className="text-gray-400 text-sm">Add or edit daily readings</p>
              </div>
            </div>
          </div>
        </Link>
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
          <Link href="/electricity" className="flex flex-col items-center py-2 text-gray-400">
            <span className="text-xl">⚡</span>
            <span className="text-xs mt-1">Electric</span>
          </Link>
          <Link href="/admin" className="flex flex-col items-center py-2 text-white">
            <span className="text-xl">🔧</span>
            <span className="text-xs mt-1">Admin</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
