'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Calculator,
  ShoppingBag,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  Phone,
  Building2,
  Sparkles,
  Layers,
  FileSpreadsheet,
  Share2,
} from 'lucide-react';
import { useDatabase } from '@/lib/useDatabase';
import { calculateMurabahah, formatRupiah } from '@/lib/utils';

export default function PublicLandingPage() {
  const { db, addMember } = useDatabase();

  // Simulasi Murabahah State
  const [hargaBarang, setHargaBarang] = useState<number>(10000000);
  const [uangMuka, setUangMuka] = useState<number>(1000000);
  const [marginPersen, setMarginPersen] = useState<number>(12);
  const [tenorBulan, setTenorBulan] = useState<number>(12);

  // Form Calon Anggota State
  const [nama, setNama] = useState('');
  const [nik, setNik] = useState('');
  const [alamat, setAlamat] = useState('');
  const [telepon, setTelepon] = useState('');
  const [pekerjaan, setPekerjaan] = useState('');
  const [namaAhliWaris, setNamaAhliWaris] = useState('');
  const [hubunganAhliWaris, setHubunganAhliWaris] = useState('Istri');
  const [teleponAhliWaris, setTeleponAhliWaris] = useState('');
  const [utmSource, setUtmSource] = useState('KAMP-02');
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Detect URL UTM parameters if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const utm = urlParams.get('utm') || urlParams.get('utm_source');
      if (utm) setUtmSource(utm);
    }
  }, []);

  const simulation = calculateMurabahah(hargaBarang, uangMuka, marginPersen, tenorBulan);

  const handleSubmitCalon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !telepon) {
      alert('Mohon lengkapi Nama dan Nomor Telepon');
      return;
    }

    addMember({
      nama,
      nik: nik || '3171' + Math.floor(100000000000 + Math.random() * 900000000000),
      alamat: alamat || 'Jakarta',
      telepon,
      pekerjaan: pekerjaan || 'Wiraswasta',
      tgl_bergabung: new Date().toISOString().split('T')[0],
      status: 'calon',
      ahli_waris: {
        nama: namaAhliWaris || 'Keluarga',
        hubungan: hubunganAhliWaris,
        telepon: teleponAhliWaris || telepon,
      },
      sumber_kampanye: utmSource,
      catatan: `Mendaftar dari Form Publik (Kalkulator Simulasi Pembiayaan Rp ${hargaBarang.toLocaleString('id-ID')})`,
    });

    setFormSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-[#1d5fc1] selection:text-white">
      {/* Top Ribbon */}
      <div className="h-1.5 w-full ribbon-bar shrink-0" />

      {/* Navigation Bar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 p-0.5 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Logo Koperasi Taawun Amal Sejahtera" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-sm font-bold text-[#153f8a] tracking-tight block">
                {db?.config?.nama || 'Koperasi Taawun Amal Sejahtera'}
              </span>
              <span className="text-[10px] font-semibold text-[#d32a2a] uppercase tracking-wider block">
                Transparan • Amanah • Bebas Riba
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#simulasi"
              className="hidden md:inline-flex text-xs font-semibold text-slate-600 hover:text-[#1d5fc1] px-3 py-2"
            >
              Simulasi Murabahah
            </a>
            <a
              href="#katalog"
              className="hidden md:inline-flex text-xs font-semibold text-slate-600 hover:text-[#1d5fc1] px-3 py-2"
            >
              Katalog Produk
            </a>
            <a
              href="#daftar"
              className="hidden md:inline-flex text-xs font-semibold text-slate-600 hover:text-[#1d5fc1] px-3 py-2"
            >
              Daftar Anggota
            </a>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1d5fc1] hover:bg-[#153f8a] text-white text-xs font-bold shadow-sm transition-all hover:shadow-md"
            >
              <span>Portal Pengurus</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50 py-16 sm:py-24 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 border border-blue-200 text-[#1d5fc1] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Koperasi Syariah Berizin Resmi Kementerian Hukum & HAM</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-[#153f8a] tracking-tight leading-[1.15]">
                Solusi Ekonomi Berkah & Pembiayaan Syariah Tanpa Riba
              </h1>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Tumbuh dan maju bersama <strong>{db?.config?.nama}</strong>. Nikmati kemudahan simpanan bagi hasil berkah, pembiayaan usaha murabahah transparan, serta marketplace produk UMKM anggota.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#simulasi"
                  className="px-5 py-3 rounded-xl bg-[#1d5fc1] hover:bg-[#153f8a] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Hitung Simulasi Pembiayaan</span>
                </a>
                <a
                  href="#daftar"
                  className="px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm border border-slate-300 transition-all flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4 text-[#d32a2a]" />
                  <span>Daftar Calon Anggota</span>
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80">
                <div>
                  <p className="text-lg sm:text-2xl font-black text-[#153f8a]">100%</p>
                  <p className="text-[11px] text-slate-500 font-medium">Sesuai Fatwa DSN MUI</p>
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-black text-[#153f8a]">
                    {db?.members?.filter((m) => m.status === 'aktif').length || 5}+
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">Anggota Aktif Produktif</p>
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-black text-[#d32a2a]">0% Denda Riba</p>
                  <p className="text-[11px] text-slate-500 font-medium">Prinsip Taawun Berkah</p>
                </div>
              </div>
            </div>

            {/* Quick Interactive Card (Preview M4 Murabahah Calculator) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-xl border border-slate-200/80">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50 text-[#1d5fc1]">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Simulasi Cepat Murabahah</h2>
                    <p className="text-[11px] text-slate-500">Transparan & angsuran pasti flat</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Akad Jual Beli
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <div className="flex justify-between font-medium text-slate-600 mb-1">
                    <span>Harga Barang / Modal Usaha</span>
                    <span className="font-bold text-slate-800">{formatRupiah(hargaBarang)}</span>
                  </div>
                  <input
                    type="range"
                    min={1000000}
                    max={50000000}
                    step={500000}
                    value={hargaBarang}
                    onChange={(e) => setHargaBarang(Number(e.target.value))}
                    className="w-full accent-[#1d5fc1] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-medium text-slate-600 mb-1">
                    <span>Uang Muka (DP)</span>
                    <span className="font-bold text-slate-800">{formatRupiah(uangMuka)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={hargaBarang * 0.5}
                    step={250000}
                    value={uangMuka}
                    onChange={(e) => setUangMuka(Number(e.target.value))}
                    className="w-full accent-[#1d5fc1] cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Tenor (Bulan)</label>
                    <select
                      value={tenorBulan}
                      onChange={(e) => setTenorBulan(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    >
                      <option value={6}>6 Bulan</option>
                      <option value={12}>12 Bulan (1 Thn)</option>
                      <option value={18}>18 Bulan</option>
                      <option value={24}>24 Bulan (2 Thn)</option>
                      <option value={36}>36 Bulan (3 Thn)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Margin Flat/Tahun</label>
                    <input
                      type="number"
                      value={marginPersen}
                      onChange={(e) => setMarginPersen(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Calculation Output Box */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#1d5fc1]/5 to-[#153f8a]/10 border border-blue-200/80 space-y-2">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Pokok Pembiayaan:</span>
                    <span className="font-bold text-slate-800">{formatRupiah(simulation.pokok)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Total Margin ({marginPersen}%):</span>
                    <span className="font-bold text-emerald-700">+{formatRupiah(simulation.marginNominal)}</span>
                  </div>
                  <div className="pt-2 border-t border-blue-200 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-[#153f8a]">Angsuran per Bulan:</span>
                    <span className="text-base font-extrabold text-[#1d5fc1]">
                      {formatRupiah(simulation.angsuranPerBulan)}
                    </span>
                  </div>
                </div>

                <a
                  href="#daftar"
                  className="w-full py-2.5 bg-[#1d5fc1] hover:bg-[#153f8a] text-white font-bold rounded-xl text-center block text-xs shadow-sm transition-all"
                >
                  Ajukan Pembiayaan Ini Sekarang
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skema Akad Syariah Section */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-[#1d5fc1] uppercase tracking-wider">
              Prinsip & Akad Syariah
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#153f8a] mt-1">
              Akad Finansial yang Diterapkan di Koperasi
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Berdasarkan pedoman Dewan Syariah Nasional (DSN-MUI) untuk memastikan keberkahan dan keadilan bagi semua anggota.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#f4f6fa] border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1d5fc1] flex items-center justify-center font-bold mb-4">
                MR
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">Murabahah (Jual Beli)</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Koperasi membelikan barang yang Anda butuhkan lalu menjualnya kepada Anda dengan margin keuntungan yang disepakati bersama secara transparan.
              </p>
              <span className="text-[11px] font-bold text-[#1d5fc1] bg-blue-50 px-2 py-1 rounded">
                Cocok untuk: Modal Kerja, Alat & Stok
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-[#f4f6fa] border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-4">
                MD
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">Mudharabah (Bagi Hasil)</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Kerja sama modal usaha antara koperasi dan anggota dengan sistem nisbah bagi hasil keuntungan riil (misal 45% : 55%).
              </p>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                Cocok untuk: Simpanan Investasi & Usaha
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-[#f4f6fa] border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-4">
                QD
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">Qardh (Pinjaman Kebajikan)</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Pinjaman dana talangan darurat tanpa tambahan biaya atau margin (0%), murni membantu anggota yang membutuhkan.
              </p>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded">
                Cocok untuk: Dana Talangan & Darurat
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Katalog Produk Toko & UMKM (M6, M8) */}
      <section id="katalog" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold text-[#1d5fc1] uppercase tracking-wider">
                Produk Koperasi & UMKM Anggota
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#153f8a] mt-1">
                Katalog Produk Berkah Koperasi
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Dukung perputaran ekonomi umat dengan berbelanja kebutuhan pokok dan produk binaan UMKM anggota.
              </p>
            </div>
            <a
              href="https://wa.me/6281288997722?text=Halo%20Admin%20Koperasi%20Taawun,%20saya%20tertarik%20dengan%20produk%20katalog"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Pesan via WhatsApp</span>
            </a>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {db?.products?.map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#1d5fc1]">
                      {prod.kategori}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        prod.sumber === 'umkm_anggota'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {prod.sumber === 'umkm_anggota' ? 'UMKM Anggota' : 'Koperasi'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 leading-snug mb-1">
                    {prod.nama}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">
                    {prod.deskripsi}
                  </p>

                  {prod.nama_umkm && (
                    <p className="text-[10px] text-slate-400 font-medium mb-3">
                      Produsen: <span className="text-slate-600 font-semibold">{prod.nama_umkm}</span>
                    </p>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Harga / {prod.satuan}</span>
                    <span className="text-sm font-extrabold text-[#153f8a]">
                      {formatRupiah(prod.harga_jual)}
                    </span>
                  </div>
                  <a
                    href={`https://wa.me/6281288997722?text=Halo%20Admin,%20saya%20mau%20pesan%20${encodeURIComponent(prod.nama)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-[#1d5fc1] hover:bg-[#153f8a] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Beli</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Pendaftaran Calon Anggota (M2, M8) */}
      <section id="daftar" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#1d5fc1]/5 via-white to-slate-50 border border-blue-200 rounded-3xl p-6 sm:p-10 shadow-lg">
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="text-xs font-bold text-[#1d5fc1] uppercase tracking-wider">
                Pendaftaran Calon Anggota
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#153f8a] mt-1">
                Bergabung Bersama Koperasi Taawun
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2">
                Isi formulir online di bawah ini. Pengurus koperasi kami akan segera menghubungi Anda untuk proses aktivasi dan buku simpanan.
              </p>
              {utmSource && (
                <div className="mt-3 inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#1d5fc1]">
                  Kode Kampanye Promosi: {utmSource}
                </div>
              )}
            </div>

            {formSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center animate-in fade-in zoom-in-95">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-emerald-900 mb-1">
                  Pendaftaran Berhasil Dikirim!
                </h3>
                <p className="text-xs text-emerald-700 max-w-md mx-auto mb-4">
                  Data Anda telah masuk ke sistem pengurus Koperasi Taawun Amal Sejahtera. Petugas kami akan memverifikasi dan menghubungi nomor WhatsApp Anda.
                </p>
                <button
                  onClick={() => setFormSubmitted(false)}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition-colors"
                >
                  Kirim Pendaftaran Lain
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitCalon} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap (sesuai KTP) *
                    </label>
                    <input
                      type="text"
                      required
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      placeholder="Contoh: Muhammad Ihsan"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1d5fc1] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor WhatsApp / HP *
                    </label>
                    <input
                      type="tel"
                      required
                      value={telepon}
                      onChange={(e) => setTelepon(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1d5fc1] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor Induk Kependudukan (NIK)
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={nik}
                      onChange={(e) => setNik(e.target.value)}
                      placeholder="16 digit NIK KTP"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1d5fc1] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pekerjaan / Bidang Usaha
                    </label>
                    <input
                      type="text"
                      value={pekerjaan}
                      onChange={(e) => setPekerjaan(e.target.value)}
                      placeholder="Contoh: Pedagang Sembako / Karyawan"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1d5fc1] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Domisili
                  </label>
                  <input
                    type="text"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="Alamat lengkap tempat tinggal"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1d5fc1] focus:outline-hidden"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-700 mb-2">Informasi Ahli Waris / Penjamin</p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <input
                        type="text"
                        value={namaAhliWaris}
                        onChange={(e) => setNamaAhliWaris(e.target.value)}
                        placeholder="Nama Ahli Waris"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <select
                        value={hubunganAhliWaris}
                        onChange={(e) => setHubunganAhliWaris(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                      >
                        <option value="Istri">Istri</option>
                        <option value="Suami">Suami</option>
                        <option value="Anak">Anak</option>
                        <option value="Orang Tua">Orang Tua</option>
                        <option value="Saudara Kandung">Saudara Kandung</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="tel"
                        value={teleponAhliWaris}
                        onChange={(e) => setTeleponAhliWaris(e.target.value)}
                        placeholder="No. HP Ahli Waris"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#1d5fc1] hover:bg-[#153f8a] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Kirim Formulir Pendaftaran</span>
                  </button>
                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    Data pribadi Anda terlindungi sesuai UU Perlindungan Data Pribadi (UU PDP).
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="Logo Koperasi Taawun Amal Sejahtera" className="w-full h-full object-contain" />
                </div>
                <span className="font-bold text-white text-base">
                  {db?.config?.nama}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Koperasi syariah yang berfokus pada penguatan ekonomi umat melalui prinsip taawun, keadilan bagi hasil, dan bebas dari riba/gharar/maysir.
              </p>
              <p className="text-[11px] text-slate-500">
                Badan Hukum: {db?.config?.badan_hukum}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                Kontak & Kantor
              </h4>
              <p className="text-xs text-slate-400 mb-1">{db?.config?.alamat}</p>
              <p className="text-xs text-slate-400 mb-1">Telp / WA: {db?.config?.telepon}</p>
              <p className="text-xs text-slate-400">Email: {db?.config?.email}</p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                Dewan Pengawas Syariah (DPS)
              </h4>
              <p className="text-xs text-slate-400 mb-2">{db?.config?.dps}</p>
              <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Terverifikasi Syariah</span>
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
            <span>© 2026 {db?.config?.nama}. Seluruh hak cipta dilindungi.</span>
            <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
              Masuk Portal Pengurus →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
