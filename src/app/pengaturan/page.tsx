'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useDatabase } from '@/lib/useDatabase';
import { formatDate } from '@/lib/utils';
import {
  Settings,
  ShieldCheck,
  Building2,
  FileText,
  RefreshCw,
  Clock,
  User,
  History,
} from 'lucide-react';

export default function PengaturanPage() {
  const { db, resetToDefault } = useDatabase();
  const [activeTab, setActiveTab] = useState<'profil' | 'audit'>('profil');

  const config = db?.config;
  const auditLogs = db?.auditLogs || [];

  return (
    <AppLayout
      allowedRoles={['admin']}
      title="Pengaturan Koperasi & Log Audit (M1)"
      subtitle="Konfigurasi legalitas badan hukum, rekening bank, susunan pengurus DPS, & riwayat jejak audit transaksi."
    >
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('profil')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'profil'
              ? 'bg-[#1d5fc1] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Profil & Legalitas Koperasi
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'bg-[#1d5fc1] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Jejak Audit Keuangan ({auditLogs.length})</span>
        </button>
      </div>

      {activeTab === 'profil' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-2xl border border-[#e3e7ee] p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#1d5fc1]" />
              <span>Identitas Resmi Koperasi</span>
            </h3>

            <div className="flex items-center gap-5 p-5 rounded-2xl bg-gradient-to-r from-blue-50/60 via-slate-50 to-white border border-blue-100/80 shadow-xs">
              <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200/80 p-2 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Logo Koperasi" className="w-full h-full object-contain" />
              </div>
              <div className="flex-1">
                <span className="text-[11px] uppercase font-bold text-[#1d5fc1] tracking-wider">Logo & Identitas Resmi Lembaga</span>
                <h4 className="text-lg font-bold text-[#153f8a] mt-0.5">{config?.nama}</h4>
                <p className="text-xs text-slate-500 font-medium">Koperasi Simpan Pinjam dan Pembiayaan Syariah (KSPPS)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nama Lembaga</label>
                <p className="font-bold text-slate-800 text-sm">{config?.nama}</p>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Nomor SK Badan Hukum (AHU)</label>
                <p className="font-mono font-bold text-slate-800">{config?.badan_hukum}</p>
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-slate-400 mb-1">Alamat Kantor Pusat</label>
              <p className="font-medium text-slate-800">{config?.alamat}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs pt-2 border-t border-slate-100">
              <div>
                <label className="block text-slate-400 mb-1">Nomor Telepon</label>
                <p className="font-semibold text-slate-800">{config?.telepon}</p>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Alamat Email</label>
                <p className="font-semibold text-slate-800">{config?.email}</p>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Website Resmi</label>
                <p className="font-semibold text-[#1d5fc1]">{config?.website}</p>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-800 pt-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Susunan Pengurus & Dewan Pengawas Syariah (DPS)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-400 block">Ketua Pengurus</span>
                <p className="font-bold text-slate-800 mt-0.5">{config?.ketua}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-400 block">Bendahara</span>
                <p className="font-bold text-slate-800 mt-0.5">{config?.bendahara}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-400 block">Sekretaris</span>
                <p className="font-bold text-slate-800 mt-0.5">{config?.sekretaris}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                <span className="text-[10px] text-blue-600 font-bold block">Ketua DPS (Syariah)</span>
                <p className="font-bold text-[#153f8a] mt-0.5">{config?.dps}</p>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-800 pt-4 pb-2 border-b border-slate-100">
              Rekening Bank Operasional
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {config?.rekening_bank?.map((b, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="font-bold text-slate-800">{b.bank}</p>
                  <p className="font-mono text-sm font-black text-[#153f8a] my-1">{b.no_rekening}</p>
                  <p className="text-[10px] text-slate-500">a.n {b.atas_nama}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-white rounded-2xl border border-[#e3e7ee] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100 mb-3">
                Pemeliharaan Data Demo
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Fitur ini akan mengatur ulang seluruh database lokal browser (LocalStorage) ke data awal bawaan PRD studi kasus Koperasi Taawun Amal Sejahtera.
              </p>
              <button
                onClick={() => {
                  if (confirm('Kembalikan database ke data bawaan awal PRD?')) {
                    resetToDefault();
                    alert('Data berhasil di-reset!');
                  }
                }}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-[#d32a2a] border border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Database Awal</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
              Versi Aplikasi: 1.0.0 (Next.js 15 App Router Syariah)
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-[#e3e7ee] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Jejak Audit Keuangan & Rekam Perubahan (M1 Audit Trail)
            </h3>
            <span className="text-[11px] text-slate-400">
              Otomatis & Tidak Dapat Dimodifikasi
            </span>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] sticky top-0">
                  <th className="py-2.5 px-4">Waktu</th>
                  <th className="py-2.5 px-4">Pengguna</th>
                  <th className="py-2.5 px-4">Peran</th>
                  <th className="py-2.5 px-4">Aksi</th>
                  <th className="py-2.5 px-4">Tabel</th>
                  <th className="py-2.5 px-4">Keterangan Aktivitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">{log.waktu}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-800">{log.nama_user}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {log.peran}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          log.aksi === 'APPROVAL'
                            ? 'bg-purple-100 text-purple-800'
                            : log.aksi === 'CREATE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.aksi === 'UPDATE'
                            ? 'bg-blue-100 text-[#1d5fc1]'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {log.aksi}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-500">{log.tabel}</td>
                    <td className="py-2.5 px-4 text-slate-700">{log.keterangan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
