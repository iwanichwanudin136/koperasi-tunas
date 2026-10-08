'use client';

import {
  AuditLog,
  Campaign,
  CashEntry,
  CateringOrder,
  CateringPackage,
  CooperativeConfig,
  Financing,
  Installment,
  Invoice,
  Member,
  Product,
  SavingsProduct,
  SavingsTransaction,
  ShuPeriod,
  ShuResult,
  StockMove,
  UserProfile,
  UserRole,
} from '@/types';
import { generateInstallmentSchedule } from './utils';

export interface AppDatabase {
  currentUser: UserProfile;
  config: CooperativeConfig;
  members: Member[];
  savingsProducts: SavingsProduct[];
  savingsTransactions: SavingsTransaction[];
  financings: Financing[];
  installments: Installment[];
  products: Product[];
  stockMoves: StockMove[];
  invoices: Invoice[];
  cashEntries: CashEntry[];
  shuPeriods: ShuPeriod[];
  shuResults: ShuResult[];
  campaigns: Campaign[];
  auditLogs: AuditLog[];
  cateringPackages: CateringPackage[];
  cateringOrders: CateringOrder[];
}


const DEFAULT_CONFIG: CooperativeConfig = {
  nama: 'Koperasi Taawun Amal Sejahtera',
  badan_hukum: 'AHU-0012948.AH.01.29.TAHUN 2024',
  alamat: 'Jl. Pemuda No. 45, Kompleks Pusat Niaga Syariah, Jakarta',
  telepon: '0812-8899-7722',
  email: 'sekretariat@taawunamal.co.id',
  website: 'https://taawunamal.co.id',
  ketua: 'H. Ahmad Fauzi, S.E., M.M.',
  bendahara: 'Hj. Siti Rahmawati, S.E. (Ak.)',
  sekretaris: 'Muhammad Rizky Pratama, S.Kom.',
  dps: 'Dr. KH. Abdullah Syakir, M.A. (DPS)',
  rekening_bank: [
    { bank: 'Bank Syariah Indonesia (BSI)', no_rekening: '7144298102', atas_nama: 'Koperasi Taawun Amal Sejahtera' },
    { bank: 'Bank Muamalat', no_rekening: '3010098412', atas_nama: 'Koperasi Taawun Amal Sejahtera' },
  ],
};

const DEFAULT_USERS: Record<UserRole, UserProfile> = {
  admin: {
    id: 'USR-01',
    nama: 'H. Ahmad Fauzi (Ketua)',
    email: 'ketua@taawunamal.co.id',
    peran: 'admin',
    telepon: '0811-2233-4455',
  },
  sekretaris: {
    id: 'USR-02',
    nama: 'Muhammad Rizky (Sekretaris)',
    email: 'sekretaris@taawunamal.co.id',
    peran: 'sekretaris',
    telepon: '0812-3344-5566',
  },
  bendahara: {
    id: 'USR-03',
    nama: 'Hj. Siti Rahmawati (Bendahara)',
    email: 'bendahara@taawunamal.co.id',
    peran: 'bendahara',
    telepon: '0813-4455-6677',
  },
  marketing: {
    id: 'USR-04',
    nama: 'Farhan Maulana (Marketing & Toko)',
    email: 'toko@taawunamal.co.id',
    peran: 'marketing',
    telepon: '0814-5566-7788',
  },
  pengawas: {
    id: 'USR-05',
    nama: 'Dr. KH. Abdullah Syakir (Pengawas DPS)',
    email: 'dps@taawunamal.co.id',
    peran: 'pengawas',
    telepon: '0815-6677-8899',
  },
  publik: {
    id: 'USR-06',
    nama: 'Pengunjung Publik',
    email: 'tamu@gmail.com',
    peran: 'publik',
  },
};

const SEED_SAVINGS_PRODUCTS: SavingsProduct[] = [
  {
    id: 'SP-01',
    nama: 'Simpanan Pokok',
    jenis: 'pokok',
    akad: 'wadiah',
    minimal_setoran: 100000,
    deskripsi: 'Simpanan awal sekali saat resmi menjadi anggota koperasi.',
  },
  {
    id: 'SP-02',
    nama: 'Simpanan Wajib',
    jenis: 'wajib',
    akad: 'wadiah',
    minimal_setoran: 50000,
    deskripsi: 'Simpanan rutin bulanan yang disetorkan oleh setiap anggota aktif.',
  },
  {
    id: 'SP-03',
    nama: 'Simpanan Sukarela Wadiah (Yad Dhamanah)',
    jenis: 'sukarela',
    akad: 'wadiah',
    minimal_setoran: 10000,
    deskripsi: 'Tabungan titipan yang dapat disetor dan ditarik sewaktu-waktu.',
  },
  {
    id: 'SP-04',
    nama: 'Simpanan Sukarela Mudharabah Berjangka',
    jenis: 'sukarela',
    akad: 'mudharabah',
    minimal_setoran: 500000,
    nisbah_anggota: 45,
    nisbah_koperasi: 55,
    deskripsi: 'Investasi bagi hasil riil dengan nisbah 45% anggota : 55% koperasi.',
  },
];

