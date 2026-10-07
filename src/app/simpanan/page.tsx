'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useDatabase } from '@/lib/useDatabase';
import { formatDate, formatRupiah } from '@/lib/utils';
import { generateSavingsStatementPDF } from '@/lib/pdf';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  Search,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  TrendingUp,
  Info,
} from 'lucide-react';

export default function SimpananPage() {
  const { db, recordSavingsTx } = useDatabase();
  const [selectedMemberId, setSelectedMemberId] = useState<string>(db?.members?.[0]?.id || 'MB-001');
  const [selectedProductId, setSelectedProductId] = useState<string>('SP-02'); // Wajib
  const [searchMember, setSearchMember] = useState('');

  // Transaction Modal State
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<'setor' | 'tarik'>('setor');
  const [txAmount, setTxAmount] = useState<number>(50000);
  const [txNotes, setTxNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const members = db?.members?.filter((m) => m.status === 'aktif') || [];
  const selectedMember = members.find((m) => m.id === selectedMemberId) || members[0];
  const savingsProducts = db?.savingsProducts || [];
  const selectedProduct = savingsProducts.find((p) => p.id === selectedProductId) || savingsProducts[0];

  // Hitung saldo per produk untuk anggota terpilih
  const getMemberBalanceForProduct = (memberId: string, productId: string) => {
    const txs = (db?.savingsTransactions || []).filter(
      (t) => t.member_id === memberId && t.product_id === productId
    );
    return txs.reduce((acc, t) => (t.tipe === 'setor' ? acc + t.jumlah : acc - t.jumlah), 0);
  };

  // Total saldo semua simpanan anggota terpilih
  const totalMemberBalance = savingsProducts.reduce(
    (acc, p) => acc + getMemberBalanceForProduct(selectedMember?.id || '', p.id),
    0
  );

  // Riwayat mutasi untuk produk yang dipilih
  const productTransactions = (db?.savingsTransactions || [])
    .filter((t) => t.member_id === selectedMember?.id && t.product_id === selectedProductId)
    .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

  // Generate running balance table rows
  let runningSaldo = 0;
  const runningMutationRows = productTransactions.map((tx) => {
    if (tx.tipe === 'setor') {
      runningSaldo += tx.jumlah;
    } else {
      runningSaldo -= tx.jumlah;
    }
    return {
      id: tx.id,
      tanggal: tx.tanggal,
      no_transaksi: tx.no_transaksi,
      keterangan: tx.keterangan,
      debet: tx.tipe === 'tarik' ? tx.jumlah : 0,
      kredit: tx.tipe === 'setor' ? tx.jumlah : 0,
      saldo: runningSaldo,
      dibuat_oleh: tx.dibuat_oleh,
    };
  });

  const handleRecordTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      recordSavingsTx(selectedMember.id, selectedProductId, txType, txAmount, txNotes);
      setShowTxModal(false);
      setTxNotes('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses transaksi simpanan');
    }
  };

  const handlePrintPassbookPDF = () => {
    if (!selectedMember || !selectedProduct) return;
    generateSavingsStatementPDF(
      selectedMember,
      selectedProduct.nama,
      runningMutationRows,
      db.config
    );
  };

  return (
    <AppLayout
      allowedRoles={['admin', 'bendahara', 'pengawas']}
      title="Buku Simpanan Syariah"
      subtitle="Pencatatan setoran & penarikan simpanan pokok, wajib, wadiah, dan mudharabah berjangka."
      actionButton={
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintPassbookPDF}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-[#1d5fc1]" />
            <span>Cetak Buku Tabungan (PDF)</span>
          </button>
          <button
            onClick={() => {
              setTxType('setor');
              setTxAmount(selectedProduct?.minimal_setoran || 50000);
              setShowTxModal(true);
            }}
            className="px-3 py-1.5 bg-[#1d5fc1] hover:bg-[#153f8a] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Catat Transaksi</span>
          </button>
        </div>
      }
    >
      {/* 2-Column Layout: Left Member Selector & Product Balances, Right Passbook Statement */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Member Picker */}
          <div className="bg-white rounded-2xl border border-[#e3e7ee] p-4 shadow-xs">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Pilih Anggota Koperasi:
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-3 py-2 bg-[#f4f6fa] border border-[#e3e7ee] rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#1d5fc1]"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.no_anggota} — {m.nama}
                </option>
              ))}
            </select>

            {/* Selected Member Profile Card */}
            {selectedMember && (
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">NIK:</span>
                  <span className="font-mono font-semibold text-slate-700">{selectedMember.nik}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pekerjaan:</span>
                  <span className="font-semibold text-slate-700">{selectedMember.pekerjaan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Simpanan:</span>
                  <span className="font-extrabold text-[#153f8a]">{formatRupiah(totalMemberBalance)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Product Balance Cards */}
          <div className="space-y-2.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Rekening Simpanan Anggota
            </p>
            {savingsProducts.map((prod) => {
              const balance = getMemberBalanceForProduct(selectedMember?.id || '', prod.id);
              const isSelected = prod.id === selectedProductId;

              return (
                <button
                  key={prod.id}
                  onClick={() => setSelectedProductId(prod.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-50/90 to-white border-[#1d5fc1] shadow-sm ring-1 ring-[#1d5fc1]'
                      : 'bg-white border-[#e3e7ee] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">{prod.nama}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      Akad {prod.akad}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-[11px] text-slate-400">Saldo:</span>
                    <span className="text-sm font-black text-[#153f8a]">{formatRupiah(balance)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Passbook Mutation Statement (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#e3e7ee] p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Statement Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 mb-4 gap-2">
              <div>
                <span className="text-[11px] font-bold text-[#1d5fc1] uppercase tracking-wide">
                  Mutasi Buku Tabungan
                </span>
                <h2 className="text-base font-bold text-slate-800">
                  {selectedProduct?.nama}
                </h2>
                <p className="text-xs text-slate-500">
                  Pemilik: <strong>{selectedMember?.nama}</strong> ({selectedMember?.no_anggota})
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Saldo Terkini</span>
                <span className="text-lg font-black text-[#153f8a]">
                  {formatRupiah(getMemberBalanceForProduct(selectedMember?.id || '', selectedProductId))}
                </span>
              </div>
            </div>

            {/* Mudharabah Info banner if Mudharabah */}
            {selectedProduct?.akad === 'mudharabah' && (
              <div className="mb-4 p-3 rounded-xl bg-purple-50 border border-purple-100 flex items-center gap-2.5 text-xs text-purple-900">
                <Info className="w-4 h-4 text-purple-700 shrink-0" />
                <span>
                  Investasi Mudharabah: Nisbah Bagi Hasil <strong>{selectedProduct.nisbah_anggota}% Anggota</strong> : <strong>{selectedProduct.nisbah_koperasi}% Koperasi</strong> dari keuntungan riil usaha.
                </span>
              </div>
            )}

            {/* Mutation Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">No. Transaksi</th>
                    <th className="py-2.5 px-3">Keterangan</th>
                    <th className="py-2.5 px-3 text-right">Setor (+)</th>
                    <th className="py-2.5 px-3 text-right">Tarik (-)</th>
                    <th className="py-2.5 px-3 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {runningMutationRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500">{formatDate(row.tanggal)}</td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{row.no_transaksi}</td>
                      <td className="py-2.5 px-3 text-slate-800">{row.keterangan}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">
                        {row.kredit > 0 ? formatRupiah(row.kredit) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#d32a2a]">
                        {row.debet > 0 ? formatRupiah(row.debet) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#153f8a]">
                        {formatRupiah(row.saldo)}
                      </td>
                    </tr>
                  ))}

                  {runningMutationRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        Belum ada riwayat transaksi pada rekening simpanan ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 mt-6">
            <span>Sistem pencatatan append-only terintegrasi otomatis ke buku kas.</span>
            <span className="font-bold text-slate-600">{runningMutationRows.length} Transaksi Tercatat</span>
          </div>
        </div>
      </div>

      {/* Transaction Modal (Setor / Tarik) */}
      {showTxModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-800">
                Pencatatan Transaksi Simpanan
              </h3>
              <button onClick={() => setShowTxModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleRecordTransaction} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Anggota:</span>
                  <span className="font-bold text-slate-800">{selectedMember?.nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Produk Simpanan:</span>
                  <span className="font-bold text-slate-800">{selectedProduct?.nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Saldo Saat Ini:</span>
                  <span className="font-bold text-[#153f8a]">
                    {formatRupiah(getMemberBalanceForProduct(selectedMember?.id || '', selectedProductId))}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType('setor')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    txType === 'setor'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Setoran (+)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('tarik')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    txType === 'tarik'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Penarikan (-)
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nominal Transaksi (Rp) *
                </label>
                <input
                  type="number"
                  min={1000}
                  step={5000}
                  required
                  value={txAmount}
                  onChange={(e) => setTxAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#1d5fc1]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Terbilang: {formatRupiah(txAmount)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Keterangan / Berita Acara
                </label>
                <input
                  type="text"
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  placeholder={`Contoh: Setoran ${selectedProduct?.nama} via Kasir`}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1d5fc1] hover:bg-[#153f8a] text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  Proses Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
