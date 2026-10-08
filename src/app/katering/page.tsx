'use client';

import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  Phone,
  FileText,
  DollarSign,
  CheckCircle2,
  ChefHat,
  Truck,
  PackageCheck,
  AlertCircle,
  TrendingUp,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Edit2,
  Trash2,
  X,
  Share2,
  Filter,
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { useDatabase } from '@/lib/useDatabase';
import { CateringCategory, CateringOrder, CateringOrderStatus, CateringPackage } from '@/types';
import { formatDate, formatRupiah } from '@/lib/utils';
import { generateCateringOrderPDF } from '@/lib/pdf';

export default function CateringPage() {
  const {
    db,
    createCateringOrder,
    updateCateringOrderStatus,
    payCateringOrder,
    addCateringPackage,
    updateCateringPackage,
    deleteCateringPackage,
  } = useDatabase();

  const [activeTab, setActiveTab] = useState<'pesanan' | 'buat' | 'paket' | 'laporan'>('pesanan');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('semua');
  const [categoryFilter, setCategoryFilter] = useState<string>('semua');

  // Modal State untuk Bayar DP/Pelunasan
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<CateringOrder | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'dp' | 'pelunasan'>('dp');

  // Modal State untuk Tambah/Edit Paket
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CateringPackage | null>(null);
  const [pkgNama, setPkgNama] = useState('');
  const [pkgKategori, setPkgKategori] = useState<CateringCategory>('nasi_box');
  const [pkgDeskripsi, setPkgDeskripsi] = useState('');
  const [pkgHarga, setPkgHarga] = useState<number>(25000);
  const [pkgMinOrder, setPkgMinOrder] = useState<number>(20);
  const [pkgMenuItems, setPkgMenuItems] = useState<string>('');
  const [pkgUmkm, setPkgUmkm] = useState('');
  const [pkgHalal, setPkgHalal] = useState('');

  // Form State untuk Buat Pesanan Baru
  const [isMember, setIsMember] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [namaPemesan, setNamaPemesan] = useState('');
  const [telepon, setTelepon] = useState('');
  const [alamat, setAlamat] = useState('');
  const [tglAcara, setTglAcara] = useState('');
  const [waktuAcara, setWaktuAcara] = useState('11:00 WIB');
  const [jenisAcara, setJenisAcara] = useState('Pengajian & Majelis Taklim');
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    db?.cateringPackages?.[0]?.id || 'CAT-01'
  );
  const [porsi, setPorsi] = useState<number>(50);
  const [customMenu, setCustomMenu] = useState('');
  const [dpType, setDpType] = useState<'30' | '50' | '100' | 'custom'>('50');
  const [customDpAmount, setCustomDpAmount] = useState<number>(0);
  const [payDpNow, setPayDpNow] = useState(true);
  const [akad, setAkad] = useState<'istishna' | 'salam'>('istishna');
  const [catatanOrder, setCatatanOrder] = useState('');

  // Perhitungan Form Pesanan
  const currentSelectedPkg = db?.cateringPackages?.find((p) => p.id === selectedPackageId);
  const calculatedTotal = (currentSelectedPkg?.harga_per_porsi || 0) * (porsi || 0);

  const calculatedDp =
    dpType === '100'
      ? calculatedTotal
      : dpType === '50'
      ? Math.round(calculatedTotal * 0.5)
      : dpType === '30'
      ? Math.round(calculatedTotal * 0.3)
      : customDpAmount;

  const calculatedSisa = Math.max(0, calculatedTotal - calculatedDp);

  // Filter Orders
  const orders = (db?.cateringOrders || []).filter((ord) => {
    const matchSearch =
      ord.nama_pemesan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.no_pesanan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.nama_paket.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.jenis_acara.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = statusFilter === 'semua' || ord.status_pesanan === statusFilter;
    return matchSearch && matchStatus;
  });

  // KPI Calculations
  const totalOrders = db?.cateringOrders?.length || 0;
  const activeOrders = db?.cateringOrders?.filter((o) => o.status_pesanan !== 'selesai' && o.status_pesanan !== 'batal').length || 0;
  const totalOmset = db?.cateringOrders?.filter((o) => o.status_pesanan !== 'batal').reduce((sum, o) => sum + o.total_harga, 0) || 0;
  const totalDpReceived = db?.cateringOrders?.reduce((sum, o) => sum + o.uang_muka_dp, 0) || 0;
  const totalPiutang = db?.cateringOrders?.filter((o) => o.status_pesanan !== 'batal').reduce((sum, o) => sum + o.sisa_tagihan, 0) || 0;

  // Handle Pilih Member
  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    const member = db?.members?.find((m) => m.id === memberId);
    if (member) {
      setNamaPemesan(member.nama);
      setTelepon(member.telepon);
      setAlamat(member.alamat);
    }
  };

  // Submit Buat Pesanan Baru
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelectedPkg) {
      alert('Pilih paket katering terlebih dahulu');
      return;
    }
    if (!namaPemesan || !telepon || !alamat || !tglAcara) {
      alert('Mohon lengkapi data pemesan, tanggal acara, dan alamat pengiriman.');
      return;
    }
    if (porsi < (currentSelectedPkg.min_order || 1)) {
      alert(`Jumlah porsi minimal untuk paket ini adalah ${currentSelectedPkg.min_order} porsi.`);
      return;
    }

    createCateringOrder(
      {
        member_id: isMember && selectedMemberId ? selectedMemberId : undefined,
        nama_pemesan: namaPemesan,
        telepon,
        alamat_pengiriman: alamat,
        tgl_acara: tglAcara,
        waktu_acara: waktuAcara,
        jenis_acara: jenisAcara,
        package_id: currentSelectedPkg.id,
        nama_paket: currentSelectedPkg.nama,
        porsi,
        harga_satuan: currentSelectedPkg.harga_per_porsi,
        menu_custom: customMenu,
        total_harga: calculatedTotal,
        uang_muka_dp: calculatedDp,
        sisa_tagihan: calculatedSisa,
        status_pesanan: 'masuk',
        status_pembayaran: calculatedSisa === 0 ? 'lunas' : calculatedDp > 0 ? 'dp_lunas' : 'belum_dp',
        akad,
        catatan: catatanOrder,
      },
      payDpNow && calculatedDp > 0
    );

    alert('Pesanan katering berhasil dicatat!');
    setActiveTab('pesanan');
    // Reset form
    setNamaPemesan('');
    setTelepon('');
    setAlamat('');
    setTglAcara('');
    setCustomMenu('');
    setCatatanOrder('');
  };

  // Submit Modal Paket
  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgNama || pkgHarga <= 0) {
      alert('Nama paket dan harga per porsi harus diisi dengan benar');
      return;
    }

    const items = pkgMenuItems
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingPackage) {
      updateCateringPackage(editingPackage.id, {
        nama: pkgNama,
        kategori: pkgKategori,
        deskripsi: pkgDeskripsi,
        harga_per_porsi: pkgHarga,
        min_order: pkgMinOrder,
        menu_items: items,
        nama_umkm: pkgUmkm || 'Katering Mandiri Koperasi',
        sertifikasi_halal: pkgHalal,
      });
    } else {
      addCateringPackage({
        nama: pkgNama,
        kategori: pkgKategori,
        deskripsi: pkgDeskripsi,
        harga_per_porsi: pkgHarga,
        min_order: pkgMinOrder,
        menu_items: items,
        nama_umkm: pkgUmkm || 'Katering Mandiri Koperasi',
        sertifikasi_halal: pkgHalal,
      });
    }

    setShowPackageModal(false);
    setEditingPackage(null);
  };

  const handleOpenEditPackage = (pkg: CateringPackage) => {
    setEditingPackage(pkg);
    setPkgNama(pkg.nama);
    setPkgKategori(pkg.kategori);
    setPkgDeskripsi(pkg.deskripsi);
    setPkgHarga(pkg.harga_per_porsi);
    setPkgMinOrder(pkg.min_order);
    setPkgMenuItems(pkg.menu_items.join('\n'));
    setPkgUmkm(pkg.nama_umkm);
    setPkgHalal(pkg.sertifikasi_halal || '');
    setShowPackageModal(true);
  };

  const handleOpenNewPackage = () => {
    setEditingPackage(null);
    setPkgNama('');
    setPkgKategori('nasi_box');
    setPkgDeskripsi('');
    setPkgHarga(25000);
    setPkgMinOrder(20);
    setPkgMenuItems('Nasi Putih Wangi\nAyam Goreng Berkah\nSayur Tumis\nSambal & Kerupuk');
    setPkgUmkm('');
    setPkgHalal('');
    setShowPackageModal(true);
  };

  // Submit Modal Pembayaran
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForPayment) return;
    if (paymentAmount <= 0) {
      alert('Nominal pembayaran harus lebih dari 0');
      return;
    }

    payCateringOrder(selectedOrderForPayment.id, paymentAmount, paymentType);
    alert(`Pembayaran ${paymentType === 'dp' ? 'DP' : 'Pelunasan'} berhasil dicatat ke Buku Kas!`);
    setSelectedOrderForPayment(null);
  };

  // Helper Badge Status
  const getStatusBadge = (status: CateringOrderStatus) => {
    switch (status) {
      case 'masuk':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3" />
            <span>Pesanan Masuk</span>
          </span>
        );
      case 'dikonfirmasi':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-[#1d5fc1] border border-blue-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>Dikonfirmasi</span>
          </span>
        );
      case 'dimasak':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
            <ChefHat className="w-3 h-3" />
            <span>Sedang Dimasak</span>
          </span>
        );
      case 'dikirim':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Truck className="w-3 h-3" />
            <span>Dalam Pengiriman</span>
          </span>
        );
      case 'selesai':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
            <PackageCheck className="w-3 h-3" />
            <span>Selesai</span>
          </span>
        );
      case 'batal':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200">
            <X className="w-3 h-3" />
            <span>Dibatalkan</span>
          </span>
        );
    }
  };

  const getPaymentBadge = (status: CateringOrder['status_pembayaran']) => {
    switch (status) {
      case 'lunas':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">LUNAS</span>;
      case 'dp_lunas':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#1d5fc1]">DP DITERIMA</span>;
      case 'belum_dp':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">BELUM DP</span>;
    }
  };

  return (
    <AppLayout title="Unit Usaha Katering Syariah">
      <div className="space-y-6">
        {/* Top Banner & Header */}
        <div className="bg-gradient-to-r from-[#153f8a] via-[#1d5fc1] to-[#2563eb] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Unit Bisnis Kuliner & Katering Berkah UMKM Syariah</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Manajemen Katering & Pesanan Acara
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
              Layanan katering Nasi Box, Aqiqah Syar&apos;i, Prasmanan Walimah, dan Snack Box dengan prinsip Akad Istishna &amp; Salam tanpa riba.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setActiveTab('buat')}
              className="px-4 py-2.5 bg-white text-[#153f8a] hover:bg-blue-50 font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-[#d32a2a]" />
              <span>Buat Pesanan Katering</span>
            </button>
            <button
              onClick={handleOpenNewPackage}
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl text-xs backdrop-blur-sm transition-all flex items-center gap-2"
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Tambah Paket Menu</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Pesanan Aktif</span>
              <div className="p-2 rounded-xl bg-blue-50 text-[#1d5fc1]">
                <ChefHat className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-800 mt-2">{activeOrders}</p>
            <p className="text-[11px] text-slate-500 mt-1">Dari total {totalOrders} pesanan</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Omset Katering</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-[#153f8a] mt-2">{formatRupiah(totalOmset)}</p>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">Akumulasi pesanan sah</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">DP & Kas Masuk</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-800 mt-2">{formatRupiah(totalDpReceived)}</p>
            <p className="text-[11px] text-slate-500 mt-1">Tercatat di Buku Kas</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Sisa Piutang Klien</span>
              <div className="p-2 rounded-xl bg-red-50 text-[#d32a2a]">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-[#d32a2a] mt-2">{formatRupiah(totalPiutang)}</p>
            <p className="text-[11px] text-slate-500 mt-1">Menunggu pelunasan acara</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pesanan')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'pesanan'
                ? 'border-b-2 border-[#1d5fc1] text-[#1d5fc1]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Daftar Pesanan &amp; Jadwal Acara ({db?.cateringOrders?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('buat')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'buat'
                ? 'border-b-2 border-[#1d5fc1] text-[#1d5fc1]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Form Buat Pesanan Baru</span>
          </button>

          <button
            onClick={() => setActiveTab('paket')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'paket'
                ? 'border-b-2 border-[#1d5fc1] text-[#1d5fc1]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Katalog Paket &amp; Menu UMKM ({db?.cateringPackages?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('laporan')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'laporan'
                ? 'border-b-2 border-[#1d5fc1] text-[#1d5fc1]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Bagi Hasil Mitra UMKM</span>
          </button>
        </div>

        {/* TAB 1: DAFTAR PESANAN */}
        {activeTab === 'pesanan' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari pemesan, nomor pesanan, acara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1d5fc1] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-500 font-medium shrink-0">Status:</span>
                {(['semua', 'masuk', 'dikonfirmasi', 'dimasak', 'dikirim', 'selesai', 'batal'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                      statusFilter === st
                        ? 'bg-[#1d5fc1] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            <div className="grid gap-4">
              {orders.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 text-slate-400">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-40 text-slate-400" />
                  <p className="text-sm font-bold text-slate-600">Belum ada pesanan katering ditemukan</p>
                  <p className="text-xs text-slate-400 mt-1">Gunakan tombol &quot;Buat Pesanan Katering&quot; untuk mencatat pesanan baru.</p>
                </div>
              ) : (
                orders.map((order) => {
                  const isLunas = order.sisa_tagihan === 0;

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#153f8a]">
                              {order.no_pesanan}
                            </span>
                            {getStatusBadge(order.status_pesanan)}
                            {getPaymentBadge(order.status_pembayaran)}
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              Akad {order.akad}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-800">
                            {order.nama_pemesan}
                            {order.member_id && (
                              <span className="text-xs font-normal text-slate-500 ml-1.5">
                                (Anggota Koperasi)
                              </span>
                            )}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-[#1d5fc1]" />
                              Acara: <strong className="text-slate-700">{formatDate(order.tgl_acara)} ({order.waktu_acara})</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              {order.telepon}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-red-500" />
                              {order.alamat_pengiriman}
                            </span>
                          </div>
                        </div>

                        {/* Financial Snapshot */}
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex lg:flex-col justify-between items-end gap-1 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Total Nilai Pesanan</span>
                            <span className="text-base font-black text-[#153f8a]">
                              {formatRupiah(order.total_harga)}
                            </span>
                          </div>
                          <div className="text-right text-xs">
                            <span className="text-slate-500">DP: {formatRupiah(order.uang_muka_dp)}</span>
                            <span className="text-slate-300 mx-1">|</span>
                            <span className={order.sisa_tagihan > 0 ? 'text-[#d32a2a] font-bold' : 'text-emerald-700 font-bold'}>
                              Sisa: {formatRupiah(order.sisa_tagihan)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Detail Menu & Actions */}
                      <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="text-xs space-y-1 max-w-2xl">
                          <p className="text-slate-700">
                            <strong>Paket:</strong> {order.nama_paket} ({order.porsi} Porsi @ {formatRupiah(order.harga_satuan)})
                          </p>
                          {order.menu_custom && (
                            <p className="text-slate-500 italic">
                              <strong>Permintaan Khusus:</strong> {order.menu_custom}
                            </p>
                          )}
                          {order.catatan && (
                            <p className="text-slate-500">
                              <strong>Catatan:</strong> {order.catatan}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Quick Workflow Status */}
                          {order.status_pesanan === 'masuk' && (
                            <button
                              onClick={() => updateCateringOrderStatus(order.id, 'dikonfirmasi')}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                            >
                              Konfirmasi Pesanan
                            </button>
                          )}
                          {order.status_pesanan === 'dikonfirmasi' && (
                            <button
                              onClick={() => updateCateringOrderStatus(order.id, 'dimasak')}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <ChefHat className="w-3.5 h-3.5" />
                              <span>Mulai Masak</span>
                            </button>
                          )}
                          {order.status_pesanan === 'dimasak' && (
                            <button
                              onClick={() => updateCateringOrderStatus(order.id, 'dikirim')}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Kirim Pesanan</span>
                            </button>
                          )}
                          {order.status_pesanan === 'dikirim' && (
                            <button
                              onClick={() => updateCateringOrderStatus(order.id, 'selesai')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Selesaikan</span>
                            </button>
                          )}

                          {/* Tombol Bayar DP / Pelunasan */}
                          {!isLunas && (
                            <button
                              onClick={() => {
                                setSelectedOrderForPayment(order);
                                setPaymentType(order.uang_muka_dp === 0 ? 'dp' : 'pelunasan');
                                setPaymentAmount(order.sisa_tagihan);
                              }}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Catat Bayar</span>
                            </button>
                          )}

                          {/* Tombol Cetak PDF */}
                          <button
                            onClick={() => generateCateringOrderPDF(order, db.config)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                            title="Unduh Surat Pesanan & Faktur Akad Syariah PDF"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#1d5fc1]" />
                            <span>PDF Akad</span>
                          </button>

                          {/* WhatsApp Client */}
                          <a
                            href={`https://wa.me/${order.telepon.replace(/^0/, '62')}?text=Assalamu'alaikum%20Wr.%20Wb.%20Bpk/Ibu%20${encodeURIComponent(order.nama_pemesan)},%20kami%20dari%20Katering%20Koperasi%20Taawun%20Amal%20Sejahtera%20terkait%20pesanan%20katering%20${encodeURIComponent(order.no_pesanan)}.`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>WA</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: BUAT PESANAN BARU / KALKULATOR */}
        {activeTab === 'buat' && (
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6">
                <div className="p-2 rounded-xl bg-blue-50 text-[#1d5fc1]">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Formulir Pesanan Katering Syariah</h2>
                  <p className="text-xs text-slate-500">Mencatat pesanan dengan Akad Istishna (Pesanan Pembuatan) atau Akad Salam</p>
                </div>
              </div>

              <form onSubmit={handleCreateOrder} className="space-y-4">
                {/* Pemesan: Anggota atau Non-Anggota */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Status Pemesan:</label>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="isMember"
                          checked={!isMember}
                          onChange={() => setIsMember(false)}
                          className="accent-[#1d5fc1]"
                        />
                        <span>Umum / Non-Anggota</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="isMember"
                          checked={isMember}
                          onChange={() => setIsMember(true)}
                          className="accent-[#1d5fc1]"
                        />
                        <span>Anggota Koperasi</span>
                      </label>
                    </div>
                  </div>

                  {isMember && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Pilih Anggota:</label>
                      <select
                        value={selectedMemberId}
                        onChange={(e) => handleSelectMember(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                      >
                        <option value="">-- Pilih Anggota Koperasi --</option>
                        {db?.members
                          ?.filter((m) => m.status === 'aktif')
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.no_anggota} - {m.nama} ({m.telepon})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pemesan / Lembaga *</label>
                    <input
                      type="text"
                      required
                      value={namaPemesan}
                      onChange={(e) => setNamaPemesan(e.target.value)}
                      placeholder="Contoh: Bpk. Ahmad Hidayat"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1d5fc1] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp / HP *</label>
                    <input
                      type="tel"
                      required
                      value={telepon}
                      onChange={(e) => setTelepon(e.target.value)}
                      placeholder="Contoh: 08123456789"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1d5fc1] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap Pengiriman Acara *</label>
                  <input
                    type="text"
                    required
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="Contoh: Masjid Al-Ikhlas, Jl. Melati No. 12, Jakarta"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1d5fc1] focus:outline-hidden"
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Acara *</label>
                    <input
                      type="date"
                      required
                      value={tglAcara}
                      onChange={(e) => setTglAcara(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1d5fc1] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Waktu / Jam Pengiriman</label>
                    <input
                      type="text"
                      value={waktuAcara}
                      onChange={(e) => setWaktuAcara(e.target.value)}
                      placeholder="Contoh: 11:30 WIB"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1d5fc1] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Acara</label>
                    <select
                      value={jenisAcara}
                      onChange={(e) => setJenisAcara(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    >
                      <option value="Walimah & Pernikahan">Walimah &amp; Pernikahan</option>
                      <option value="Aqiqah Syar'i">Aqiqah Syar&apos;i</option>
                      <option value="Pengajian & Majelis Taklim">Pengajian &amp; Majelis Taklim</option>
                      <option value="Rapat Kantor / Seminar">Rapat Kantor / Seminar</option>
                      <option value="Tasyakuran & Milad">Tasyakuran &amp; Milad</option>
                      <option value="Katering Harian Rantangan">Katering Harian Rantangan</option>
                    </select>
                  </div>
                </div>

                {/* Pilih Paket & Porsi */}
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/80 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#153f8a] mb-1">Pilih Paket Katering *</label>
                      <select
                        value={selectedPackageId}
                        onChange={(e) => setSelectedPackageId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      >
                        {db?.cateringPackages?.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.nama} - {formatRupiah(pkg.harga_per_porsi)} / porsi
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#153f8a] mb-1">
                        Jumlah Porsi * (Min: {currentSelectedPkg?.min_order || 1} Porsi)
                      </label>
                      <input
                        type="number"
                        min={currentSelectedPkg?.min_order || 1}
                        value={porsi}
                        onChange={(e) => setPorsi(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Catatan / Permintaan Khusus Menu (Pilihan Lauk, Sambal Pisah, dll):
                    </label>
                    <input
                      type="text"
                      value={customMenu}
                      onChange={(e) => setCustomMenu(e.target.value)}
                      placeholder="Contoh: Ayam Bakar Madu, sambal dipisah, ekstra kerupuk"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Ketentuan Akad & Pembayaran DP */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Akad Syariah</label>
                    <select
                      value={akad}
                      onChange={(e) => setAkad(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    >
                      <option value="istishna">Istishna (Jual Beli Pesanan Pembuatan Makanan)</option>
                      <option value="salam">Salam (Pesanan dengan Pelunasan Penuh di Awal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Pilihan Uang Muka (DP)</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['30', '50', '100', 'custom'] as const).map((dp) => (
                        <button
                          key={dp}
                          type="button"
                          onClick={() => setDpType(dp)}
                          className={`py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                            dpType === dp
                              ? 'bg-[#1d5fc1] text-white border-[#1d5fc1]'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {dp === 'custom' ? 'Custom' : `${dp}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {dpType === 'custom' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nominal DP Custom (Rp)</label>
                    <input
                      type="number"
                      value={customDpAmount}
                      onChange={(e) => setCustomDpAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="payDpNow"
                    checked={payDpNow}
                    onChange={(e) => setPayDpNow(e.target.checked)}
                    className="accent-[#1d5fc1] w-4 h-4 rounded"
                  />
                  <label htmlFor="payDpNow" className="text-xs text-slate-700 font-medium cursor-pointer">
                    Catat penerimaan DP ({formatRupiah(calculatedDp)}) langsung ke <strong>Buku Kas Masuk</strong> saat pesanan dibuat
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#1d5fc1] hover:bg-[#153f8a] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Simpan &amp; Terbitkan Pesanan Katering</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Preview Calculation Box */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Ringkasan Estimasi Biaya
                </h3>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Paket:</span>
                    <span className="font-bold text-slate-800 truncate max-w-[160px] text-right">
                      {currentSelectedPkg?.nama || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Harga Satuan:</span>
                    <span className="font-bold text-slate-800">
                      {formatRupiah(currentSelectedPkg?.harga_per_porsi || 0)} / porsi
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Jumlah Porsi:</span>
                    <span className="font-bold text-slate-800">{porsi} Porsi</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-xs">
                    <span className="font-bold text-slate-700">Total Tagihan:</span>
                    <span className="text-sm font-black text-[#153f8a]">
                      {formatRupiah(calculatedTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-blue-700 font-semibold">
                    <span>Uang Muka (DP):</span>
                    <span>{formatRupiah(calculatedDp)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-red-600 font-semibold">
                    <span>Sisa Pelunasan:</span>
                    <span>{formatRupiah(calculatedSisa)}</span>
                  </div>
                </div>

                {/* Mitra UMKM Card */}
                {currentSelectedPkg && (
                  <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                      <ChefHat className="w-4 h-4 text-emerald-600" />
                      <span>Mitra Penyedia Katering:</span>
                    </div>
                    <p className="text-emerald-900 font-semibold">{currentSelectedPkg.nama_umkm}</p>
                    {currentSelectedPkg.sertifikasi_halal && (
                      <p className="text-[10px] text-emerald-700">
                        Halal ID: {currentSelectedPkg.sertifikasi_halal}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: KATALOG PAKET & MITRA */}
        {activeTab === 'paket' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-xs text-slate-500 font-medium shrink-0">Kategori:</span>
                {(['semua', 'nasi_box', 'aqiqah', 'prasmanan', 'snack_box', 'tumpeng', 'harian'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                      categoryFilter === cat
                        ? 'bg-[#1d5fc1] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <button
                onClick={handleOpenNewPackage}
                className="px-4 py-2 bg-[#1d5fc1] hover:bg-[#153f8a] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Paket Baru</span>
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(db?.cateringPackages || [])
                .filter((p) => categoryFilter === 'semua' || p.kategori === categoryFilter)
                .map((pkg) => (
                  <div
                    key={pkg.id}
                    className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#1d5fc1] uppercase tracking-wider">
                          {pkg.kategori.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditPackage(pkg)}
                            className="p-1 text-slate-400 hover:text-[#1d5fc1] transition-colors"
                            title="Edit Paket"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus paket ${pkg.nama}?`)) {
                                deleteCateringPackage(pkg.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            title="Hapus Paket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-800 mb-1">{pkg.nama}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{pkg.deskripsi}</p>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <p className="text-[11px] font-bold text-slate-700">Daftar Menu Hidangan:</p>
                        <ul className="text-[11px] text-slate-600 space-y-0.5">
                          {pkg.menu_items.slice(0, 5).map((item, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1d5fc1]" />
                              <span className="truncate">{item}</span>
                            </li>
                          ))}
                          {pkg.menu_items.length > 5 && (
                            <li className="text-[10px] text-slate-400 italic">
                              +{pkg.menu_items.length - 5} menu lainnya...
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Harga / Porsi</span>
                          <span className="text-sm font-extrabold text-[#153f8a]">
                            {formatRupiah(pkg.harga_per_porsi)}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          Min. {pkg.min_order} Porsi
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">
                        Mitra: <strong className="text-slate-700">{pkg.nama_umkm}</strong>
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 4: LAPORAN BAGI HASIL MITRA UMKM */}
        {activeTab === 'laporan' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-800">Rekap Kemitraan &amp; Bagi Hasil Katering UMKM</h2>
              <p className="text-xs text-slate-500">Distribusi pesanan katering dan kontribusi margin unit usaha ke koperasi</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
                <span className="text-[11px] text-blue-700 font-bold uppercase">Total Pesanan Selesai/Aktif</span>
                <p className="text-xl font-extrabold text-[#153f8a] mt-1">{totalOrders} Pesanan</p>
              </div>
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <span className="text-[11px] text-emerald-700 font-bold uppercase">Omset Kuliner Anggota</span>
                <p className="text-xl font-extrabold text-emerald-800 mt-1">{formatRupiah(totalOmset)}</p>
              </div>
              <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200">
                <span className="text-[11px] text-purple-700 font-bold uppercase">Estimasi Margin SHU (10%)</span>
                <p className="text-xl font-extrabold text-purple-900 mt-1">{formatRupiah(Math.round(totalOmset * 0.1))}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-4">No. Pesanan</th>
                    <th className="py-3 px-4">Pemesan</th>
                    <th className="py-3 px-4">Paket &amp; UMKM</th>
                    <th className="py-3 px-4 text-center">Porsi</th>
                    <th className="py-3 px-4 text-right">Nilai Pesanan</th>
                    <th className="py-3 px-4 text-right">Bagi Hasil Mitra (90%)</th>
                    <th className="py-3 px-4 text-right">Jasa Koperasi (10%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(db?.cateringOrders || []).map((o) => {
                    const porsiTotal = o.total_harga;
                    const porsiUmkm = Math.round(porsiTotal * 0.9);
                    const porsiKop = porsiTotal - porsiUmkm;

                    return (
                      <tr key={o.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-mono font-bold text-[#153f8a]">{o.no_pesanan}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{o.nama_pemesan}</td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-700 block">{o.nama_paket}</span>
                          <span className="text-[10px] text-slate-400">Akad {o.akad.toUpperCase()}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">{o.porsi}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800">{formatRupiah(porsiTotal)}</td>
                        <td className="py-3 px-4 text-right text-emerald-700 font-bold">{formatRupiah(porsiUmkm)}</td>
                        <td className="py-3 px-4 text-right text-[#1d5fc1] font-bold">{formatRupiah(porsiKop)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL PEMBAYARAN DP / PELUNASAN */}
        {selectedOrderForPayment && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">
                  Catat Pembayaran Katering ({selectedOrderForPayment.no_pesanan})
                </h3>
                <button
                  onClick={() => setSelectedOrderForPayment(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                <p className="text-slate-600">
                  Pemesan: <strong>{selectedOrderForPayment.nama_pemesan}</strong>
                </p>
                <p className="text-slate-600">
                  Total Tagihan: <strong>{formatRupiah(selectedOrderForPayment.total_harga)}</strong>
                </p>
                <p className="text-slate-600">
                  DP Masuk: <strong className="text-emerald-700">{formatRupiah(selectedOrderForPayment.uang_muka_dp)}</strong>
                </p>
                <p className="text-slate-600">
                  Sisa Tagihan: <strong className="text-[#d32a2a]">{formatRupiah(selectedOrderForPayment.sisa_tagihan)}</strong>
                </p>
              </div>

              <form onSubmit={handleProcessPayment} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Pembayaran</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="dp">Pembayaran Uang Muka (DP)</option>
                    <option value="pelunasan">Pelunasan Tagihan Acara</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Pembayaran (Rp) *</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-[#153f8a]"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForPayment(null)}
                    className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-[#1d5fc1] hover:bg-[#153f8a] text-white font-bold rounded-xl text-xs shadow-sm"
                  >
                    Simpan Kas Masuk
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL TAMBAH/EDIT PAKET KATERING */}
        {showPackageModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">
                  {editingPackage ? 'Edit Paket Katering' : 'Tambah Paket Katering Baru'}
                </h3>
                <button
                  onClick={() => setShowPackageModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSavePackage} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Paket Katering *</label>
                  <input
                    type="text"
                    required
                    value={pkgNama}
                    onChange={(e) => setPkgNama(e.target.value)}
                    placeholder="Contoh: Paket Nasi Box Berkah Spesial"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                    <select
                      value={pkgKategori}
                      onChange={(e) => setPkgKategori(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    >
                      <option value="nasi_box">Nasi Box</option>
                      <option value="aqiqah">Aqiqah Syar&apos;i</option>
                      <option value="prasmanan">Prasmanan Walimah</option>
                      <option value="snack_box">Snack Box</option>
                      <option value="tumpeng">Tumpeng</option>
                      <option value="harian">Katering Harian / Rantang</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Harga / Porsi (Rp) *</label>
                    <input
                      type="number"
                      required
                      min={5000}
                      value={pkgHarga}
                      onChange={(e) => setPkgHarga(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Minimal Order (Porsi)</label>
                    <input
                      type="number"
                      min={1}
                      value={pkgMinOrder}
                      onChange={(e) => setPkgMinOrder(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mitra UMKM Penyedia</label>
                    <input
                      type="text"
                      value={pkgUmkm}
                      onChange={(e) => setPkgUmkm(e.target.value)}
                      placeholder="Contoh: Dapur Berkah Bu Dewi"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat Paket</label>
                  <input
                    type="text"
                    value={pkgDeskripsi}
                    onChange={(e) => setPkgDeskripsi(e.target.value)}
                    placeholder="Deskripsi layanan dan keunggulan paket"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Daftar Menu Hidangan (1 Menu per baris)
                  </label>
                  <textarea
                    rows={4}
                    value={pkgMenuItems}
                    onChange={(e) => setPkgMenuItems(e.target.value)}
                    placeholder="Nasi Liwet Gurih&#10;Ayam Bakar Madu&#10;Sambal Goreng Ati&#10;Kerupuk Udang"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. Sertifikasi Halal BPJPH / MUI</label>
                  <input
                    type="text"
                    value={pkgHalal}
                    onChange={(e) => setPkgHalal(e.target.value)}
                    placeholder="Contoh: ID3111000189201024"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPackageModal(false)}
                    className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-[#1d5fc1] hover:bg-[#153f8a] text-white font-bold rounded-xl text-xs shadow-sm"
                  >
                    Simpan Paket
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