const SEED_MEMBERS: Member[] = [
  {
    id: 'MB-001',
    no_anggota: 'A-0001',
    nama: 'Bambang Supriyanto',
    nik: '3171021405820003',
    alamat: 'Jl. Kemang Timur No. 12, Jakarta Selatan',
    telepon: '081298765431',
    pekerjaan: 'Wiraswasta Kuliner',
    tgl_bergabung: '2025-01-10',
    status: 'aktif',
    ahli_waris: { nama: 'Dewi Lestari', hubungan: 'Istri', telepon: '081298765432' },
    sumber_kampanye: 'KAMP-01',
  },
  {
    id: 'MB-002',
    no_anggota: 'A-0002',
    nama: 'Fatimah Az-Zahra',
    nik: '3171054812890001',
    alamat: 'Jl. Margonda Raya No. 88, Depok',
    telepon: '081387654321',
    pekerjaan: 'Guru & Pengrajin Hijab',
    tgl_bergabung: '2025-02-15',
    status: 'aktif',
    ahli_waris: { nama: 'Usman Ali', hubungan: 'Suami', telepon: '081387654322' },
    sumber_kampanye: 'KAMP-02',
  },
  {
    id: 'MB-003',
    no_anggota: 'A-0003',
    nama: 'Umar Abdullah, S.T.',
    nik: '3171092307900005',
    alamat: 'Komplek Pondok Indah Blok C-4, Jakarta Selatan',
    telepon: '081198765433',
    pekerjaan: 'Teknisi IT & Toko Komputer',
    tgl_bergabung: '2025-03-01',
    status: 'aktif',
    ahli_waris: { nama: 'Aisyah Putri', hubungan: 'Istri', telepon: '081198765434' },
    sumber_kampanye: 'KAMP-01',
  },
  {
    id: 'MB-004',
    no_anggota: 'A-0004',
    nama: 'Nurul Hidayati',
    nik: '3171046109920002',
    alamat: 'Jl. Percetakan Negara II No. 17, Jakarta Pusat',
    telepon: '081587654344',
    pekerjaan: 'Pedagang Grosir Sembako',
    tgl_bergabung: '2025-04-12',
    status: 'aktif',
    ahli_waris: { nama: 'Ibrahim Hidayat', hubungan: 'Anak', telepon: '081587654345' },
  },
  {
    id: 'MB-005',
    no_anggota: 'A-0005',
    nama: 'Hendra Gunawan',
    nik: '3171081103850007',
    alamat: 'Jl. Otista III No. 5B, Jakarta Timur',
    telepon: '081787654355',
    pekerjaan: 'Pengusaha Sablon & Konveksi',
    tgl_bergabung: '2025-05-20',
    status: 'aktif',
    ahli_waris: { nama: 'Maya Sari', hubungan: 'Istri', telepon: '081787654356' },
  },
  {
    id: 'MB-006',
    no_anggota: 'C-0001',
    nama: 'Zainal Abidin (Calon)',
    nik: '3171072901950004',
    alamat: 'Jl. Warung Buncit No. 20, Jakarta Selatan',
    telepon: '081898765466',
    pekerjaan: 'Karyawan Swasta',
    tgl_bergabung: '2026-09-28',
    status: 'calon',
    ahli_waris: { nama: 'Siti Aminah', hubungan: 'Ibu', telepon: '081898765467' },
    sumber_kampanye: 'KAMP-02',
    catatan: 'Mendaftar via Website Publik (Kalkulator Simulasi Murabahah)',
  },
  {
    id: 'MB-007',
    no_anggota: 'C-0002',
    nama: 'Rahmawati Putri (Calon)',
    nik: '3171035508980006',
    alamat: 'Jl. Radio Dalam No. 14, Jakarta Selatan',
    telepon: '081998765477',
    pekerjaan: 'Usaha Kue Kering',
    tgl_bergabung: '2026-10-01',
    status: 'calon',
    ahli_waris: { nama: 'Budi Santoso', hubungan: 'Ayah', telepon: '081998765478' },
    sumber_kampanye: 'KAMP-01',
    catatan: 'Tertarik pembiayaan modal usaha murabahah',
  },
];

