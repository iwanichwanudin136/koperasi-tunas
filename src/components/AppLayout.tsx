'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useDatabase } from '@/lib/useDatabase';
import { UserRole } from '@/types';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface AppLayoutProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  title?: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

export function AppLayout({
  children,
  allowedRoles,
  title,
  subtitle,
  actionButton,
}: AppLayoutProps) {
  const { db, isLoaded } = useDatabase();
  const currentRole = db?.currentUser?.peran || 'admin';

  const isRoleAllowed = !allowedRoles || allowedRoles.includes(currentRole);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6fa]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#1d5fc1] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Memuat data Koperasi Syariah...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f4f6fa] text-[#3a3a3a]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {/* Header Title Section if provided */}
          {title && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-[#153f8a] tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs md:text-sm text-slate-500 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>

              {actionButton && (
                <div className="flex items-center gap-2.5 shrink-0">
                  {actionButton}
                </div>
              )}
            </div>
          )}

          {/* Role Access Guard Alert */}
          {!isRoleAllowed ? (
            <div className="bg-white border border-red-200 rounded-2xl p-8 text-center shadow-sm my-6 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#d32a2a] flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-2">Akses Dibatasi (M1 Role-based Guard)</h2>
              <p className="text-xs text-slate-500 mb-6">
                Peran aktif Anda saat ini (<span className="font-bold text-slate-700 capitalize">{currentRole}</span>) tidak memiliki otorisasi untuk membuka modul ini.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-[#1d5fc1] text-white text-xs font-bold rounded-lg hover:bg-[#153f8a] transition-colors"
                >
                  Kembali ke Dasbor
                </Link>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
