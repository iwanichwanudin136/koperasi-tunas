'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useDatabase } from '@/lib/useDatabase';
import { formatDate, formatRupiah } from '@/lib/utils';
import { Member, MemberStatus } from '@/types';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Phone,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export default function AnggotaPage() {
  const { db, addMember, updateMember, approveCandidate } = useDatabase();
  const [activeTab, setActiveTab] = useState<'aktif' | 'calon' | 'semua'>('aktif');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [nama, setNama] = useState('');
  const [nik, setNik] = useState('');
  const [alamat, setAlamat] = useState('');
  const [telepon, setTelepon] = useState('');
  const [pekerjaan, setPekerjaan] = useState('');
  const [namaAhliWaris, setNamaAhliWaris] = useState('');
  const [hubunganAhliWaris, setHubunganAhliWaris] = useState('Istri');
  const [teleponAhliWaris, setTeleponAhliWaris] = useState('');
  const [status, setStatus] = useState<MemberStatus>('aktif');

  const members = db?.members || [];

  const filteredMembers = members.filter((m) => {
    const matchesTab =
      activeTab === 'semua' ? true : activeTab === 'calon' ? m.status === 'calon' : m.status === 'aktif';
    const matchesSearch =
      m.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.no_anggota.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.nik.includes(searchQuery) ||
      m.pekerjaan.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !telepon) {
      alert('Nama dan Nomor Telepon wajib diisi.');
      return;
    }

    addMember({
      nama,
      nik: nik || '3171' + Math.floor(100000000000 + Math.random() * 900000000000),
      alamat: alamat || 'DKI Jakarta',
      telepon,
      pekerjaan: pekerjaan || 'Wiraswasta',
      tgl_bergabung: new Date().toISOString().split('T')[0],
      status,
      ahli_waris: {
        nama: namaAhliWaris || 'Keluarga',
        hubungan: hubunganAhliWaris,
        telepon: teleponAhliWaris || telepon,
      },
    });

    // Reset Form
    setNama('');
    setNik('');
    setAlamat('');
    setTelepon('');
    setPekerjaan('');
    setNamaAhliWaris('');
    setTeleponAhliWaris('');
    setShowAddModal(false);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['No Anggota', 'Nama', 'NIK', 'Telepon', 'Pekerjaan', 'Status', 'Tgl Bergabung', 'Sumber Kampanye'];
    const rows = filteredMembers.map((m) => [
      m.no_anggota,
      `"${m.nama}"`,
      `'${m.nik}`,
      m.telepon,
      `"${m.pekerjaan}"`,
      m.status,
      m.tgl_bergabung,
      m.sumber_kampanye || '-',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Anggota_Koperasi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import Simulation
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      let successCount = 0;

      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.replace(/["']/g, '').trim());
        if (cols.length >= 2 && cols[1]) {
          addMember({
            nama: cols[1],
            nik: cols[2] || '3171' + Math.floor(100000000000 + Math.random() * 900000000000),
            alamat: 'Jakarta',
            telepon: cols[3] || '0812' + Math.floor(10000000 + Math.random() * 90000000),
            pekerjaan: cols[4] || 'Wiraswasta',
            tgl_bergabung: new Date().toISOString().split('T')[0],
            status: 'aktif',
            ahli_waris: { nama: 'Keluarga', hubungan: 'Istri', telepon: '081200000000' },
          });
          successCount++;
        }
      }
      alert(`Berhasil mengimpor ${successCount} data anggota ke sistem!`);
    };
    reader.readAsText(file);
  };

  return (
    <AppLayout
      allowedRoles={['admin', 'sekretaris', 'pengawas']}
      title="Manajemen Anggota & Calon Anggota"
      subtitle="Pengelolaan data anggota, persetujuan pendaftaran calon anggota, ahli waris, serta impor/ekspor data."
      actionButton={
        <div className="flex items-center gap-2">
          <label className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Impor CSV</span>
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-[#1d5fc1] hover:bg-[#153f8a] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Anggota</span>
          </button>
        </div>
      }
    >
      {/* Tabs Filter */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('aktif')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'aktif'
                ? 'bg-[#1d5fc1] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Anggota Aktif ({members.filter((m) => m.status === 'aktif').length})
          </button>
          <button
            onClick={() => setActiveTab('calon')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'calon'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Calon Anggota</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-[#d32a2a] font-black">
              {members.filter((m) => m.status === 'calon').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('semua')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'semua'
                ? 'bg-[#1d5fc1] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua ({members.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama / NIK / No Anggota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#1d5fc1]"
          />
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-[#e3e7ee] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">No. Anggota</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">NIK</th>
                <th className="py-3 px-4">Telepon / WA</th>
                <th className="py-3 px-4">Pekerjaan</th>
                <th className="py-3 px-4">Tgl Bergabung</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#153f8a]">
                    {member.no_anggota}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-800">{member.nama}</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-xs">{member.alamat}</p>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{member.nik}</td>
                  <td className="py-3 px-4 text-slate-700">{member.telepon}</td>
                  <td className="py-3 px-4 text-slate-600">{member.pekerjaan}</td>
                  <td className="py-3 px-4 text-slate-500">{formatDate(member.tgl_bergabung)}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        member.status === 'aktif'
                          ? 'bg-emerald-100 text-emerald-800'
                          : member.status === 'calon'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {member.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {member.status === 'calon' && (
                        <button
                          onClick={() => approveCandidate(member.id)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded flex items-center gap-1 transition-colors"
                          title="Setujui Menjadi Anggota Aktif"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Setujui</span>
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedMember(member)}
                        className="p-1 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                        title="Lihat Profil Lengkap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada data anggota yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Member */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1d5fc1] flex items-center justify-center font-bold">
                  {selectedMember.no_anggota.substring(0, 2)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{selectedMember.nama}</h3>
                  <p className="text-[11px] font-mono text-slate-400">{selectedMember.no_anggota}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 block">NIK</span>
                  <span className="font-mono font-bold text-slate-700">{selectedMember.nik}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Nomor Telepon</span>
                  <span className="font-bold text-slate-700">{selectedMember.telepon}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Pekerjaan</span>
                  <span className="font-bold text-slate-700">{selectedMember.pekerjaan}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Tanggal Bergabung</span>
                  <span className="font-bold text-slate-700">{formatDate(selectedMember.tgl_bergabung)}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">Alamat Domisili</span>
                <p className="text-slate-700 font-medium">{selectedMember.alamat}</p>
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl">
                <span className="text-[11px] font-bold text-[#153f8a] block mb-1">
                  Ahli Waris / Penjamin
                </span>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Nama</span>
                    <span className="font-semibold text-slate-700">{selectedMember.ahli_waris.nama}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Hubungan</span>
                    <span className="font-semibold text-slate-700">{selectedMember.ahli_waris.hubungan}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Kontak</span>
                    <span className="font-semibold text-slate-700">{selectedMember.ahli_waris.telepon}</span>
                  </div>
                </div>
              </div>

              {selectedMember.sumber_kampanye && (
                <div className="text-[11px] text-slate-500">
                  Sumber Registrasi / Kampanye: <span className="font-bold text-[#1d5fc1]">{selectedMember.sumber_kampanye}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Member */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-800">Tambah Anggota Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Nama sesuai KTP"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIK (16 Digit)</label>
                  <input
                    type="text"
                    maxLength={16}
                    value={nik}
                    onChange={(e) => setNik(e.target.value)}
                    placeholder="3171xxxxxxxxxxxx"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / HP *</label>
                  <input
                    type="tel"
                    required
                    value={telepon}
                    onChange={(e) => setTelepon(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pekerjaan / Usaha</label>
                  <input
                    type="text"
                    value={pekerjaan}
                    onChange={(e) => setPekerjaan(e.target.value)}
                    placeholder="Wiraswasta / Pedagang"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Awal</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as MemberStatus)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="aktif">Aktif (A-xxxx)</option>
                    <option value="calon">Calon Anggota (C-xxxx)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Domisili</label>
                <input
                  type="text"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Jl. Lengkap, Kota"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 border-t border-slate-200">
                <p className="font-bold text-slate-700 mb-2">Ahli Waris</p>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={namaAhliWaris}
                    onChange={(e) => setNamaAhliWaris(e.target.value)}
                    placeholder="Nama Ahli Waris"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <select
                    value={hubunganAhliWaris}
                    onChange={(e) => setHubunganAhliWaris(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Istri">Istri</option>
                    <option value="Suami">Suami</option>
                    <option value="Anak">Anak</option>
                    <option value="Orang Tua">Orang Tua</option>
                  </select>
                  <input
                    type="tel"
                    value={teleponAhliWaris}
                    onChange={(e) => setTeleponAhliWaris(e.target.value)}
                    placeholder="No. HP Ahli Waris"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
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
                  Simpan Anggota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
