'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useDatabase } from '@/lib/useDatabase';
import { calculateMurabahah, formatDate, formatRupiah } from '@/lib/utils';
import { generateMurabahahContractPDF } from '@/lib/pdf';
import { Financing, FinancingAkad, FinancingStatus } from '@/types';
import {
  Handshake,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Eye,
  FileCheck,
  CreditCard,
} from 'lucide-react';

export default function PembiayaanPage() {
  const {
    db,
    createFinancing,
    approveAndDisburseFinancing,
    payInstallment,
  } = useDatabase();

  const [selectedAkad, setSelectedAkad] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFinancing, setSelectedFinancing] = useState<Financing | null>(
    db?.financings?.[0] || null
  );
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Form Pengajuan State
  const [memberId, setMemberId] = useState<string>(db?.members?.[0]?.id || 'MB-001');
  const [akad, setAkad] = useState<FinancingAkad>('murabahah');
  const [tujuan, setTujuan] = useState('');
  const [namaBarang, setNamaBarang] = useState('');
  const [hargaBarang, setHargaBarang] = useState<number>(10000000);
  const [uangMuka, setUangMuka] = useState<number>(1000000);
  const [marginPersen, setMarginPersen] = useState<number>(12);
  const [tenorBulan, setTenorBulan] = useState<number>(12);

  const members = db?.members?.filter((m) => m.status === 'aktif') || [];
  const financings = db?.financings || [];
  const installments = db?.installments || [];

  const calc = calculateMurabahah(hargaBarang, uangMuka, akad === 'qardh' ? 0 : marginPersen, tenorBulan);

  const filteredFinancings = financings.filter((f) => {
    const member = members.find((m) => m.id === f.member_id);
    const matchesAkad = selectedAkad === 'all' || f.akad === selectedAkad;
    const matchesStatus = selectedStatus === 'all' || f.status === selectedStatus;
    const matchesSearch =
      f.no_akad.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member?.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.tujuan_pengajuan.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesAkad && matchesStatus && matchesSearch;
  });

  const activeFinancingInstallments = installments
    .filter((i) => i.financing_id === selectedFinancing?.id)
    .sort((a, b) => a.no_ke - b.no_ke);

  const handleApplyFinancing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tujuan) {
      alert('Mohon isi tujuan pengajuan pembiayaan');
      return;
    }

    const newFin = createFinancing({
      member_id: memberId,
      akad,
      tujuan_pengajuan: tujuan,
      nama_barang: namaBarang || 'Objek Pembiayaan Syariah',
      harga_barang: calc.harga,
      uang_muka: calc.uangMuka,
      pokok: calc.pokok,
      margin_persen: akad === 'qardh' ? 0 : calc.marginPersen,
      margin_nominal: akad === 'qardh' ? 0 : calc.marginNominal,
      total_pembiayaan: akad === 'qardh' ? calc.pokok : calc.totalPembiayaan,
      tenor_bulan: calc.tenorBulan,
      angsuran_per_bulan: akad === 'qardh' ? Math.round(calc.pokok / calc.tenorBulan) : calc.angsuranPerBulan,
    });

    if (newFin) {
      setSelectedFinancing(newFin);
    }

    setShowApplyModal(false);
    setTujuan('');
    setNamaBarang('');
  };

  const handlePrintContractPDF = (fin: Financing) => {
    const member = members.find((m) => m.id === fin.member_id);
    if (!member) return;
    const instList = installments.filter((i) => i.financing_id === fin.id);
    generateMurabahahContractPDF(fin, member, instList, db.config);
  };

  return (
    <AppLayout
      allowedRoles={['admin', 'bendahara', 'pengawas']}
      title="Manajemen Pembiayaan Syariah"
      subtitle="Pengelolaan akad Murabahah, Mudharabah, Qardh, persetujuan, jadwal angsuran, & dokumen akad."
      actionButton={
        <div className="flex items-center gap-2">
          {selectedFinancing && (
            <button
              onClick={() => handlePrintContractPDF(selectedFinancing)}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-[#1d5fc1]" />
              <span>Cetak Surat Akad (PDF)</span>
            </button>
          )}
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-3 py-1.5 bg-[#1d5fc1] hover:bg-[#153f8a] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Ajukan Akad Baru</span>
          </button>
        </div>
      }
    >
      {/* 2-Column Main View: Left List of Financings, Right Selected Financing Detail & Installment Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#e3e7ee] shadow-xs space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari no akad / nama anggota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f4f6fa] border border-[#e3e7ee] rounded-lg focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <select
                value={selectedAkad}
                onChange={(e) => setSelectedAkad(e.target.value)}
                className="px-2 py-1.5 bg-[#f4f6fa] border border-[#e3e7ee] rounded-lg font-medium text-slate-700 text-xs"
              >
                <option value="all">Semua Akad</option>
                <option value="murabahah">Murabahah (Jual Beli)</option>
                <option value="mudharabah">Mudharabah (Bagi Hasil)</option>
                <option value="qardh">Qardh (Talangan 0%)</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2 py-1.5 bg-[#f4f6fa] border border-[#e3e7ee] rounded-lg font-medium text-slate-700 text-xs"
              >
                <option value="all">Semua Status</option>
                <option value="diajukan">Diajukan</option>
                <option value="berjalan">Berjalan</option>
                <option value="lunas">Lunas</option>
              </select>
            </div>
          </div>

          {/* Financing Card List */}
          <div className="space-y-2.5 max-h-[720px] overflow-y-auto">
            {filteredFinancings.map((fin) => {
              const member = members.find((m) => m.id === fin.member_id);
              const isSelected = selectedFinancing?.id === fin.id;

              return (
                <div
                  key={fin.id}
                  onClick={() => setSelectedFinancing(fin)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-50/90 to-white border-[#1d5fc1] ring-1 ring-[#1d5fc1] shadow-sm'
                      : 'bg-white border-[#e3e7ee] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] font-bold text-[#153f8a]">
                      {fin.no_akad}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        fin.status === 'berjalan'
                          ? 'bg-emerald-100 text-emerald-800'
                          : fin.status === 'diajukan'
                          ? 'bg-amber-100 text-amber-800'
                          : fin.status === 'lunas'
                          ? 'bg-blue-100 text-[#1d5fc1]'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {fin.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="mb-2">
                    <p className="text-xs font-bold text-slate-800">{member?.nama || '-'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{fin.tujuan_pengajuan}</p>
                  </div>

                  <div className="flex items-baseline justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Akad {fin.akad}
                    </span>
                    <span className="font-bold text-[#153f8a]">
                      {formatRupiah(fin.total_pembiayaan)}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredFinancings.length === 0 && (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                Tidak ada data pembiayaan yang cocok.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Detail & Schedule (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#e3e7ee] p-5 shadow-xs flex flex-col justify-between">
          {selectedFinancing ? (
            <div>
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between pb-4 border-b border-slate-200 gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-[#153f8a]">
                      {selectedFinancing.no_akad}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.2 rounded bg-blue-100 text-[#1d5fc1]">
                      Akad {selectedFinancing.akad}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-800">
                    {members.find((m) => m.id === selectedFinancing.member_id)?.nama}
                  </h2>
                  <p className="text-xs text-slate-500">{selectedFinancing.tujuan_pengajuan}</p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedFinancing.status === 'diajukan' && (
                    <button
                      onClick={() => approveAndDisburseFinancing(selectedFinancing.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Setujui & Cairkan</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f8fafc] p-3.5 rounded-xl mb-6 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Pokok Pembiayaan</span>
                  <span className="font-bold text-slate-800">{formatRupiah(selectedFinancing.pokok)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Margin ({selectedFinancing.margin_persen}%)</span>
                  <span className="font-bold text-emerald-700">+{formatRupiah(selectedFinancing.margin_nominal)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Kewajiban</span>
                  <span className="font-extrabold text-[#153f8a]">{formatRupiah(selectedFinancing.total_pembiayaan)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Angsuran/Bulan</span>
                  <span className="font-bold text-[#d32a2a]">{formatRupiah(selectedFinancing.angsuran_per_bulan)}</span>
                </div>
              </div>

              {/* Installment Schedule Table */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Jadwal Angsuran Tenor ({selectedFinancing.tenor_bulan} Bulan)</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    Kolektibilitas: <strong className="text-emerald-600 uppercase">{selectedFinancing.kolektibilitas}</strong>
                  </span>
                </h3>

                <div className="overflow-x-auto max-h-96 overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#f8fafc] border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] sticky top-0">
                        <th className="py-2.5 px-3">Ke</th>
                        <th className="py-2.5 px-3">Jatuh Tempo</th>
                        <th className="py-2.5 px-3 text-right">Pokok</th>
                        <th className="py-2.5 px-3 text-right">Margin</th>
                        <th className="py-2.5 px-3 text-right">Total Angsuran</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeFinancingInstallments.map((inst) => (
                        <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 font-bold text-slate-700">#{inst.no_ke}</td>
                          <td className="py-2 px-3 text-slate-500">{formatDate(inst.jatuh_tempo)}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{formatRupiah(inst.pokok)}</td>
                          <td className="py-2 px-3 text-right text-emerald-600">+{formatRupiah(inst.margin)}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-800">
                            {formatRupiah(inst.total_angsuran)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                inst.dibayar
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {inst.dibayar ? 'LUNAS' : 'BELUM'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            {!inst.dibayar && selectedFinancing.status === 'berjalan' ? (
                              <button
                                onClick={() => payInstallment(inst.id)}
                                className="px-2 py-1 bg-[#1d5fc1] hover:bg-[#153f8a] text-white text-[10px] font-bold rounded transition-colors shadow-xs"
                              >
                                Bayar
                              </button>
                            ) : inst.dibayar ? (
                              <span className="text-[10px] text-slate-400 font-medium">
                                {formatDate(inst.tgl_bayar)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {activeFinancingInstallments.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                            Jadwal angsuran akan dibentuk otomatis saat pembiayaan disetujui & dicairkan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8 text-slate-400 text-xs">
              Pilih salah satu pembiayaan di samping untuk melihat rincian & jadwal angsuran.
            </div>
          )}
        </div>
      </div>

      {/* Modal Apply New Financing */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-800">
                Pengajuan Akad Pembiayaan Baru
              </h3>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyFinancing} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Anggota *</label>
                <select
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.no_anggota} — {m.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilihan Akad *</label>
                  <select
                    value={akad}
                    onChange={(e) => setAkad(e.target.value as FinancingAkad)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="murabahah">Murabahah (Jual Beli)</option>
                    <option value="mudharabah">Mudharabah (Bagi Hasil)</option>
                    <option value="qardh">Qardh (Talangan Kebajikan 0%)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tenor (Bulan)</label>
                  <select
                    value={tenorBulan}
                    onChange={(e) => setTenorBulan(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value={6}>6 Bulan</option>
                    <option value={12}>12 Bulan (1 Thn)</option>
                    <option value={18}>18 Bulan</option>
                    <option value={24}>24 Bulan (2 Thn)</option>
                    <option value={36}>36 Bulan (3 Thn)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tujuan / Keperluan Usaha *</label>
                <input
                  type="text"
                  required
                  value={tujuan}
                  onChange={(e) => setTujuan(e.target.value)}
                  placeholder="Contoh: Pengadaan Mesin Jahit Industri"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Objek / Nama Barang</label>
                <input
                  type="text"
                  value={namaBarang}
                  onChange={(e) => setNamaBarang(e.target.value)}
                  placeholder="Contoh: Mesin Jahit Typical Double Needle"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga Beli / Nilai Modal</label>
                  <input
                    type="number"
                    min={500000}
                    step={100000}
                    required
                    value={hargaBarang}
                    onChange={(e) => setHargaBarang(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Uang Muka (DP)</label>
                  <input
                    type="number"
                    min={0}
                    step={100000}
                    value={uangMuka}
                    onChange={(e) => setUangMuka(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              {akad !== 'qardh' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Margin Flat per Tahun (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={marginPersen}
                    onChange={(e) => setMarginPersen(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              )}

              {/* Calculation Summary Box */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Pokok Pembiayaan Koperasi:</span>
                  <span className="font-bold text-slate-800">{formatRupiah(calc.pokok)}</span>
                </div>
                {akad !== 'qardh' && (
                  <div className="flex justify-between text-slate-600">
                    <span>Margin ({calc.marginPersen}%):</span>
                    <span className="font-bold text-emerald-700">+{formatRupiah(calc.marginNominal)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-blue-200 font-bold text-[#153f8a]">
                  <span>Angsuran per Bulan ({calc.tenorBulan} bln):</span>
                  <span>{formatRupiah(akad === 'qardh' ? Math.round(calc.pokok / calc.tenorBulan) : calc.angsuranPerBulan)}</span>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1d5fc1] hover:bg-[#153f8a] text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  Ajukan Pembiayaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