const SEED_SAVINGS_TX: SavingsTransaction[] = [
  {
    id: 'STX-001',
    no_transaksi: 'STX-2026-0001',
    member_id: 'MB-001',
    product_id: 'SP-01',
    tipe: 'setor',
    jumlah: 100000,
    tanggal: '2025-01-10',
    keterangan: 'Setoran Simpanan Pokok Anggota Baru',
    dibuat_oleh: 'Hj. Siti Rahmawati',
  },
  {
    id: 'STX-002',
    no_transaksi: 'STX-2026-0002',
    member_id: 'MB-001',
    product_id: 'SP-02',
    tipe: 'setor',
    jumlah: 1000000,
    tanggal: '2026-08-01',
    keterangan: 'Akumulasi Simpanan Wajib 20 Bulan',
    dibuat_oleh: 'Hj. Siti Rahmawati',
  },
  {
    id: 'STX-003',
    no_transaksi: 'STX-2026-0003',
    member_id: 'MB-001',
    product_id: 'SP-03',
    tipe: 'setor',
    jumlah: 2500000,
    tanggal: '2026-09-15',
    keterangan: 'Setoran Tabungan Sukarela Wadiah',
    dibuat_oleh: 'Hj. Siti Rahmawati',
  },
  {
    id: 'STX-004',
    no_transaksi: 'STX-2026-0004',
    member_id: 'MB-002',
    product_id: 'SP-01',
    tipe: 'setor',
    jumlah: 100000,
    tanggal: '2025-02-15',
    keterangan: 'Setoran Simpanan Pokok',
    dibuat_oleh: 'Hj. Siti Rahmawati',
  },
  {
    id: 'STX-005',
    no_transaksi: 'STX-2026-0005',
    member_id: 'MB-002',
    product_id: 'SP-02',
    tipe: 'setor',
    jumlah: 950000,
    tanggal: '2026-09-01',
    keterangan: 'Akumulasi Simpanan Wajib',
    dibuat_oleh: 'Hj. Siti Rahmawati',
  },
  {
    id: 'STX-006',
    no_transaksi: 'STX-2026-0006',
    member_id: 'MB-002',
    product_id: 'SP-04',
    tipe: 'setor',
    jumlah: 5000000,
    tanggal: '2026-06-01',
    keterangan: 'Investasi Mudharabah Berjangka 12 Bulan',
    dibuat_oleh: 'Hj. Siti Rahmawati',
  },
  {
    id: 'STX-007',
    no_transaksi: 'STX-2026-0007',
    member_id: 'MB-003',
    product_id: 'SP-01',
    tipe: 'setor',
    jumlah: 100000,
    tanggal: '2025-03-01',
    keterangan: 'Setoran Simpanan Pokok',
    dibuat_oleh: 'Hj. Siti Rahmawati',
  },
  {
    id: 'STX-008',
    no_transaksi: 'STX-2026-0008',
    member_id: 'MB-003',
    product_id: 'SP-02',
    tipe: 'setor',
    jumlah: 900000,
    tanggal: '2026-09-01',
    keterangan: 'Simpanan Wajib',
    dibuat_oleh: 'Hj. Siti Rahmawati',
  },
  {
    id: 'STX-009',
    no_transaksi: 'STX-2026-0009',
    member_id: 'MB-003',
    product_id: 'SP-03',
    tipe: 'setor',
    jumlah: 1200000,
    tanggal: '2026-08-10',
    keterangan: 'Setoran Sukarela',
    dibuat_oleh: 'Hj. Siti Rahmawati',
  },
  {
    id: 'STX-010',
    no_transaksi: 'STX-2026-0010',
    member_id: 'MB-003',
    product_id: 'SP-03',
    tipe: 'tarik',
    jumlah: 200000,
    tanggal: '2026-09-20',
    keterangan: 'Penarikan Sukarela untuk Keperluan Pribadi',
    dibuat_oleh: 'Hj. Siti Rahmawati',
  },
  {
    id: 'STX-011',
    no_transaksi: 'STX-2026-0011',
    member_id: 'MB-004',
    product_id: 'SP-01',
    tipe: 'setor',
    jumlah: 100000,
    tanggal: '2025-04-12',
    keterangan: 'Setoran Simpanan Pokok',
    dibuat_oleh: 'Hj. Siti Rahmawati',
  },
  {
    id: 'STX-012',
    no_transaksi: 'STX-2026-0012',
    member_id: 'MB-004',
    product_id: 'SP-02',
    tipe: 'setor',
    jumlah: 850000,
    tanggal: '2026-09-01',
    keterangan: 'Simpanan Wajib',
    dibuat_oleh: 'Hj. Siti Rahmawati',
  },
  {
    id: 'STX-013',
    no_transaksi: 'STX-2026-0013',
    member_id: 'MB-005',
    product_id: 'SP-01',
    tipe: 'setor',
    jumlah: 100000,
    tanggal: '2025-05-20',
    keterangan: 'Setoran Simpanan Pokok',
    dibuat_oleh: 'Hj. Siti Rahmawati',
  },
  {
    id: 'STX-014',
    no_transaksi: 'STX-2026-0014',
    member_id: 'MB-005',
    product_id: 'SP-02',
    tipe: 'setor',
    jumlah: 800000,
    tanggal: '2026-09-01',
    keterangan: 'Simpanan Wajib',
    dibuat_oleh: 'Hj. Siti Rahmawati',
  },
];

