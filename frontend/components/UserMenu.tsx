'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLoadingRouter } from '@/hooks/useLoadingRouter';
import { ChevronDown, LogOut, User, Settings } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/types';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const router = useLoadingRouter();
  
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/auth/login');
  }, [logout, router]);

  const navigateTo = useCallback((path: string) => {
    router.push(path);
    setIsOpen(false);
  }, [router]);

  if (!user) return null;

  // Get user initials safely
  const getUserInitials = () => {
    if (user.first_name) {
      return user.first_name[0].toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return 'م'; // Default Arabic character
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-row-reverse items-center gap-2 text-sky-900 hover:text-sky-700 transition-colors"
      >
        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-sky-200">
          <div className="w-full h-full flex items-center justify-center bg-sky-600 text-white text-sm">
            {getUserInitials()}
          </div>
        </div>
        <span className="hidden md:inline-block">
          {user.first_name || user.email || 'مستخدم'}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-sky-200 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={() => navigateTo('/dashboard')}
              className="flex items-center w-full px-4 py-2 text-sm text-sky-900 hover:bg-sky-50"
              role="menuitem"
            >
              <User className="w-4 h-4 ml-2" />
              لوحة التحكم
            </button>

            {/* رابط بوابة العارضين - للمديرين والمشرفين فقط */}
            {(user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR) && (
              <button
                onClick={() => navigateTo('/exhibitor')}
                className="flex items-center w-full px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-50 font-medium"
                role="menuitem"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 ml-2"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9,22 9,12 15,12 15,22" />
                </svg>
                  
              </button>
            )}

            {user.role === UserRole.ADMIN && (
              <>
                <button
                  onClick={() => navigateTo('/admin')}
                  className="flex items-center w-full px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-50"
                  role="menuitem"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 ml-2"
                  >
                    <path d="M12 2v4M19 5l-3 3M22 12h-4M19 19l-3-3M12 22v-4M5 19l3-3M2 12h4M5 5l3 3" />
                  </svg>
                  لوحة المسؤول
                </button>
                
                <button
                  onClick={() => navigateTo('/admin/venues')}
                  className="flex items-center w-full px-4 py-2 text-sm text-purple-700 hover:bg-purple-50"
                  role="menuitem"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 ml-2"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9,22 9,12 15,12 15,22" />
                  </svg>
                  لوحة المعارض
                </button>
              </>
            )}

            {user.role === UserRole.MODERATOR && (
              <button
                onClick={() => navigateTo('/moderator/dashboard')}
                className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                role="menuitem"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 ml-2"
                >
                  <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path d="M12 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z" />
                  <path d="M20 17.58A10 10 0 0 0 12 2v0a10 10 0 0 0-8 15.58" />
                </svg>
                لوحة المشرف
              </button>
            )}

            {user.role === UserRole.VENUE_OWNER && (
              <button
                onClick={() => navigateTo('/exhibitor')}
                className="flex items-center w-full px-4 py-2 text-sm text-purple-700 hover:bg-purple-50"
                role="menuitem"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 ml-2"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9,22 9,12 15,12 15,22" />
                </svg>
                لوحة المعرض
              </button>
            )}

            {user.role === UserRole.INVESTOR && (
              <button
                onClick={() => navigateTo('/investor/dashboard')}
                className="flex items-center w-full px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50"
                role="menuitem"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 ml-2"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                لوحة المستثمر
              </button>
            )}

            <button
              onClick={() => navigateTo('/dashboard/profile')}
              className="flex items-center w-full px-4 py-2 text-sm text-sky-900 hover:bg-sky-50"
              role="menuitem"
            >
              <Settings className="w-4 h-4 ml-2" />
              إعدادات الحساب
            </button>

            <div className="border-t border-sky-100"></div>

            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              role="menuitem"
            >
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      )}
    </div>
  );
}