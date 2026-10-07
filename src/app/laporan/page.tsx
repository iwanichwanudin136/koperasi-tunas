'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useDatabase } from '@/lib/useDatabase';
import { formatDate, formatRupiah } from '@/lib/utils';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Wallet,
  Handshake,
  BookOpen,
  Store,
  Coins,
} from 'lucide-react';

export default function LaporanPage() {
  const { db } = useDatabase();
  const [reportType, setReportType] = useState<
    'simpanan' | 'pembiayaan' | 'kas' | 'penjualan' | 'shu'
  >('simpanan');

  const members = db?.members?.filter((m) => m.status === 'aktif') || [];
  const savingsTx = db?.savingsTransactions || [];
  const financings = db?.financings || [];
  const cashEntries = db?.cashEntries || [];
  const invoices = db?.invoices || [];
  const shuResults = db?.shuResults || [];

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `Laporan_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;

    if (reportType === 'simpanan') {
      headers = ['No Transaksi', 'Tanggal', 'Nama Anggota', 'Produk Simpanan', 'Tipe', 'Jumlah (Rp)', 'Keterangan'];
      rows = savingsTx.map((tx) => {
        const mem = members.find((m) => m.id === tx.member_id);
        const prod = db.savingsProducts.find((p) => p.id === tx.product_id);
        return [
          tx.no_transaksi,
          tx.tanggal,
          `"${mem?.nama || '-'}"`,
          `"${prod?.nama || '-'}"`,
          tx.tipe,
          tx.jumlah,
          `"${tx.keterangan}"`,
        ];
      });
    } else if (reportType === 'pembiayaan') {
      headers = ['No Akad', 'Nama Anggota', 'Akad', 'Tujuan', 'Pokok (Rp)', 'Margin (Rp)', 'Total (Rp)', 'Status', 'Kolektibilitas'];
      rows = financings.map((f) => {
        const mem = members.find((m) => m.id === f.member_id);
        return [
          f.no_akad,
          `"${mem?.nama || '-'}"`,
          f.akad,
          `"${f.tujuan_pengajuan}"`,
          f.pokok,
          f.margin_nominal,
          f.total_pembiayaan,
          f.status,
          f.kolektibilitas,
        ];
      });
    } else if (reportType === 'kas') {
      headers = ['No Kas', 'Tanggal', 'Arah', 'Kategori', 'Jumlah (Rp)', 'Keterangan'];
      rows = cashEntries.map((c) => [
        c.no_kas,
        c.tanggal,
        c.arah,
        c.kategori,
        c.jumlah,
        `"${c.keterangan}"`,
      ]);
    } else if (reportType === 'penjualan') {
      headers = ['No Invoice', 'Tanggal', 'Nama Pelanggan', 'Total Belanja (Rp)', 'Status'];
      rows = invoices.map((i) => [
        i.no_invoice,
        i.tanggal,
        `"${i.nama_pelanggan}"`,
        i.total,
        i.status,
      ]);
    } else if (reportType === 'shu') {
      headers = ['No Anggota', 'Nama Anggota', 'Modal Simpanan (Rp)', '% Modal', 'Jasa Simpanan (Rp)', 'Jasa Transaksi (Rp)', 'Total SHU (Rp)'];
      rows = shuResults.map((s) => {
        const mem = members.find((m) => m.id === s.member_id);
        return [
          mem?.no_anggota || '-',
          `"${mem?.nama || '-'}"`,
          s.simpanan_pokok_wajib,
          `${s.persentase_modal}%`,
          s.jasa_simpanan,
          s.jasa_transaksi,
          s.total_shu_diterima,
        ];
      });
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout
      allowedRoles={['admin', 'sekretaris', 'bendahara', 'marketing', 'pengawas']}
      title="Pusat Laporan Keuangan & RAT"
      subtitle="Unduh rekapitulasi data simpanan, pembiayaan, kas, penjualan, dan pembagian SHU untuk Rapat Anggota Tahunan."
      actionButton={
        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Ekspor Laporan (CSV/Excel)</span>
        </button>
      }
    >
      {/* Report Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-6">
        <button
          onClick={() => setReportType('simpanan')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            reportType === 'simpanan'
              ? 'bg-gradient-to-br from-blue-50 to-white border-[#1d5fc1] shadow-xs ring-1 ring-[#1d5fc1]'
              : 'bg-white border-[#e3e7ee] hover:bg-slate-50'
          }`}
        >
          <Wallet className="w-4 h-4 text-[#1d5fc1] mb-2" />
          <p className="text-xs font-bold text-slate-800">Laporan Simpanan</p>
          <p className="text-[10px] text-slate-400">Mutasi & Saldo</p>
        </button>

        <button
          onClick={() => setReportType('pembiayaan')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            reportType === 'pembiayaan'
              ? 'bg-gradient-to-br from-blue-50 to-white border-[#1d5fc1] shadow-xs ring-1 ring-[#1d5fc1]'
              : 'bg-white border-[#e3e7ee] hover:bg-slate-50'
          }`}
        >
          <Handshake className="w-4 h-4 text-purple-600 mb-2" />
          <p className="text-xs font-bold text-slate-800">Laporan Pembiayaan</p>
          <p className="text-[10px] text-slate-400">Kolektibilitas & NPF</p>
        </button>

        <button
          onClick={() => setReportType('kas')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            reportType === 'kas'
              ? 'bg-gradient-to-br from-blue-50 to-white border-[#1d5fc1] shadow-xs ring-1 ring-[#1d5fc1]'
              : 'bg-white border-[#e3e7ee] hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-600 mb-2" />
          <p className="text-xs font-bold text-slate-800">Arus Kas Masuk/Keluar</p>
          <p className="text-[10px] text-slate-400">Buku Kas Besar</p>
        </button>

        <button
          onClick={() => setReportType('penjualan')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            reportType === 'penjualan'
              ? 'bg-gradient-to-br from-blue-50 to-white border-[#1d5fc1] shadow-xs ring-1 ring-[#1d5fc1]'
              : 'bg-white border-[#e3e7ee] hover:bg-slate-50'
          }`}
        >
          <Store className="w-4 h-4 text-amber-600 mb-2" />
          <p className="text-xs font-bold text-slate-800">Penjualan & Stok</p>
          <p className="text-[10px] text-slate-400">Omzet Toko</p>
        </button>

        <button
          onClick={() => setReportType('shu')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            reportType === 'shu'
              ? 'bg-gradient-to-br from-blue-50 to-white border-[#1d5fc1] shadow-xs ring-1 ring-[#1d5fc1]'
              : 'bg-white border-[#e3e7ee] hover:bg-slate-50'
          }`}
        >
          <Coins className="w-4 h-4 text-[#d32a2a] mb-2" />
          <p className="text-xs font-bold text-slate-800">Laporan SHU RAT</p>
          <p className="text-[10px] text-slate-400">Bagi Hasil Anggota</p>
        </button>
      </div>

      {/* Report Data Preview Table */}
      <div className="bg-white rounded-2xl border border-[#e3e7ee] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Pratinjau {reportType.toUpperCase()} (Tahun Berjalan 2026)
          </h3>
          <span className="text-[11px] text-slate-400">
            Koperasi Taawun Amal Sejahtera
          </span>
        </div>

        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          {reportType === 'simpanan' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] sticky top-0">
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">No. Transaksi</th>
                  <th className="py-2.5 px-3">Anggota</th>
                  <th className="py-2.5 px-3">Produk</th>
                  <th className="py-2.5 px-3">Tipe</th>
                  <th className="py-2.5 px-3 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {savingsTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-500">{formatDate(tx.tanggal)}</td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-700">{tx.no_transaksi}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {members.find((m) => m.id === tx.member_id)?.nama || '-'}
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      {db.savingsProducts.find((p) => p.id === tx.product_id)?.nama || '-'}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${tx.tipe === 'setor' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {tx.tipe.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-800">{formatRupiah(tx.jumlah)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'pembiayaan' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] sticky top-0">
                  <th className="py-2.5 px-3">No. Akad</th>
                  <th className="py-2.5 px-3">Anggota</th>
                  <th className="py-2.5 px-3">Akad</th>
                  <th className="py-2.5 px-3 text-right">Pokok</th>
                  <th className="py-2.5 px-3 text-right">Margin</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Kolektibilitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {financings.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono font-bold text-[#153f8a]">{f.no_akad}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {members.find((m) => m.id === f.member_id)?.nama || '-'}
                    </td>
                    <td className="py-2 px-3 uppercase text-[10px] font-bold text-slate-600">{f.akad}</td>
                    <td className="py-2 px-3 text-right text-slate-600">{formatRupiah(f.pokok)}</td>
                    <td className="py-2 px-3 text-right text-emerald-600">+{formatRupiah(f.margin_nominal)}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-800">{formatRupiah(f.total_pembiayaan)}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-50 text-[#1d5fc1]">
                        {f.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                        {f.kolektibilitas.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'kas' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] sticky top-0">
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">No. Kas</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                  <th className="py-2.5 px-3 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cashEntries.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-500">{formatDate(c.tanggal)}</td>
                    <td className="py-2 px-3 font-mono text-slate-700">{c.no_kas}</td>
                    <td className="py-2 px-3 text-slate-600 font-medium">{c.kategori}</td>
                    <td className="py-2 px-3 text-slate-800">{c.keterangan}</td>
                    <td className={`py-2 px-3 text-right font-bold ${c.arah === 'masuk' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {c.arah === 'masuk' ? '+' : '-'}{formatRupiah(c.jumlah)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'penjualan' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] sticky top-0">
                  <th className="py-2.5 px-3">No. Invoice</th>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Pelanggan</th>
                  <th className="py-2.5 px-3 text-right">Total Tagihan</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono font-bold text-[#153f8a]">{inv.no_invoice}</td>
                    <td className="py-2 px-3 text-slate-500">{formatDate(inv.tanggal)}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{inv.nama_pelanggan}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-800">{formatRupiah(inv.total)}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'shu' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] sticky top-0">
                  <th className="py-2.5 px-3">No. Anggota</th>
                  <th className="py-2.5 px-3">Nama Anggota</th>
                  <th className="py-2.5 px-3 text-right">Modal Saham</th>
                  <th className="py-2.5 px-3 text-center">% Modal</th>
                  <th className="py-2.5 px-3 text-right">Jasa Modal</th>
                  <th className="py-2.5 px-3 text-right">Jasa Transaksi</th>
                  <th className="py-2.5 px-3 text-right font-bold text-[#153f8a]">TOTAL SHU</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shuResults.map((s) => {
                  const mem = members.find((m) => m.id === s.member_id);
                  return (
                    <tr key={s.member_id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-700">{mem?.no_anggota}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{mem?.nama}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{formatRupiah(s.simpanan_pokok_wajib)}</td>
                      <td className="py-2 px-3 text-center font-bold text-[#1d5fc1]">{s.persentase_modal}%</td>
                      <td className="py-2 px-3 text-right text-emerald-600">{formatRupiah(s.jasa_simpanan)}</td>
                      <td className="py-2 px-3 text-right text-emerald-600">{formatRupiah(s.jasa_transaksi)}</td>
                      <td className="py-2 px-3 text-right font-black text-sm text-[#153f8a]">{formatRupiah(s.total_shu_diterima)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