// Seed Financings (Murabahah, Qardh)
const SEED_FINANCINGS: Financing[] = [
  {
    id: 'FIN-001',
    no_akad: 'AKAD-MRB-2026-001',
    member_id: 'MB-001',
    akad: 'murabahah',
    tujuan_pengajuan: 'Pengadaan Freezer & Peralatan Restoran Kuliner',
    nama_barang: 'Chest Freezer Modena 300L + Kompor High Pressure',
    harga_barang: 10000000,
    uang_muka: 1000000,
    pokok: 9000000,
    margin_persen: 12,
    margin_nominal: 1080000,
    total_pembiayaan: 10080000,
    tenor_bulan: 12,
    angsuran_per_bulan: 840000,
    status: 'berjalan',
    tgl_pengajuan: '2026-01-05',
    tgl_cair: '2026-01-10',
    kolektibilitas: 'lancar',
    catatan: 'Sesuai simulasi PRD: 10jt DP 1jt margin 12% 12bln -> cicilan 840.000/bln',
  },
  {
    id: 'FIN-002',
    no_akad: 'AKAD-MRB-2026-002',
    member_id: 'MB-003',
    akad: 'murabahah',
    tujuan_pengajuan: 'Modal Stok Laptop & Aksesoris Komputer',
    nama_barang: '5 Unit Laptop Bisnis ThinkPad Refurbished',
    harga_barang: 25000000,
    uang_muka: 5000000,
    pokok: 20000000,
    margin_persen: 10,
    margin_nominal: 2000000,
    total_pembiayaan: 22000000,
    tenor_bulan: 12,
    angsuran_per_bulan: 1833333,
    status: 'berjalan',
    tgl_pengajuan: '2026-03-01',
    tgl_cair: '2026-03-05',
    kolektibilitas: 'lancar',
  },
  {
    id: 'FIN-003',
    no_akad: 'AKAD-QRD-2026-001',
    member_id: 'MB-004',
    akad: 'qardh',
    tujuan_pengajuan: 'Pinjaman Kebajikan Talangan Darurat Beras UMKM',
    nama_barang: 'Talangan Pembelian Gabah Petani',
    harga_barang: 3000000,
    uang_muka: 0,
    pokok: 3000000,
    margin_persen: 0,
    margin_nominal: 0,
    total_pembiayaan: 3000000,
    tenor_bulan: 6,
    angsuran_per_bulan: 500000,
    status: 'berjalan',
    tgl_pengajuan: '2026-05-10',
    tgl_cair: '2026-05-12',
    kolektibilitas: 'lancar',
  },
  {
    id: 'FIN-004',
    no_akad: 'AKAD-MRB-2026-003',
    member_id: 'MB-005',
    akad: 'murabahah',
    tujuan_pengajuan: 'Mesin Sablon Digital DTF Garment',
    nama_barang: 'Mesin Printer DTF 60cm Double Head',
    harga_barang: 40000000,
    uang_muka: 8000000,
    pokok: 32000000,
    margin_persen: 12,
    margin_nominal: 7680000,
    total_pembiayaan: 39680000,
    tenor_bulan: 24,
    angsuran_per_bulan: 1653333,
    status: 'diajukan',
    tgl_pengajuan: '2026-10-01',
    kolektibilitas: 'lancar',
    catatan: 'Pengajuan baru menunggu persetujuan Ketua Koperasi',
  },
];

// Seed Installments for FIN-001 (Murabahah Bambang)
const SEED_INSTALLMENTS: Installment[] = [
  // FIN-001: 12 bulan @ 840.000 (pokok 750.000 + margin 90.000)
  ...generateInstallmentSchedule('FIN-001', '2026-01-10', 12, 750000, 90000).map((inst, index) => {
    // 8 bulan pertama sudah lunas
    if (index < 8) {
      return {
        ...inst,
        dibayar: true,
        tgl_bayar: `2026-0${index + 2}-09`,
      };
    }
    return inst;
  }),
  // FIN-002: 12 bulan @ 1.833.333 (pokok 1.666.666 + margin 166.667)
  ...generateInstallmentSchedule('FIN-002', '2026-03-05', 12, 1666667, 166666).map((inst, index) => {
    if (index < 6) {
      return {
        ...inst,
        dibayar: true,
        tgl_bayar: `2026-0${index + 4}-05`,
      };
    }
    return inst;
  }),
  // FIN-003: 6 bulan @ 500.000 (pokok 500.000 + margin 0)
  ...generateInstallmentSchedule('FIN-003', '2026-05-12', 6, 500000, 0).map((inst, index) => {
    if (index < 4) {
      return {
        ...inst,
        dibayar: true,
        tgl_bayar: `2026-0${index + 6}-12`,
      };
    }
    return inst;
  }),
];

