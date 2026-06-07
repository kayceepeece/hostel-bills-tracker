'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { useAdminAuth } from '@/hooks/use-admin-auth';

const PAGE_NAMES: Record<string, string> = {
  'members': 'Members',
  'light-bill': 'Light Bill',
  'sweeping': 'Sweeping',
  'environmental': 'Environmental',
  'electricity': 'Electricity',
};

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, checked, login, logout } = useAdminAuth();
  const pathname = usePathname();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const segments = pathname.split('/').filter(Boolean); // ['admin', 'members']
  const currentPage = segments.length > 1 ? PAGE_NAMES[segments[1]] || segments[1] : null;

  if (!checked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);
      const ok = await login(password);
      setLoading(false);
      if (!ok) setError('Invalid password');
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center p-4 pt-20">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Admin Login</h1>
                <p className="text-sm text-gray-500 mt-1">Enter password to access admin panel</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-lg text-sm"
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with breadcrumb */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3 flex justify-between items-center">
          <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
              <Link href="/admin" className="hover:text-gray-600">Admin</Link>
              {currentPage && (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-gray-700 font-medium">{currentPage}</span>
                </>
              )}
            </div>
            {/* Page title */}
            <h1 className="text-lg font-semibold text-gray-900">
              {currentPage || 'Admin Panel'}
            </h1>
          </div>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Logout
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
