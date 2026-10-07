'use client';

import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useDatabase } from '@/lib/useDatabase';
import { formatRupiah, formatDate } from '@/lib/utils';
import {
  Users,
  Wallet,
  Handshake,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  PackageX,
  CreditCard,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { db, approveCandidate } = useDatabase();

  // Metrics Calculation
  const activeMembers = db?.members?.filter((m) => m.status === 'aktif') || [];
  const candidateMembers = db?.members?.filter((m) => m.status === 'calon') || [];

  // Total Simpanan = sum of all setoran - penarikan
  const totalSavings = (db?.savingsTransactions || []).reduce((acc, tx) => {
    return tx.tipe === 'setor' ? acc + tx.jumlah : acc - tx.jumlah;
  }, 0);

  // Total Pembiayaan Berjalan
  const activeFinancings = (db?.financings || []).filter((f) => f.status === 'berjalan');
  const totalActiveFinancing = activeFinancings.reduce((acc, f) => acc + f.pokok, 0);

  // Total Saldo Kas (Arus Masuk - Keluar)
  const totalCashIn = (db?.cashEntries || [])
    .filter((c) => c.arah === 'masuk')
    .reduce((acc, c) => acc + c.jumlah, 0);
  const totalCashOut = (db?.cashEntries || [])
    .filter((c) => c.arah === 'keluar')
    .reduce((acc, c) => acc + c.jumlah, 0);
  const totalCashBalance = totalCashIn - totalCashOut;

  // NPF (Non Performing Financing / Bermasalah)
  const problematicFin = (db?.financings || []).filter(
    (f) => f.status === 'bermasalah' || f.kolektibilitas === 'diragukan' || f.kolektibilitas === 'macet'
  );
  const npfPercent = totalActiveFinancing > 0 ? (problematicFin.length / activeFinancings.length) * 100 : 0;

  // Pending Actions
  const pendingFinancings = (db?.financings || []).filter((f) => f.status === 'diajukan');
  const lowStockProducts = (db?.products || []).filter((p) => p.stok <= p.stok_min);

  // Recent Transactions (simpanan + cash)
  const recentSavings = (db?.savingsTransactions || []).slice(0, 5);

  return (
    <AppLayout
      title="Dasbor Eksekutif Koperasi"
      subtitle="Ringkasan kinerja operasional, likuiditas kas, simpanan, dan portofolio pembiayaan syariah."
      actionButton={
        <div className="flex items-center gap-2">
          <Link
            href="/simpanan"
            className="px-3 py-1.5 bg-[#1d5fc1] hover:bg-[#153f8a] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Catat Setoran</span>
          </Link>
          <Link
            href="/laporan"
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Rekap RAT</span>
          </Link>
        </div>
      }
    >
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Anggota Aktif */}
        <div className="bg-white rounded-2xl p-5 border border-[#e3e7ee] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Anggota Aktif
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1d5fc1] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800">
            {activeMembers.length} <span className="text-xs font-semibold text-slate-400">Orang</span>
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+{candidateMembers.length} Calon Anggota baru</span>
          </div>
        </div>

        {/* Card 2: Total Simpanan */}
        <div className="bg-white rounded-2xl p-5 border border-[#e3e7ee] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Dana Simpanan
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-800 truncate">
            {formatRupiah(totalSavings)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <span>Pokok, Wajib & Mudharabah</span>
          </div>
        </div>

        {/* Card 3: Pembiayaan Berjalan */}
        <div className="bg-white rounded-2xl p-5 border border-[#e3e7ee] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pembiayaan Berjalan
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Handshake className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-800 truncate">
            {formatRupiah(totalActiveFinancing)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] font-medium">
            <span className="text-slate-500">{activeFinancings.length} Akad Aktif</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
              NPF {npfPercent.toFixed(1)}% (Lancar)
            </span>
          </div>
        </div>

        {/* Card 4: Saldo Kas Koperasi */}
        <div className="bg-white rounded-2xl p-5 border border-[#e3e7ee] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Saldo Kas & Bank
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-[#153f8a] truncate">
            {formatRupiah(totalCashBalance)}
          </p>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <span>Likuiditas kas operasional</span>
          </div>
        </div>
      </div>

      {/* Grid: Widget "Perlu Tindakan" & Trend Finansial */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Left: Daftar Perlu Tindakan (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#e3e7ee] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-50 text-[#d32a2a]">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-800">
                  Daftar Perlu Tindakan
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-[#d32a2a]">
                {candidateMembers.length + pendingFinancings.length + lowStockProducts.length} Tindakan
              </span>
            </div>

            <div className="space-y-3">
              {/* Item 1: Calon Anggota */}
              {candidateMembers.map((candidate) => (
                <div
                  key={candidate.id}
                  className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {candidate.nama}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Calon Anggota • {candidate.pekerjaan}
                    </p>
                  </div>
                  <button
                    onClick={() => approveCandidate(candidate.id)}
                    className="px-2.5 py-1 bg-[#1d5fc1] hover:bg-[#153f8a] text-white text-[11px] font-bold rounded-lg transition-colors shrink-0 shadow-xs"
                  >
                    Setujui
                  </button>
                </div>
              ))}

              {/* Item 2: Pengajuan Pembiayaan */}
              {pendingFinancings.map((fin) => {
                const member = db?.members?.find((m) => m.id === fin.member_id);
                return (
                  <div
                    key={fin.id}
                    className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {fin.no_akad} — {member?.nama || '-'}
                      </p>
                      <p className="text-[11px] text-amber-800 font-semibold">
                        {formatRupiah(fin.pokok)} ({fin.akad.toUpperCase()})
                      </p>
                    </div>
                    <Link
                      href="/pembiayaan"
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg transition-colors shrink-0"
                    >
                      Proses
                    </Link>
                  </div>
                );
              })}

              {/* Item 3: Stok Menipis */}
              {lowStockProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="p-3 rounded-xl bg-red-50/50 border border-red-100 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {prod.nama}
                    </p>
                    <p className="text-[11px] text-red-700 font-semibold">
                      Tersisa {prod.stok} (Min: {prod.stok_min})
                    </p>
                  </div>
                  <Link
                    href="/toko"
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg transition-colors shrink-0"
                  >
                    Kulakan
                  </Link>
                </div>
              ))}

              {candidateMembers.length === 0 &&
                pendingFinancings.length === 0 &&
                lowStockProducts.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Tidak ada tindakan tertunda. Semua operasional koperasi up-to-date!
                  </div>
                )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4 text-[11px] text-slate-400 text-center">
            Sistem otomatis memperbarui status saat tindakan diselesaikan.
          </div>
        </div>

        {/* Right: Ringkasan Portofolio & Keuangan Koperasi (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#e3e7ee] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-[#1d5fc1]">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-800">
                  Struktur Portofolio & Produk Simpanan
                </h2>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Bulan Berjalan 2026</span>
            </div>

            {/* Simpanan Breakdown */}
            <div className="space-y-3 mb-6">
              <h3 className="text-xs font-bold text-slate-600">Komposisi Simpanan Anggota:</h3>
              {db?.savingsProducts?.map((prod) => {
                const prodTx = (db?.savingsTransactions || []).filter((t) => t.product_id === prod.id);
                const totalProd = prodTx.reduce((acc, t) => (t.tipe === 'setor' ? acc + t.jumlah : acc - t.jumlah), 0);
                const percent = totalSavings > 0 ? (totalProd / totalSavings) * 100 : 0;

                return (
                  <div key={prod.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{prod.nama}</span>
                      <span className="font-bold text-slate-800">{formatRupiah(totalProd)} ({percent.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1d5fc1] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Summary Pembiayaan Murabahah vs Qardh */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <span className="text-[11px] text-slate-500 block">Akad Murabahah (Jual Beli)</span>
                <span className="text-sm font-bold text-[#153f8a]">
                  {formatRupiah(
                    (db?.financings || [])
                      .filter((f) => f.akad === 'murabahah' && f.status === 'berjalan')
                      .reduce((acc, f) => acc + f.pokok, 0)
                  )}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                <span className="text-[11px] text-slate-500 block">Akad Qardh (Talangan 0%)</span>
                <span className="text-sm font-bold text-purple-900">
                  {formatRupiah(
                    (db?.financings || [])
                      .filter((f) => f.akad === 'qardh' && f.status === 'berjalan')
                      .reduce((acc, f) => acc + f.pokok, 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaksi Terbaru */}
      <div className="bg-white rounded-2xl border border-[#e3e7ee] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">
            Transaksi Simpanan & Kas Terakhir
          </h2>
          <Link
            href="/simpanan"
            className="text-xs font-bold text-[#1d5fc1] hover:underline"
          >
            Lihat Semua Mutasi →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-2">Tanggal</th>
                <th className="pb-2">No. Transaksi</th>
                <th className="pb-2">Nama Anggota</th>
                <th className="pb-2">Jenis Simpanan</th>
                <th className="pb-2 text-right">Nominal</th>
                <th className="pb-2 text-center">Tipe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentSavings.map((tx) => {
                const member = db?.members?.find((m) => m.id === tx.member_id);
                const prod = db?.savingsProducts?.find((p) => p.id === tx.product_id);

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 text-slate-500">{formatDate(tx.tanggal)}</td>
                    <td className="py-2.5 font-medium text-slate-700">{tx.no_transaksi}</td>
                    <td className="py-2.5 font-bold text-slate-800">{member?.nama || '-'}</td>
                    <td className="py-2.5 text-slate-600">{prod?.nama || '-'}</td>
                    <td className="py-2.5 text-right font-bold text-slate-800">
                      {formatRupiah(tx.jumlah)}
                    </td>
                    <td className="py-2.5 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          tx.tipe === 'setor'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {tx.tipe === 'setor' ? 'SETOR' : 'TARIK'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