// Seed Products (Koperasi & UMKM)
const SEED_PRODUCTS: Product[] = [
  {
    id: 'PRD-01',
    kode: 'SEM-001',
    nama: 'Beras Organik Rojolele 5kg',
    kategori: 'Sembako',
    sumber: 'umkm_anggota',
    nama_umkm: 'Toko Beras Bu Nurul (Anggota A-0004)',
    harga_beli: 70000,
    harga_jual: 82000,
    stok: 45,
    stok_min: 15,
    satuan: 'Karung 5kg',
    deskripsi: 'Beras pulen organik bebas pestisida langsung dari kelompok tani mitra.',
  },
  {
    id: 'PRD-02',
    kode: 'SEM-002',
    nama: 'Minyak Goreng Sawit Murni 2L',
    kategori: 'Sembako',
    sumber: 'koperasi',
    harga_beli: 30000,
    harga_jual: 35000,
    stok: 80,
    stok_min: 20,
    satuan: 'Pouch 2L',
    deskripsi: 'Minyak goreng higienis bersertifikat Halal MUI.',
  },
  {
    id: 'PRD-03',
    kode: 'HRB-001',
    nama: 'Madu Hutan Murni Syariah 500g',
    kategori: 'Herbal & Kesehatan',
    sumber: 'koperasi',
    harga_beli: 85000,
    harga_jual: 110000,
    stok: 22,
    stok_min: 10,
    satuan: 'Botol 500g',
    deskripsi: 'Madu murni alami kaya antioksidan dari lebah hutan binaan.',
  },
  {
    id: 'PRD-04',
    kode: 'FSH-001',
    nama: 'Gamis Katun Madinah Premium',
    kategori: 'Busana Muslim',
    sumber: 'umkm_anggota',
    nama_umkm: 'Hijab Fatimah (Anggota A-0002)',
    harga_beli: 150000,
    harga_jual: 195000,
    stok: 14,
    stok_min: 5,
    satuan: 'Pcs',
    deskripsi: 'Bahan katun Madinah adem, jahitan butik, ukuran M/L/XL.',
  },
  {
    id: 'PRD-05',
    kode: 'SNK-001',
    nama: 'Keripik Tempe Sagu Oven 250g',
    kategori: 'Makanan Ringan',
    sumber: 'umkm_anggota',
    nama_umkm: 'Dapur Berkah Bu Dewi (Keluarga A-0001)',
    harga_beli: 15000,
    harga_jual: 20000,
    stok: 8, // Stok menipis (< stok_min) untuk memicu peringatan PRD
    stok_min: 12,
    satuan: 'Bungkus',
    deskripsi: 'Renyah gurih non-MSG, dipanggang sehat tanpa kolesterol.',
  },
  {
    id: 'PRD-06',
    kode: 'SEM-003',
    nama: 'Gula Pasir Tebu Kristal 1kg',
    kategori: 'Sembako',
    sumber: 'koperasi',
    harga_beli: 15000,
    harga_jual: 18000,
    stok: 60,
    stok_min: 20,
    satuan: 'Kg',
    deskripsi: 'Gula pasir kristal putih kualitas premium.',
  },
];

const SEED_STOCK_MOVES: StockMove[] = [
  {
    id: 'SMV-01',
    product_id: 'PRD-01',
    tipe: 'masuk',
    jumlah: 50,
    stok_sebelum: 0,
    stok_sesudah: 50,
    tanggal: '2026-09-01',
    keterangan: 'Kulakan Awal Bulan dari Petani Mitra',
    ref_tipe: 'kulakan',
  },
  {
    id: 'SMV-02',
    product_id: 'PRD-01',
    tipe: 'keluar',
    jumlah: 5,
    stok_sebelum: 50,
    stok_sesudah: 45,
    tanggal: '2026-09-25',
    keterangan: 'Penjualan Invoice INV-2026-0001',
    ref_tipe: 'invoice',
    ref_id: 'INV-2026-0001',
  },
];

const SEED_INVOICES: Invoice[] = [
  {
    id: 'INV-001',
    no_invoice: 'INV-2026-0001',
    member_id: 'MB-003',
    nama_pelanggan: 'Umar Abdullah, S.T.',
    telepon_pelanggan: '081198765433',
    tanggal: '2026-09-25',
    jatuh_tempo: '2026-09-25',
    items: [
      { product_id: 'PRD-01', nama_produk: 'Beras Organik Rojolele 5kg', harga: 82000, qty: 5, subtotal: 410000 },
      { product_id: 'PRD-03', nama_produk: 'Madu Hutan Murni Syariah 500g', harga: 110000, qty: 2, subtotal: 220000 },
    ],
    subtotal: 630000,
    diskon: 30000,
    total: 600000,
    status: 'lunas',
    catatan: 'Pembayaran tunai di kasir toko koperasi',
  },
  {
    id: 'INV-002',
    no_invoice: 'INV-2026-0002',
    nama_pelanggan: 'Majelis Taklim Al-Ikhlas',
    telepon_pelanggan: '081234567890',
    tanggal: '2026-10-01',
    jatuh_tempo: '2026-10-05',
    items: [
      { product_id: 'PRD-02', nama_produk: 'Minyak Goreng Sawit Murni 2L', harga: 35000, qty: 10, subtotal: 350000 },
      { product_id: 'PRD-06', nama_produk: 'Gula Pasir Tebu Kristal 1kg', harga: 18000, qty: 20, subtotal: 360000 },
    ],
    subtotal: 710000,
    diskon: 10000,
    total: 700000,
    status: 'terkirim',
    catatan: 'Pesanan santunan anak yatim',
  },
];

