'use client';

import React, { useState } from 'react';
import {
  Bell,
  Search,
  UserCheck,
  RefreshCw,
  AlertTriangle,
  Clock,
  PackageX,
  ChevronDown,
} from 'lucide-react';
import { useDatabase } from '@/lib/useDatabase';
import { UserRole } from '@/types';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export function Header() {
  const { db, switchUserRole, resetToDefault } = useDatabase();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  const currentRole = db?.currentUser?.peran || 'admin';

  // Hitung notifikasi "Perlu Tindakan"
  const pendingCandidates = db?.members?.filter((m) => m.status === 'calon') || [];
  const pendingFinancings = db?.financings?.filter((f) => f.status === 'diajukan') || [];
  const lowStockProducts = db?.products?.filter((p) => p.stok <= p.stok_min) || [];
  const totalNotifications = pendingCandidates.length + pendingFinancings.length + lowStockProducts.length;

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'admin', label: 'Admin / Ketua', desc: 'Akses penuh ke semua modul' },
    { role: 'sekretaris', label: 'Sekretaris', desc: 'Anggota, Calon Anggota, Saham & SHU' },
    { role: 'bendahara', label: 'Bendahara / Kasir', desc: 'Simpanan, Pembiayaan, Kas, Invoice' },
    { role: 'marketing', label: 'Marketing / Toko', desc: 'Stok Produk, Invoice, Kampanye' },
    { role: 'pengawas', label: 'Pengawas DPS', desc: 'Read-only Dasbor & Laporan' },
  ];

  return (
    <header className="h-16 bg-white border-b border-[#e3e7ee] px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Search Input / Organization Info */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari anggota (nama/NIK), transaksi, no. invoice..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#f4f6fa] border border-[#e3e7ee] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#1d5fc1] focus:bg-white transition-all text-slate-700 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Right Tools */}
      <div className="flex items-center gap-3">
        {/* Tanggal Hari Ini */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#f4f6fa] border border-[#e3e7ee] text-xs text-slate-600 font-medium">
          <Clock className="w-3.5 h-3.5 text-[#1d5fc1]" />
          <span>{formatDate(new Date().toISOString())}</span>
        </div>

        {/* Notifikasi Perlu Tindakan */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotificationMenu(!showNotificationMenu);
              setShowRoleMenu(false);
            }}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            title="Pemberitahuan & Tindakan Perlu"
          >
            <Bell className="w-4 h-4" />
            {totalNotifications > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#d32a2a] rounded-full animate-pulse" />
            )}
          </button>

          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#e3e7ee] py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-[#e3e7ee] flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Daftar Perlu Tindakan</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-[#d32a2a]">
                  {totalNotifications} Baru
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {pendingCandidates.length > 0 && (
                  <Link
                    href="/anggota"
                    onClick={() => setShowNotificationMenu(false)}
                    className="p-3 hover:bg-slate-50 flex items-start gap-2.5 transition-colors block"
                  >
                    <UserCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {pendingCandidates.length} Calon Anggota Baru
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Menunggu verifikasi dan persetujuan pengurus.
                      </p>
                    </div>
                  </Link>
                )}

                {pendingFinancings.length > 0 && (
                  <Link
                    href="/pembiayaan"
                    onClick={() => setShowNotificationMenu(false)}
                    className="p-3 hover:bg-slate-50 flex items-start gap-2.5 transition-colors block"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {pendingFinancings.length} Pengajuan Pembiayaan
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Memerlukan persetujuan dan verifikasi akad.
                      </p>
                    </div>
                  </Link>
                )}

                {lowStockProducts.length > 0 && (
                  <Link
                    href="/toko"
                    onClick={() => setShowNotificationMenu(false)}
                    className="p-3 hover:bg-slate-50 flex items-start gap-2.5 transition-colors block"
                  >
                    <PackageX className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {lowStockProducts.length} Produk Stok Menipis
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Stok di bawah batas minimum pemesanan ulang.
                      </p>
                    </div>
                  </Link>
                )}

                {totalNotifications === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Semua transaksi dan operasional berjalan lancar!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Role Switcher Dropdown (M1 Testing) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowNotificationMenu(false);
            }}
            className="flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-lg bg-[#f4f6fa] hover:bg-slate-200/70 border border-[#e3e7ee] text-xs font-semibold text-slate-700 transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-[#1d5fc1] text-white flex items-center justify-center text-[10px] font-bold">
              {currentRole[0].toUpperCase()}
            </div>
            <span className="capitalize">{currentRole}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#e3e7ee] py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 border-b border-[#e3e7ee]">
                <p className="text-[11px] font-bold text-slate-700">Ganti Peran Pengguna (Uji M1)</p>
                <p className="text-[10px] text-slate-400">Simulasikan hak akses role yang berbeda</p>
              </div>

              <div className="py-1">
                {roles.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchUserRole(r.role);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-slate-50 transition-colors ${
                      currentRole === r.role ? 'bg-blue-50/70 font-bold text-[#1d5fc1]' : 'text-slate-700'
                    }`}
                  >
                    <span>{r.label}</span>
                    <span className="text-[10px] font-normal text-slate-400">{r.desc}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-[#e3e7ee] px-2">
                <button
                  onClick={() => {
                    if (confirm('Kembalikan data koperasi ke data bawaan awal PRD?')) {
                      resetToDefault();
                      setShowRoleMenu(false);
                    }
                  }}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Data Awal PRD</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
