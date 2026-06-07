'use client';

import { useState, useEffect } from 'react';

const ADMIN_KEY = 'hostel_admin_auth';

export function useAdminAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem(ADMIN_KEY);
    if (auth) {
      const data = JSON.parse(auth);
      // Expire after 24 hours
      if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem(ADMIN_KEY);
      }
    }
    setChecked(true);
  }, []);

  const login = async (password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        localStorage.setItem(ADMIN_KEY, JSON.stringify({ timestamp: Date.now() }));
        setIsLoggedIn(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_KEY);
    setIsLoggedIn(false);
  };

  return { isLoggedIn, checked, login, logout };
}