const SEED_CASH_ENTRIES: CashEntry[] = [
  {
    id: 'CSH-001',
    no_kas: 'KAS-2026-0001',
    tanggal: '2026-09-01',
    arah: 'masuk',
    kategori: 'simpanan_masuk',
    jumlah: 4500000,
    keterangan: 'Penerimaan Simpanan Wajib & Sukarela Anggota September',
    ref_tipe: 'simpanan',
  },
  {
    id: 'CSH-002',
    no_kas: 'KAS-2026-0002',
    tanggal: '2026-09-10',
    arah: 'masuk',
    kategori: 'angsuran_pokok',
    jumlah: 2916667,
    keterangan: 'Penerimaan Angsuran Pokok Pembiayaan FIN-001 & FIN-002',
    ref_tipe: 'pembiayaan',
  },
  {
    id: 'CSH-003',
    no_kas: 'KAS-2026-0003',
    tanggal: '2026-09-10',
    arah: 'masuk',
    kategori: 'margin_pembiayaan',
    jumlah: 256666,
    keterangan: 'Penerimaan Margin Murabahah September',
    ref_tipe: 'pembiayaan',
  },
  {
    id: 'CSH-004',
    no_kas: 'KAS-2026-0004',
    tanggal: '2026-09-25',
    arah: 'masuk',
    kategori: 'penjualan_toko',
    jumlah: 600000,
    keterangan: 'Penerimaan Penjualan Toko INV-2026-0001 Lunas',
    ref_tipe: 'invoice',
    ref_id: 'INV-2026-0001',
  },
  {
    id: 'CSH-005',
    no_kas: 'KAS-2026-0005',
    tanggal: '2026-09-28',
    arah: 'keluar',
    kategori: 'operasional',
    jumlah: 850000,
    keterangan: 'Beban Listrik, Internet & ATK Kantor Koperasi',
    ref_tipe: 'manual',
  },
];

const SEED_SHU_PERIODS: ShuPeriod[] = [
  {
    tahun: 2025,
    total_shu: 24500000,
    persentase: {
      cadangan: 30,
      jasa_simpanan: 25,
      jasa_transaksi: 20,
      pengurus_pengawas: 10,
      dana_pendidikan: 5,
      dana_sosial: 5,
      dana_pembangunan: 5,
    },
    status: 'ditetapkan',
    tgl_penetapan: '2026-02-20',
  },
  {
    tahun: 2026,
    total_shu: 35000000,
    persentase: {
      cadangan: 30,
      jasa_simpanan: 25,
      jasa_transaksi: 20,
      pengurus_pengawas: 10,
      dana_pendidikan: 5,
      dana_sosial: 5,
      dana_pembangunan: 5,
    },
    status: 'draf',
  },
];

const SEED_CAMPAIGNS: Campaign[] = [
  {
    id: 'CMP-01',
    kode: 'KAMP-01',
    nama: 'Promo Taawun Berkah Ramadhan',
    kanal: 'WhatsApp',
    periode_mulai: '2026-03-01',
    periode_selesai: '2026-04-30',
    status: 'selesai',
    target_prospek: 20,
    total_klik: 145,
  },
  {
    id: 'CMP-02',
    kode: 'KAMP-02',
    nama: 'Gerakan Saham & Simpanan Berkah UMKM',
    kanal: 'Instagram',
    periode_mulai: '2026-08-01',
    periode_selesai: '2026-12-31',
    status: 'aktif',
    target_prospek: 50,
    total_klik: 312,
  },
  {
    id: 'CMP-03',
    kode: 'KAMP-03',
    nama: 'Brosur Silaturahmi Pengajian Ahad Pagi',
    kanal: 'Brosur/Banner',
    periode_mulai: '2026-09-01',
    periode_selesai: '2026-10-31',
    status: 'aktif',
    target_prospek: 15,
    total_klik: 48,
  },
];

const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG-001',
    user_id: 'USR-01',
    nama_user: 'H. Ahmad Fauzi (Ketua)',
    peran: 'admin',
    aksi: 'APPROVAL',
    tabel: 'financings',
    record_id: 'FIN-001',
    keterangan: 'Menyetujui akad Murabahah Bambang Supriyanto Rp 10.000.000',
    waktu: '2026-01-08 14:30:22',
  },
  {
    id: 'LOG-002',
    user_id: 'USR-03',
    nama_user: 'Hj. Siti Rahmawati (Bendahara)',
    peran: 'bendahara',
    aksi: 'CREATE',
    tabel: 'savings_tx',
    record_id: 'STX-006',
    keterangan: 'Mencatat setoran Simpanan Mudharabah Rp 5.000.000 oleh Fatimah',
    waktu: '2026-06-01 10:15:00',
  },
  {
    id: 'LOG-003',
    user_id: 'USR-04',
    nama_user: 'Farhan Maulana (Toko)',
    peran: 'marketing',
    aksi: 'CREATE',
    tabel: 'invoices',
    record_id: 'INV-2026-0001',
    keterangan: 'Membuat dan melunasi invoice INV-2026-0001 senilai Rp 600.000',
    waktu: '2026-09-25 11:20:44',
  },
];

