'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useDatabase } from '@/lib/useDatabase';
import { formatDate, formatRupiah } from '@/lib/utils';
import { generateInvoicePDF } from '@/lib/pdf';
import { Invoice, InvoiceItem, Product, ProductSource } from '@/types';
import {
  Store,
  PlusCircle,
  Search,
  ShoppingCart,
  Printer,
  Share2,
  Package,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';

export default function TokoPage() {
  const {
    db,
    addProduct,
    updateProductStock,
    createInvoice,
    payInvoice,
  } = useDatabase();

  const [activeTab, setActiveTab] = useState<'stok' | 'invoice' | 'mutasi'>('stok');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null);

  // New Product Form State
  const [namaProduk, setNamaProduk] = useState('');
  const [kodeProduk, setKodeProduk] = useState('');
  const [kategori, setKategori] = useState('Sembako');
  const [sumber, setSumber] = useState<ProductSource>('koperasi');
  const [namaUmkm, setNamaUmkm] = useState('');
  const [hargaBeli, setHargaBeli] = useState<number>(10000);
  const [hargaJual, setHargaJual] = useState<number>(12500);
  const [stokAwal, setStokAwal] = useState<number>(20);
  const [stokMin, setStokMin] = useState<number>(5);
  const [satuan, setSatuan] = useState('Pcs');
  const [deskripsi, setDeskripsi] = useState('');

  // Stock Opname Form State
  const [stockOpType, setStockOpType] = useState<'masuk' | 'keluar' | 'opname'>('masuk');
  const [stockOpQty, setStockOpQty] = useState<number>(10);
  const [stockOpNotes, setStockOpNotes] = useState('');

  // Invoice Form State
  const [invCustomerType, setInvCustomerType] = useState<'member' | 'umum'>('member');
  const [invMemberId, setInvMemberId] = useState<string>(db?.members?.[0]?.id || 'MB-001');
  const [invCustomerName, setInvCustomerName] = useState('');
  const [invCustomerPhone, setInvCustomerPhone] = useState('');
  const [invItems, setInvItems] = useState<InvoiceItem[]>([]);
  const [invDiscount, setInvDiscount] = useState<number>(0);
  const [invPaidImmediately, setInvPaidImmediately] = useState<boolean>(true);

  const products = db?.products || [];
  const invoices = db?.invoices || [];
  const stockMoves = db?.stockMoves || [];
  const members = db?.members?.filter((m) => m.status === 'aktif') || [];

  const filteredProducts = products.filter(
    (p) =>
      p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.kategori.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaProduk) return;

    addProduct({
      kode: kodeProduk || `PRD-${Date.now().toString().slice(-4)}`,
      nama: namaProduk,
      kategori,
      sumber,
      nama_umkm: sumber === 'umkm_anggota' ? namaUmkm : undefined,
      harga_beli: hargaBeli,
      harga_jual: hargaJual,
      stok: stokAwal,
      stok_min: stokMin,
      satuan,
      deskripsi: deskripsi || 'Produk Koperasi Taawun Amal Sejahtera',
    });

    setShowAddProductModal(false);
    setNamaProduk('');
  };

  const handleStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForStock) return;

    try {
      updateProductStock(
        selectedProductForStock.id,
        stockOpType,
        stockOpQty,
        stockOpNotes || `Penyesuaian stok ${stockOpType}`
      );
      setShowStockModal(false);
      setSelectedProductForStock(null);
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah stok');
    }
  };

  const addItemToInvoice = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setInvItems((prev) => {
      const existing = prev.find((item) => item.product_id === productId);
      if (existing) {
        if (existing.qty >= prod.stok) {
          alert(`Stok produk ${prod.nama} hanya tersisa ${prod.stok}`);
          return prev;
        }
        return prev.map((item) =>
          item.product_id === productId
            ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.harga }
            : item
        );
      } else {
        if (prod.stok < 1) {
          alert(`Stok produk ${prod.nama} habis!`);
          return prev;
        }
        return [
          ...prev,
          {
            product_id: prod.id,
            nama_produk: prod.nama,
            harga: prod.harga_jual,
            qty: 1,
            subtotal: prod.harga_jual,
          },
        ];
      }
    });
  };

  const removeItemFromInvoice = (productId: string) => {
    setInvItems((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (invItems.length === 0) {
      alert('Pilih minimal 1 produk belanja');
      return;
    }

    const subtotal = invItems.reduce((acc, item) => acc + item.subtotal, 0);
    const total = Math.max(0, subtotal - invDiscount);

    let customerName = invCustomerName;
    let customerPhone = invCustomerPhone;
    let memberId: string | undefined = undefined;

    if (invCustomerType === 'member') {
      const member = members.find((m) => m.id === invMemberId);
      if (member) {
        customerName = member.nama;
        customerPhone = member.telepon;
        memberId = member.id;
      }
    }

    try {
      createInvoice(
        {
          member_id: memberId,
          nama_pelanggan: customerName,
          telepon_pelanggan: customerPhone,
          tanggal: new Date().toISOString().split('T')[0],
          jatuh_tempo: new Date().toISOString().split('T')[0],
          items: invItems,
          subtotal,
          diskon: invDiscount,
          total,
          status: invPaidImmediately ? 'lunas' : 'terkirim',
        },
        invPaidImmediately
      );

      setShowCreateInvoiceModal(false);
      setInvItems([]);
      setInvDiscount(0);
      setInvCustomerName('');
      alert('Faktur / Invoice berhasil dibuat dan stok produk telah diperbarui!');
    } catch (err: any) {
      alert(err.message || 'Gagal membuat invoice');
    }
  };

  const handlePrintInvoice = (inv: Invoice) => {
    generateInvoicePDF(inv, db.config);
  };

  const handleShareWhatsApp = (inv: Invoice) => {
    const text = `Halo Bapak/Ibu ${inv.nama_pelanggan},\nBerikut rincian Faktur ${inv.no_invoice} dari ${db.config.nama}:\nTotal Belanja: ${formatRupiah(inv.total)}\nStatus: ${inv.status.toUpperCase()}\nTerima kasih telah berbelanja di Koperasi Syariah.`;
    const url = `https://wa.me/${inv.telepon_pelanggan.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <AppLayout
      allowedRoles={['admin', 'marketing', 'bendahara', 'pengawas']}
      title="Toko, Manajemen Stok & Kasir"
      subtitle="Pengelolaan stok sembako & produk UMKM binaan, kasir POS penjualan, dan cetak invoice."
      actionButton={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateInvoiceModal(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Kasir / Buat Invoice</span>
          </button>
          <button
            onClick={() => setShowAddProductModal(true)}
            className="px-3 py-1.5 bg-[#1d5fc1] hover:bg-[#153f8a] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Tambah Produk</span>
          </button>
        </div>
      }
    >
      {/* Tabs */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('stok')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'stok' ? 'bg-[#1d5fc1] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Katalog & Stok ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('invoice')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'invoice' ? 'bg-[#1d5fc1] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Daftar Invoice ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('mutasi')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'mutasi' ? 'bg-[#1d5fc1] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Riwayat Gerak Stok
          </button>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari produk / kode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
          />
        </div>
      </div>

      {/* Tab 1: Katalog & Stok */}
      {activeTab === 'stok' && (
        <div className="bg-white rounded-2xl border border-[#e3e7ee] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Nama Produk</th>
                  <th className="py-3 px-4">Kategori / Sumber</th>
                  <th className="py-3 px-4 text-right">Harga Beli</th>
                  <th className="py-3 px-4 text-right">Harga Jual</th>
                  <th className="py-3 px-4 text-center">Stok</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((prod) => {
                  const isLowStock = prod.stok <= prod.stok_min;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{prod.kode}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{prod.nama}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-xs">{prod.deskripsi}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 mr-1.5">
                          {prod.kategori}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            prod.sumber === 'umkm_anggota'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-[#1d5fc1]'
                          }`}
                        >
                          {prod.sumber === 'umkm_anggota' ? 'UMKM' : 'Koperasi'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">{formatRupiah(prod.harga_beli)}</td>
                      <td className="py-3 px-4 text-right font-bold text-[#153f8a]">
                        {formatRupiah(prod.harga_jual)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full text-xs ${
                            isLowStock
                              ? 'bg-red-100 text-[#d32a2a] animate-pulse'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isLowStock && <AlertTriangle className="w-3 h-3" />}
                          <span>{prod.stok} {prod.satuan}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedProductForStock(prod);
                            setStockOpQty(prod.stok);
                            setShowStockModal(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors"
                        >
                          Atur Stok
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Invoices */}
      {activeTab === 'invoice' && (
        <div className="bg-white rounded-2xl border border-[#e3e7ee] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">No. Invoice</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Item Belanja</th>
                  <th className="py-3 px-4 text-right">Total Tagihan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#153f8a]">
                      {inv.no_invoice}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(inv.tanggal)}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {inv.nama_pelanggan}
                      {inv.telepon_pelanggan && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {inv.telepon_pelanggan}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {inv.items.map((i) => `${i.nama_produk} (${i.qty})`).join(', ')}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-[#153f8a]">
                      {formatRupiah(inv.total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inv.status === 'lunas'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.status !== 'lunas' && (
                          <button
                            onClick={() => payInvoice(inv.id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded transition-colors shadow-xs"
                          >
                            Lunasi
                          </button>
                        )}
                        <button
                          onClick={() => handlePrintInvoice(inv)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded"
                          title="Cetak PDF"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#1d5fc1]" />
                        </button>
                        <button
                          onClick={() => handleShareWhatsApp(inv)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded"
                          title="Bagikan ke WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Stock Movement Ledger */}
      {activeTab === 'mutasi' && (
        <div className="bg-white rounded-2xl border border-[#e3e7ee] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Nama Produk</th>
                  <th className="py-3 px-4">Tipe Mutasi</th>
                  <th className="py-3 px-4 text-right">Jumlah</th>
                  <th className="py-3 px-4 text-right">Stok Sebelum</th>
                  <th className="py-3 px-4 text-right">Stok Sesudah</th>
                  <th className="py-3 px-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockMoves.map((sm) => {
                  const prod = products.find((p) => p.id === sm.product_id);
                  return (
                    <tr key={sm.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-500">{formatDate(sm.tanggal)}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{prod?.nama || '-'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            sm.tipe === 'masuk'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sm.tipe === 'keluar'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {sm.tipe.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">{sm.jumlah}</td>
                      <td className="py-3 px-4 text-right text-slate-500">{sm.stok_sebelum}</td>
                      <td className="py-3 px-4 text-right font-bold text-[#153f8a]">{sm.stok_sesudah}</td>
                      <td className="py-3 px-4 text-slate-600">{sm.keterangan}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add Product */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-800">Tambah Produk Baru</h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Produk</label>
                  <input
                    type="text"
                    value={kodeProduk}
                    onChange={(e) => setKodeProduk(e.target.value)}
                    placeholder="Contoh: SEM-004"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Sembako">Sembako</option>
                    <option value="Herbal & Kesehatan">Herbal & Kesehatan</option>
                    <option value="Busana Muslim">Busana Muslim</option>
                    <option value="Makanan Ringan">Makanan Ringan</option>
                    <option value="Alat Tulis & Kantor">Alat Tulis & Kantor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Produk *</label>
                <input
                  type="text"
                  required
                  value={namaProduk}
                  onChange={(e) => setNamaProduk(e.target.value)}
                  placeholder="Contoh: Madu Randu Murni 650g"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sumber Produk</label>
                  <select
                    value={sumber}
                    onChange={(e) => setSumber(e.target.value as ProductSource)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="koperasi">Milik Koperasi</option>
                    <option value="umkm_anggota">Konsinyasi UMKM Anggota</option>
                  </select>
                </div>
                {sumber === 'umkm_anggota' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama UMKM Mitra</label>
                    <input
                      type="text"
                      value={namaUmkm}
                      onChange={(e) => setNamaUmkm(e.target.value)}
                      placeholder="Contoh: Dapur Berkah Bu Fatimah"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga Beli / Kulakan</label>
                  <input
                    type="number"
                    min={0}
                    value={hargaBeli}
                    onChange={(e) => setHargaBeli(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga Jual</label>
                  <input
                    type="number"
                    min={0}
                    value={hargaJual}
                    onChange={(e) => setHargaJual(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-[#153f8a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    min={0}
                    value={stokAwal}
                    onChange={(e) => setStokAwal(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stok Minimum</label>
                  <input
                    type="number"
                    min={1}
                    value={stokMin}
                    onChange={(e) => setStokMin(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={satuan}
                    onChange={(e) => setSatuan(e.target.value)}
                    placeholder="Pcs / Botol / Kg"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1d5fc1] hover:bg-[#153f8a] text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal POS / Create Invoice */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-800">
                Kasir POS Penjualan & Invoice Baru
              </h3>
              <button onClick={() => setShowCreateInvoiceModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              {/* Customer Selector */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Pelanggan</label>
                  <select
                    value={invCustomerType}
                    onChange={(e) => setInvCustomerType(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="member">Anggota Terdaftar</option>
                    <option value="umum">Pelanggan Umum / Non-Anggota</option>
                  </select>
                </div>

                {invCustomerType === 'member' ? (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pilih Anggota</label>
                    <select
                      value={invMemberId}
                      onChange={(e) => setInvMemberId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.no_anggota} — {m.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama & HP Pelanggan</label>
                    <input
                      type="text"
                      required
                      value={invCustomerName}
                      onChange={(e) => setInvCustomerName(e.target.value)}
                      placeholder="Nama Pelanggan / Majelis"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Product Picker List */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Produk untuk Ditambahkan:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {products.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      disabled={p.stok < 1}
                      onClick={() => addItemToInvoice(p.id)}
                      className={`p-2 rounded-lg text-left border text-xs transition-all ${
                        p.stok < 1
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-white hover:border-[#1d5fc1] border-slate-200 hover:shadow-xs'
                      }`}
                    >
                      <p className="font-bold text-slate-800 truncate">{p.nama}</p>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                        <span>{formatRupiah(p.harga_jual)}</span>
                        <span className="font-bold text-slate-600">Stok: {p.stok}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Invoice Items Table */}
              <div>
                <h4 className="font-bold text-slate-700 mb-1">Rincian Item Belanja:</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-2 px-3">Item</th>
                        <th className="py-2 px-3 text-right">Harga</th>
                        <th className="py-2 px-3 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                        <th className="py-2 px-3 text-center">Hapus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invItems.map((item) => (
                        <tr key={item.product_id}>
                          <td className="py-2 px-3 font-semibold text-slate-800">{item.nama_produk}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{formatRupiah(item.harga)}</td>
                          <td className="py-2 px-3 text-center font-bold text-slate-800">{item.qty}</td>
                          <td className="py-2 px-3 text-right font-bold text-[#153f8a]">
                            {formatRupiah(item.subtotal)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItemFromInvoice(item.product_id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {invItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                            Pilih produk di atas untuk memasukkan item ke invoice.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Calculation */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-800">
                    {formatRupiah(invItems.reduce((acc, item) => acc + item.subtotal, 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Diskon (Rp):</span>
                  <input
                    type="number"
                    min={0}
                    value={invDiscount}
                    onChange={(e) => setInvDiscount(Number(e.target.value))}
                    className="w-28 px-2 py-1 bg-white border border-slate-300 rounded text-right font-bold text-xs"
                  />
                </div>
                <div className="flex justify-between pt-2 border-t border-blue-200 font-extrabold text-sm text-[#153f8a]">
                  <span>Total Bayar:</span>
                  <span>
                    {formatRupiah(
                      Math.max(0, invItems.reduce((acc, item) => acc + item.subtotal, 0) - invDiscount)
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="paidImmediately"
                  checked={invPaidImmediately}
                  onChange={(e) => setInvPaidImmediately(e.target.checked)}
                  className="rounded text-[#1d5fc1] focus:ring-[#1d5fc1]"
                />
                <label htmlFor="paidImmediately" className="font-semibold text-slate-700 cursor-pointer">
                  Langsung Lunas (Otomatis mencatat penerimaan ke Buku Kas Masuk)
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  Terbitkan Invoice & Potong Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Stock Opname Adjustment */}
      {showStockModal && selectedProductForStock && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-800">
                Penyesuaian Stok: {selectedProductForStock.nama}
              </h3>
              <button onClick={() => setShowStockModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleStockAdjustment} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Stok Saat Ini:</span>
                  <span className="font-bold text-slate-800">
                    {selectedProductForStock.stok} {selectedProductForStock.satuan}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jenis Pergerakan Stok</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStockOpType('masuk')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      stockOpType === 'masuk'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Masuk (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockOpType('keluar')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      stockOpType === 'keluar'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Keluar (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockOpType('opname')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      stockOpType === 'opname'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Opname (Set)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {stockOpType === 'opname' ? 'Jumlah Stok Fisik Riil' : 'Jumlah Perubahan'}
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={stockOpQty}
                  onChange={(e) => setStockOpQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan / Alasan</label>
                <input
                  type="text"
                  value={stockOpNotes}
                  onChange={(e) => setStockOpNotes(e.target.value)}
                  placeholder="Contoh: Kulakan tambahan dari supplier / Rusak"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1d5fc1] hover:bg-[#153f8a] text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
