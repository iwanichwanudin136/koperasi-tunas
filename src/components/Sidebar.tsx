'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Wallet,
  Handshake,
  Store,
  UtensilsCrossed,
  BookOpen,
  PieChart,
  Megaphone,
  FileText,
  Settings,
  Globe,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useDatabase } from '@/lib/useDatabase';
import { UserRole } from '@/types';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles?: UserRole[];
  badgeKey?: 'calon' | 'finPending' | 'lowStock' | 'invPending' | 'catPending';
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dasbor Utama', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Anggota & Calon', href: '/anggota', icon: Users, badgeKey: 'calon', roles: ['admin', 'sekretaris', 'pengawas'] },
  { name: 'Simpanan', href: '/simpanan', icon: Wallet, roles: ['admin', 'bendahara', 'pengawas'] },
  { name: 'Pembiayaan Syariah', href: '/pembiayaan', icon: Handshake, badgeKey: 'finPending', roles: ['admin', 'bendahara', 'pengawas'] },
  { name: 'Toko & Invoice', href: '/toko', icon: Store, badgeKey: 'lowStock', roles: ['admin', 'marketing', 'bendahara', 'pengawas'] },
  { name: 'Katering Syariah', href: '/katering', icon: UtensilsCrossed, badgeKey: 'catPending', roles: ['admin', 'marketing', 'bendahara', 'pengawas'] },
  { name: 'Buku Kas', href: '/kas', icon: BookOpen, roles: ['admin', 'bendahara', 'pengawas'] },
  { name: 'Saham & SHU', href: '/shu', icon: PieChart, roles: ['admin', 'sekretaris', 'pengawas'] },
  { name: 'Marketing & UTM', href: '/marketing', icon: Megaphone, roles: ['admin', 'marketing', 'pengawas'] },
  { name: 'Laporan RAT', href: '/laporan', icon: FileText, roles: ['admin', 'sekretaris', 'bendahara', 'marketing', 'pengawas'] },
  { name: 'Pengaturan & Log', href: '/pengaturan', icon: Settings, roles: ['admin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { db } = useDatabase();
  const currentRole = db?.currentUser?.peran || 'admin';

  // Hitung badge
  const pendingCandidates = db?.members?.filter((m) => m.status === 'calon').length || 0;
  const pendingFinancings = db?.financings?.filter((f) => f.status === 'diajukan').length || 0;
  const lowStockProducts = db?.products?.filter((p) => p.stok <= p.stok_min).length || 0;
  const pendingCatering = db?.cateringOrders?.filter((o) => o.status_pesanan === 'masuk' || o.status_pesanan === 'dikonfirmasi').length || 0;

  const getBadgeCount = (badgeKey?: string) => {
    if (badgeKey === 'calon') return pendingCandidates;
    if (badgeKey === 'finPending') return pendingFinancings;
    if (badgeKey === 'lowStock') return lowStockProducts;
    if (badgeKey === 'catPending') return pendingCatering;
    return 0;
  };


  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Admin / Ketua';
      case 'sekretaris': return 'Sekretaris';
      case 'bendahara': return 'Bendahara / Kasir';
      case 'marketing': return 'Marketing / Toko';
      case 'pengawas': return 'Pengawas DPS';
      default: return 'Publik';
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-[#e3e7ee] flex flex-col shrink-0 h-screen sticky top-0 select-none shadow-sm z-30 transition-all duration-200">
      {/* Top Ribbon Bar (Biru 65% | Merah 35%) */}
      <div className="h-1.5 w-full ribbon-bar shrink-0" />

      {/* Brand Header */}
      <div className="p-4 border-b border-[#e3e7ee]">
        <Link href="/dashboard" className="flex items-center gap-3.5 group">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 p-0.5 flex items-center justify-center shadow-xs shrink-0 overflow-hidden group-hover:border-[#1d5fc1]/50 group-hover:shadow-sm transition-all">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Logo Koperasi Taawun Amal Sejahtera" className="w-full h-full object-contain transform group-hover:scale-105 transition-transform" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-[#153f8a] leading-tight truncate group-hover:text-[#1d5fc1] transition-colors">
              TAAWUN AMAL
            </h1>
            <p className="text-[11px] font-semibold text-[#d32a2a] tracking-wide uppercase">
              Koperasi Syariah
            </p>
          </div>
        </Link>

        {/* Current Active Role Badge */}
        <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-[#f4f6fa] border border-[#e3e7ee] flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1d5fc1] shrink-0" />
            <span className="text-[11px] font-medium text-[#64748b] truncate">
              {getRoleLabel(currentRole)}
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-100 text-[#1d5fc1]">
            {currentRole}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Menu Pengurus
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const isAllowed = !item.roles || item.roles.includes(currentRole);
          const badgeCount = getBadgeCount(item.badgeKey);

          if (!isAllowed) {
            return null; // disembunyikan sesuai hak akses PRD
          }

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-[#1d5fc1] text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-[#f4f6fa] hover:text-[#1d5fc1]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#1d5fc1]'
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </div>

              {badgeCount > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                    isActive
                      ? 'bg-red-500 text-white'
                      : 'bg-red-100 text-[#d32a2a]'
                  }`}
                >
                  {badgeCount}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-4 px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Kanal Publik
        </div>

        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>Website Publik</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Footer Profile Mini */}
      <div className="p-3 border-t border-[#e3e7ee] bg-[#fafbfc]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-600 shrink-0">
            {db?.currentUser?.nama?.[0] || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 truncate">
              {db?.currentUser?.nama || 'User'}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {db?.currentUser?.email || '-'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
