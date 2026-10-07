'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useDatabase } from '@/lib/useDatabase';
import { formatDate, formatRupiah } from '@/lib/utils';
import { CashEntry } from '@/types';
import {
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  CreditCard,
} from 'lucide-react';

export default function KasPage() {
  const { db, addCashEntry } = useDatabase();
  const [directionFilter, setDirectionFilter] = useState<'all' | 'masuk' | 'keluar'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [arah, setArah] = useState<'masuk' | 'keluar'>('keluar');
  const [kategori, setKategori] = useState<CashEntry['kategori']>('operasional');
  const [jumlah, setJumlah] = useState<number>(100000);
  const [keterangan, setKeterangan] = useState('');

  const cashEntries = db?.cashEntries || [];

  // Hitung total kas masuk, keluar, dan saldo
  const totalMasuk = cashEntries
    .filter((c) => c.arah === 'masuk')
    .reduce((acc, c) => acc + c.jumlah, 0);

  const totalKeluar = cashEntries
    .filter((c) => c.arah === 'keluar')
    .reduce((acc, c) => acc + c.jumlah, 0);

  const saldoKas = totalMasuk - totalKeluar;

  const filteredEntries = cashEntries.filter((c) => {
    const matchesDir = directionFilter === 'all' || c.arah === directionFilter;
    const matchesCat = categoryFilter === 'all' || c.kategori === categoryFilter;
    const matchesSearch =
      c.no_kas.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.keterangan.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDir && matchesCat && matchesSearch;
  });

  const handleAddCash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keterangan || jumlah <= 0) {
      alert('Isi keterangan dan nominal kas yang valid.');
      return;
    }

    addCashEntry({
      tanggal: new Date().toISOString().split('T')[0],
      arah,
      kategori,
      jumlah,
      keterangan,
      ref_tipe: 'manual',
    });

    setShowAddModal(false);
    setKeterangan('');
  };

  const getKategoriLabel = (cat: string) => {
    switch (cat) {
      case 'simpanan_masuk': return 'Simpanan Masuk';
      case 'simpanan_tarik': return 'Penarikan Simpanan';
      case 'pencairan_pembiayaan': return 'Pencairan Pembiayaan';
      case 'angsuran_pokok': return 'Angsuran Pokok';
      case 'margin_pembiayaan': return 'Margin Murabahah';
      case 'penjualan_toko': return 'Penjualan Toko';
      case 'kulakan_stok': return 'Kulakan Stok';
      case 'operasional': return 'Beban Operasional';
      case 'bagi_hasil_shu': return 'Pembagian SHU';
      default: return 'Lainnya';
    }
  };

  return (
    <AppLayout
      allowedRoles={['admin', 'bendahara', 'pengawas']}
      title="Buku Kas & Arus Keuangan"
      subtitle="Pencatatan real-time kas masuk, kas keluar, likuiditas operasional, dan mutasi keuangan koperasi."
      actionButton={
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-[#1d5fc1] hover:bg-[#153f8a] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Catat Kas Manual</span>
        </button>
      }
    >
      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-[#e3e7ee] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Kas Masuk
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-700">{formatRupiah(totalMasuk)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Setoran, angsuran, margin, & penjualan</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#e3e7ee] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Kas Keluar
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-[#d32a2a] flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-[#d32a2a]">{formatRupiah(totalKeluar)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Pencairan pembiayaan, tarikan, & operasional</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#e3e7ee] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Saldo Kas Tersedia
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1d5fc1] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-[#153f8a]">{formatRupiah(saldoKas)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Kas tunai di kasir + saldo rekening BSI</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDirectionFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              directionFilter === 'all' ? 'bg-[#1d5fc1] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua Aliran
          </button>
          <button
            onClick={() => setDirectionFilter('masuk')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              directionFilter === 'masuk' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Kas Masuk (+)
          </button>
          <button
            onClick={() => setDirectionFilter('keluar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              directionFilter === 'keluar' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Kas Keluar (-)
          </button>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari transaksi kas / berita..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
          />
        </div>
      </div>

      {/* Cash Ledger Table */}
      <div className="bg-white rounded-2xl border border-[#e3e7ee] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">No. Kas</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Kategori Transaksi</th>
                <th className="py-3 px-4">Keterangan / Berita</th>
                <th className="py-3 px-4 text-center">Arah</th>
                <th className="py-3 px-4 text-right">Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">{c.no_kas}</td>
                  <td className="py-3 px-4 text-slate-500">{formatDate(c.tanggal)}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {getKategoriLabel(c.kategori)}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{c.keterangan}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.arah === 'masuk'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {c.arah.toUpperCase()}
                    </span>
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-bold ${
                      c.arah === 'masuk' ? 'text-emerald-600' : 'text-[#d32a2a]'
                    }`}
                  >
                    {c.arah === 'masuk' ? '+' : '-'}
                    {formatRupiah(c.jumlah)}
                  </td>
                </tr>
              ))}

              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada catatan kas yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Manual Cash */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-800">Catat Transaksi Kas Manual</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCash} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setArah('masuk');
                    setKategori('penjualan_toko');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    arah === 'masuk' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Kas Masuk (+)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setArah('keluar');
                    setKategori('operasional');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    arah === 'keluar' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Kas Keluar (-)
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori Transaksi</label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  {arah === 'masuk' ? (
                    <>
                      <option value="penjualan_toko">Penerimaan Usaha / Toko</option>
                      <option value="margin_pembiayaan">Penerimaan Margin & Bagi Hasil</option>
                      <option value="lainnya">Penerimaan Lain-Lain</option>
                    </>
                  ) : (
                    <>
                      <option value="operasional">Beban Listrik, Internet & ATK</option>
                      <option value="kulakan_stok">Beban Kulakan Barang</option>
                      <option value="bagi_hasil_shu">Pencairan Dana SHU</option>
                      <option value="lainnya">Beban Operasional Lainnya</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nominal (Rp) *</label>
                <input
                  type="number"
                  min={1000}
                  step={5000}
                  required
                  value={jumlah}
                  onChange={(e) => setJumlah(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan / Berita Transaksi *</label>
                <input
                  type="text"
                  required
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Contoh: Pembayaran tagihan internet kantor September"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1d5fc1] hover:bg-[#153f8a] text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  Simpan Catatan Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
