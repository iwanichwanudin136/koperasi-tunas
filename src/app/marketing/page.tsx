'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useDatabase } from '@/lib/useDatabase';
import { formatDate } from '@/lib/utils';
import {
  Megaphone,
  PlusCircle,
  Copy,
  Share2,
  ExternalLink,
  Users,
  Target,
  CheckCircle2,
} from 'lucide-react';

export default function MarketingPage() {
  const { db } = useDatabase();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const campaigns = db?.campaigns || [];
  const members = db?.members || [];

  // Hitung jumlah prospek/calon anggota per kampanye
  const getLeadCount = (campaignCode: string) => {
    return members.filter((m) => m.sumber_kampanye === campaignCode).length;
  };

  const copyToClipboard = (campaignCode: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://taawunamal.co.id';
    const link = `${origin}/?utm=${campaignCode}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(campaignCode);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <AppLayout
      allowedRoles={['admin', 'marketing', 'pengawas']}
      title="Marketing & Pelacakan Kampanye"
      subtitle="Pengelolaan kampanye digital, tautan promosi UTM, dan pelacakan calon anggota masuk per kanal."
    >
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-[#e3e7ee] shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Total Kampanye
          </span>
          <p className="text-2xl font-black text-slate-800">{campaigns.length} Kampanye</p>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
            {campaigns.filter((c) => c.status === 'aktif').length} Sedang Berjalan Aktif
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#e3e7ee] shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Calon Anggota Masuk (Prospek)
          </span>
          <p className="text-2xl font-black text-[#1d5fc1]">
            {members.filter((m) => !!m.sumber_kampanye).length} Prospek
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Tercatat via tautan UTM landing page</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#e3e7ee] shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Total Kunjungan Tautan
          </span>
          <p className="text-2xl font-black text-[#153f8a]">
            {campaigns.reduce((acc, c) => acc + (c.total_klik || 0), 0)} Klik
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">WhatsApp, Instagram & Brosur</span>
        </div>
      </div>

      {/* Campaign List */}
      <div className="bg-white rounded-2xl border border-[#e3e7ee] p-5 shadow-xs mb-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <h2 className="text-sm font-bold text-slate-800">
            Daftar Kampanye & Pelacakan Sumber Prospek (M8)
          </h2>
        </div>

        <div className="space-y-4">
          {campaigns.map((camp) => {
            const leads = getLeadCount(camp.kode);
            const conversionRate = camp.total_klik && camp.total_klik > 0 ? (leads / camp.total_klik) * 100 : 0;

            return (
              <div
                key={camp.id}
                className="p-4 rounded-2xl bg-[#f8fafc] border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{camp.nama}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#1d5fc1]">
                      {camp.kanal}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        camp.status === 'aktif'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {camp.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Periode: {formatDate(camp.periode_mulai)} s.d {formatDate(camp.periode_selesai)}
                  </p>
                  <p className="text-[11px] font-mono text-slate-600 font-semibold">
                    Kode Parameter: <span className="text-[#1d5fc1]">?utm={camp.kode}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right text-xs">
                    <span className="text-[10px] text-slate-400 block">Prospek Masuk</span>
                    <span className="text-base font-black text-[#153f8a]">
                      {leads} <span className="text-[11px] font-normal text-slate-400">/ {camp.target_prospek} target</span>
                    </span>
                  </div>

                  <button
                    onClick={() => copyToClipboard(camp.kode)}
                    className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    {copiedCode === camp.kode ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Salin Tautan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