export const SEED_CATERING_PACKAGES: CateringPackage[] = [
  {
    id: 'CAT-01',
    nama: 'Paket Nasi Box Berkah Syariah',
    kategori: 'nasi_box',
    deskripsi: 'Nasi box higienis & lezat untuk acara pengajian, rapat kantor, dan syukuran keluarga.',
    harga_per_porsi: 28000,
    min_order: 20,
    menu_items: ['Nasi Liwet Gurih / Nasi Putih', 'Ayam Bakar Madu / Rendang Daging', 'Sambal Goreng Kentang Ati', 'Tumis Buncis Jagung Manis', 'Kerupuk Udang', 'Sambal Bajak & Lalapan', 'Air Mineral Cup'],
    nama_umkm: 'Dapur Berkah Bu Dewi (UMKM Anggota A-0001)',
    sertifikasi_halal: 'ID3111000189201024',
  },
  {
    id: 'CAT-02',
    nama: 'Paket Aqiqah Sunnah Berkah (1 Ekor Kambing)',
    kategori: 'aqiqah',
    deskripsi: 'Penyembelihan kambing sesuai syariat, diolah menjadi gulai gurih & sate empuk siap santap.',
    harga_per_porsi: 35000,
    min_order: 50,
    menu_items: ['Nasi Kebuli / Nasi Putih Wangi', 'Gulai Kambing Tanpa Prengus', 'Sate Kambing Empuk Bumbu Kecap (3 Tusuk)', 'Acar Nanas Segar', 'Kerupuk Emping Melinjo', 'Buah Pisang Sunpride', 'Sertifikat & Dokumentasi Syar\'i'],
    nama_umkm: 'Aqiqah Taawun Mandiri (Mitra Koperasi)',
    sertifikasi_halal: 'ID3111000293810324',
  },
  {
    id: 'CAT-03',
    nama: 'Paket Prasmanan Walimah Sunnah',
    kategori: 'prasmanan',
    deskripsi: 'Layanan prasmanan lengkap dengan alat pemanas & meja hidangan untuk pesta walimah nikah & reuni.',
    harga_per_porsi: 55000,
    min_order: 100,
    menu_items: ['Nasi Putih Pandan Wangi + Nasi Goreng Spesial', 'Daging Sapi Lada Hitam / Rendang Padang', 'Ayam Suwir Bumbu Rujak', 'Sup Kimlo Bakso Ikan', 'Capcay Seafood', 'Asinan Sayur Betawi', 'Puding Buah Segar + Aneka Es Buah', 'Peralatan Prasmanan & Waiter Halal'],
    nama_umkm: 'Katering Hj. Nurul Barokah (UMKM Anggota A-0004)',
    sertifikasi_halal: 'ID3111000301920424',
  },
  {
    id: 'CAT-04',
    nama: 'Snack Box Tradisional & Bakery Halal',
    kategori: 'snack_box',
    deskripsi: 'Kombinasi kue basah tradisional dan roti manis berkualitas untuk coffee break seminar & kajian.',
    harga_per_porsi: 15000,
    min_order: 25,
    menu_items: ['Lemper Ayam Bakar Gurih', 'Pastel Sayur Telur Spesial', 'Kue Lumpur Surga Pandan', 'Air Mineral Botol 330ml'],
    nama_umkm: 'Kue Berkah Fatimah (UMKM Anggota A-0002)',
    sertifikasi_halal: 'ID3111000412890524',
  },
  {
    id: 'CAT-05',
    nama: 'Tumpeng Syukuran Kuning Berkah (15-20 Porsi)',
    kategori: 'tumpeng',
    deskripsi: 'Nasi tumpeng hias cantik bertingkat dengan aneka lauk komplit untuk peresmian & milad.',
    harga_per_porsi: 45000,
    min_order: 15,
    menu_items: ['Nasi Kuning Harum Pulen', 'Ayam Goreng Lengkuas', 'Urap Sayuran Bumbu Kelapa', 'Telur Balado & Dadar Rawis', 'Perkedel Kentang Daging', 'Orek Tempe Kering Manis', 'Sambal Terasi Matang', 'Garnish Sayuran Ukir Cantik'],
    nama_umkm: 'Dapur Berkah Bu Dewi (UMKM Anggota A-0001)',
    sertifikasi_halal: 'ID3111000189201024',
  },
  {
    id: 'CAT-06',
    nama: 'Katering Harian Rantang / Kantor Halal',
    kategori: 'harian',
    deskripsi: 'Langganan menu makan siang sehat halal untuk instansi perkantoran & yayasan sekolah.',
    harga_per_porsi: 25000,
    min_order: 10,
    menu_items: ['Menu Berganti Setiap Hari (35 Pilihan)', '1 Menu Utama Daging / Ayam / Ikan', '1 Menu Sayuran Segar', '1 Menu Pendamping (Tahu/Tempe/Bakwan)', 'Nasi Putih & Sambal'],
    nama_umkm: 'Katering Hj. Nurul Barokah (UMKM Anggota A-0004)',
    sertifikasi_halal: 'ID3111000301920424',
  },
];

