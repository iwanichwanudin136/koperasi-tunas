'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useDatabase } from '@/lib/useDatabase';
import { formatDate, formatRupiah } from '@/lib/utils';
import { generateShuCertificatePDF } from '@/lib/pdf';
import { Member, ShuPeriod, ShuResult } from '@/types';
import {
  PieChart,
  Sliders,
  Printer,
  Download,
  CheckCircle2,
  Users,
  Coins,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export default function ShuPage() {
  const { db, calculateAndSetShu } = useDatabase();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [totalShuTarget, setTotalShuTarget] = useState<number>(35000000);

  // AD/ART Allocation percentage state
  const [cadangan, setCadangan] = useState<number>(30);
  const [jasaSimpanan, setJasaSimpanan] = useState<number>(25);
  const [jasaTransaksi, setJasaTransaksi] = useState<number>(20);
  const [pengurus, setPengurus] = useState<number>(10);
  const [pendidikan, setPendidikan] = useState<number>(5);
  const [sosial, setSosial] = useState<number>(5);
  const [pembangunan, setPembangunan] = useState<number>(5);

  const totalPersen =
    cadangan + jasaSimpanan + jasaTransaksi + pengurus + pendidikan + sosial + pembangunan;

  const members = db?.members?.filter((m) => m.status === 'aktif') || [];
  const shuResults = db?.shuResults || [];
  const currentPeriod = db?.shuPeriods?.find((p) => p.tahun === selectedYear);

  // Hitung Modal Saham (Pokok + Wajib) per Anggota
  const memberCapitalMap = new Map<string, number>();
  let grandTotalModal = 0;

  members.forEach((m) => {
    const txs = (db?.savingsTransactions || []).filter(
      (t) => t.member_id === m.id && (t.product_id === 'SP-01' || t.product_id === 'SP-02')
    );
    const modal = txs.reduce((acc, t) => (t.tipe === 'setor' ? acc + t.jumlah : acc - t.jumlah), 0);
    memberCapitalMap.set(m.id, modal);
    grandTotalModal += modal;
  });

  const handleCalculateShu = () => {
    if (Math.abs(totalPersen - 100) > 0.01) {
      alert(`Total persentase komponen AD/ART harus tepat 100% (saat ini ${totalPersen}%)`);
      return;
    }

    try {
      calculateAndSetShu(selectedYear, totalShuTarget, {
        cadangan,
        jasa_simpanan: jasaSimpanan,
        jasa_transaksi: jasaTransaksi,
        pengurus_pengawas: pengurus,
        dana_pendidikan: pendidikan,
        dana_sosial: sosial,
        dana_pembangunan: pembangunan,
      });
      alert(`Perhitungan SHU Tahun Buku ${selectedYear} berhasil ditetapkan!`);
    } catch (err: any) {
      alert(err.message || 'Gagal menghitung SHU');
    }
  };

  const handlePrintShuCertificate = (member: Member, result: ShuResult) => {
    if (!currentPeriod) return;
    generateShuCertificatePDF(member, result, currentPeriod, db.config);
  };

  // CSV Export for RAT
  const handleExportRAT = () => {
    const headers = [
      'No Anggota',
      'Nama Anggota',
      'Simpanan Pokok+Wajib (Modal)',
      '% Kepemilikan Modal',
      'Jasa Simpanan (Rp)',
      'Transaksi Belanja/Pembiayaan (Rp)',
      'Jasa Transaksi (Rp)',
      'TOTAL SHU DITERIMA (Rp)',
    ];

    const rows = shuResults.map((res) => {
      const mem = members.find((m) => m.id === res.member_id);
      return [
        mem?.no_anggota || '-',
        `"${mem?.nama || '-'}"`,
        res.simpanan_pokok_wajib,
        `${res.persentase_modal}%`,
        res.jasa_simpanan,
        res.transaksi_belanja_pembiayaan,
        res.jasa_transaksi,
        res.total_shu_diterima,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_SHU_RAT_${selectedYear}_Koperasi_Taawun.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout
      allowedRoles={['admin', 'sekretaris', 'pengawas']}
      title="Pemegang Saham & Pembagian SHU"
      subtitle="Pengelolaan modal simpanan anggota, simulasi rumus persentase AD/ART, & pembagian SHU untuk RAT."
      actionButton={
        <div className="flex items-center gap-2">
          {shuResults.length > 0 && (
            <button
              onClick={handleExportRAT}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unduh Rekap RAT (CSV)</span>
            </button>
          )}
          <button
            onClick={handleCalculateShu}
            className="px-3 py-1.5 bg-[#1d5fc1] hover:bg-[#153f8a] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Hitung & Tetapkan SHU</span>
          </button>
        </div>
      }
    >
      {/* 2-Column: Left AD/ART Percentage Sliders, Right Member Capital & Dividend Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Left Column: AD/ART Formula Config (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#e3e7ee] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 text-[#1d5fc1]">
                <Sliders className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-800">
                Alokasi Persentase AD/ART
              </h2>
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                Math.abs(totalPersen - 100) < 0.01
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-red-100 text-[#d32a2a]'
              }`}
            >
              Total: {totalPersen}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Tahun Buku</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#f4f6fa] border border-[#e3e7ee] rounded-lg font-bold text-slate-800 text-xs"
              >
                <option value={2026}>Tahun Buku 2026 (Berjalan)</option>
                <option value={2025}>Tahun Buku 2025 (Final)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Total SHU Bersih (Rp)</label>
              <input
                type="number"
                step={1000000}
                value={totalShuTarget}
                onChange={(e) => setTotalShuTarget(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#f4f6fa] border border-[#e3e7ee] rounded-lg font-bold text-[#153f8a] text-xs"
              />
            </div>
          </div>

          {/* Allocation Inputs */}
          <div className="space-y-3 pt-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Dana Cadangan Koperasi</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={cadangan}
                  onChange={(e) => setCadangan(Number(e.target.value))}
                  className="w-16 px-2 py-1 bg-[#f4f6fa] border border-[#e3e7ee] rounded text-right font-bold"
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-800">Jasa Simpanan (Modal Anggota)</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={jasaSimpanan}
                  onChange={(e) => setJasaSimpanan(Number(e.target.value))}
                  className="w-16 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-right font-bold text-[#1d5fc1]"
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-800">Jasa Transaksi (Usaha/Belanja)</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={jasaTransaksi}
                  onChange={(e) => setJasaTransaksi(Number(e.target.value))}
                  className="w-16 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-right font-bold text-[#1d5fc1]"
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600">Pengurus & Pengawas</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={pengurus}
                  onChange={(e) => setPengurus(Number(e.target.value))}
                  className="w-16 px-2 py-1 bg-[#f4f6fa] border border-[#e3e7ee] rounded text-right font-bold"
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600">Dana Pendidikan Koperasi</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={pendidikan}
                  onChange={(e) => setPendidikan(Number(e.target.value))}
                  className="w-16 px-2 py-1 bg-[#f4f6fa] border border-[#e3e7ee] rounded text-right font-bold"
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600">Dana Sosial & Taawun</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={sosial}
                  onChange={(e) => setSosial(Number(e.target.value))}
                  className="w-16 px-2 py-1 bg-[#f4f6fa] border border-[#e3e7ee] rounded text-right font-bold"
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600">Dana Pembangunan Daerah Kerja</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={pembangunan}
                  onChange={(e) => setPembangunan(Number(e.target.value))}
                  className="w-16 px-2 py-1 bg-[#f4f6fa] border border-[#e3e7ee] rounded text-right font-bold"
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500">
            Sesuai kriteria penerimaan PRD: Total alokasi komponen SHU seluruh anggota sama persis dengan total SHU yang dibagikan.
          </div>
        </div>

        {/* Right Column: Capital Composition (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#e3e7ee] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-sm font-bold text-slate-800">
                Struktur Permodalan Saham Anggota (Pokok + Wajib)
              </h2>
              <span className="text-xs font-black text-[#153f8a]">
                Total: {formatRupiah(grandTotalModal)}
              </span>
            </div>

            <div className="space-y-3">
              {members.map((m) => {
                const modal = memberCapitalMap.get(m.id) || 0;
                const sharePercent = grandTotalModal > 0 ? (modal / grandTotalModal) * 100 : 0;

                return (
                  <div key={m.id} className="p-3 rounded-xl bg-slate-50/70 border border-slate-200">
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <div>
                        <span className="font-bold text-slate-800 mr-2">{m.nama}</span>
                        <span className="font-mono text-[10px] text-slate-400">{m.no_anggota}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-[#153f8a] mr-2">
                          {formatRupiah(modal)}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-[#1d5fc1]">
                          {sharePercent.toFixed(1)}% Saham
                        </span>
                      </div>
                    </div>

                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1d5fc1] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, sharePercent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SHU Distribution Result Table */}
      <div className="bg-white rounded-2xl border border-[#e3e7ee] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Hasil Pembagian SHU Anggota — Tahun Buku {selectedYear}
            </h3>
            <p className="text-xs text-slate-500">
              Hasil perhitungan otomatis dari Jasa Modal (Simpanan) & Jasa Transaksi (Belanja/Pembiayaan).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">No. Anggota</th>
                <th className="py-3 px-4">Nama Anggota</th>
                <th className="py-3 px-4 text-right">Modal Simpanan</th>
                <th className="py-3 px-4 text-center">% Modal</th>
                <th className="py-3 px-4 text-right">Hak Jasa Modal</th>
                <th className="py-3 px-4 text-right">Hak Jasa Usaha</th>
                <th className="py-3 px-4 text-right font-black text-[#153f8a]">TOTAL SHU DITERIMA</th>
                <th className="py-3 px-4 text-right">Sertifikat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shuResults.map((res) => {
                const member = members.find((m) => m.id === res.member_id);
                if (!member) return null;

                return (
                  <tr key={res.member_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{member.no_anggota}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{member.nama}</td>
                    <td className="py-3 px-4 text-right text-slate-600">{formatRupiah(res.simpanan_pokok_wajib)}</td>
                    <td className="py-3 px-4 text-center font-bold text-[#1d5fc1]">{res.persentase_modal}%</td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium">{formatRupiah(res.jasa_simpanan)}</td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium">{formatRupiah(res.jasa_transaksi)}</td>
                    <td className="py-3 px-4 text-right font-black text-sm text-[#153f8a]">
                      {formatRupiah(res.total_shu_diterima)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handlePrintShuCertificate(member, res)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 ml-auto"
                        title="Cetak Bukti SHU PDF"
                      >
                        <Printer className="w-3 h-3 text-[#1d5fc1]" />
                        <span>Cetak Bukti</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {shuResults.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Klik tombol &quot;Hitung &amp; Tetapkan SHU&quot; di atas untuk mengalkulasi pembagian SHU sesuai AD/ART.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