export const SEED_CATERING_ORDERS: CateringOrder[] = [
  {
    id: 'CORD-001',
    no_pesanan: 'KAT-2026-0001',
    member_id: 'MB-003',
    nama_pemesan: 'Umar Abdullah, S.T.',
    telepon: '081198765433',
    alamat_pengiriman: 'Gedung Dakwah Al-Azhar Lt. 2, Kebayoran Baru, Jakarta Selatan',
    tgl_acara: '2026-10-15',
    waktu_acara: '11:30 WIB',
    jenis_acara: 'Kajian & Rapat Kerja Yayasan',
    package_id: 'CAT-01',
    nama_paket: 'Paket Nasi Box Berkah Syariah',
    porsi: 75,
    harga_satuan: 28000,
    menu_custom: 'Pilihan lauk: Ayam Bakar Madu + Ekstra Sambal Bajak dipisah',
    total_harga: 2100000,
    uang_muka_dp: 1050000,
    sisa_tagihan: 1050000,
    status_pembayaran: 'dp_lunas',
    status_pesanan: 'dikonfirmasi',
    akad: 'istishna',
    tgl_pesan: '2026-10-02',
    catatan: 'Pengiriman maksimal pukul 11:00 WIB sebelum kajian selesai.',
  },
  {
    id: 'CORD-002',
    no_pesanan: 'KAT-2026-0002',
    member_id: 'MB-005',
    nama_pemesan: 'Hendra Gunawan',
    telepon: '081787654355',
    alamat_pengiriman: 'Jl. Otista III No. 5B, Jakarta Timur',
    tgl_acara: '2026-10-20',
    waktu_acara: '09:00 WIB',
    jenis_acara: 'Tasyakuran Aqiqah Anak Kedua',
    package_id: 'CAT-02',
    nama_paket: 'Paket Aqiqah Sunnah Berkah (1 Ekor Kambing)',
    porsi: 60,
    harga_satuan: 35000,
    menu_custom: 'Gulai kambing + Sate bumbu kacang & kecap terpisah',
    total_harga: 2100000,
    uang_muka_dp: 2100000,
    sisa_tagihan: 0,
    status_pembayaran: 'lunas',
    status_pesanan: 'dimasak',
    akad: 'salam',
    tgl_pesan: '2026-10-04',
    catatan: 'Disertai sertifikat aqiqah dan foto proses penyembelihan syar\'i.',
  },
  {
    id: 'CORD-003',
    no_pesanan: 'KAT-2026-0003',
    nama_pemesan: 'Ustadz Haris Munandar (DKM Masjid Raya)',
    telepon: '081377889900',
    alamat_pengiriman: 'Masjid Raya Al-Muhajirin, Rawamangun, Jakarta Timur',
    tgl_acara: '2026-10-25',
    waktu_acara: '18:30 WIB',
    jenis_acara: 'Tabligh Akbar & Santunan Yatim',
    package_id: 'CAT-04',
    nama_paket: 'Snack Box Tradisional & Bakery Halal',
    porsi: 150,
    harga_satuan: 15000,
    menu_custom: 'Snack box isi 3 kue basah + air mineral',
    total_harga: 2250000,
    uang_muka_dp: 0,
    sisa_tagihan: 2250000,
    status_pembayaran: 'belum_dp',
    status_pesanan: 'masuk',
    akad: 'istishna',
    tgl_pesan: '2026-10-07',
    catatan: 'Pemesanan online via website koperasi, menunggu konfirmasi admin.',
  },
];

const STORAGE_KEY = 'koperasi_syariah_db_v1';

export function getInitialDatabase(): AppDatabase {
  return {
    currentUser: DEFAULT_USERS.admin,
    config: DEFAULT_CONFIG,
    members: SEED_MEMBERS,
    savingsProducts: SEED_SAVINGS_PRODUCTS,
    savingsTransactions: SEED_SAVINGS_TX,
    financings: SEED_FINANCINGS,
    installments: SEED_INSTALLMENTS,
    products: SEED_PRODUCTS,
    stockMoves: SEED_STOCK_MOVES,
    invoices: SEED_INVOICES,
    cashEntries: SEED_CASH_ENTRIES,
    shuPeriods: SEED_SHU_PERIODS,
    shuResults: [],
    campaigns: SEED_CAMPAIGNS,
    auditLogs: SEED_AUDIT_LOGS,
    cateringPackages: SEED_CATERING_PACKAGES,
    cateringOrders: SEED_CATERING_ORDERS,
  };
}

export function loadDatabase(): AppDatabase {
  if (typeof window === 'undefined') return getInitialDatabase();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialDatabase();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    // Backfill jika key katering belum ada di storage lama
    if (!parsed.cateringPackages || parsed.cateringPackages.length === 0) {
      parsed.cateringPackages = SEED_CATERING_PACKAGES;
    }
    if (!parsed.cateringOrders) {
      parsed.cateringOrders = SEED_CATERING_ORDERS;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load database from localStorage', e);
    return getInitialDatabase();
  }
}

export function saveDatabase(data: AppDatabase): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save database to localStorage', e);
  }
}

export function resetDatabase(): AppDatabase {
  const initial = getInitialDatabase();
  saveDatabase(initial);
  return initial;
}


export { DEFAULT_USERS };
