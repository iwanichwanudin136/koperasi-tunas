export type UserRole =
  | 'admin'
  | 'sekretaris'
  | 'bendahara'
  | 'marketing'
  | 'pengawas'
  | 'publik';

export interface UserProfile {
  id: string;
  nama: string;
  email: string;
  peran: UserRole;
  avatar?: string;
  telepon?: string;
}

export type MemberStatus = 'calon' | 'aktif' | 'nonaktif' | 'keluar';

export interface Member {
  id: string;
  no_anggota: string;
  nama: string;
  nik: string;
  alamat: string;
  telepon: string;
  pekerjaan: string;
  tgl_bergabung: string;
  status: MemberStatus;
  foto?: string;
  ahli_waris: {
    nama: string;
    hubungan: string;
    telepon: string;
  };
  sumber_kampanye?: string;
  catatan?: string;
}

export type SavingsType = 'pokok' | 'wajib' | 'sukarela';
export type SavingsAkad = 'wadiah' | 'mudharabah';

export interface SavingsProduct {
  id: string;
  nama: string;
  jenis: SavingsType;
  akad: SavingsAkad;
  minimal_setoran: number;
  nisbah_anggota?: number; // % untuk mudharabah
  nisbah_koperasi?: number; // % untuk mudharabah
  deskripsi: string;
}

export interface SavingsTransaction {
  id: string;
  no_transaksi: string;
  member_id: string;
  product_id: string;
  tipe: 'setor' | 'tarik';
  jumlah: number;
  tanggal: string;
  keterangan: string;
  dibuat_oleh: string;
}

export type FinancingAkad =
  | 'murabahah'
  | 'mudharabah'
  | 'musyarakah'
  | 'ijarah'
  | 'qardh';

export type FinancingStatus =
  | 'diajukan'
  | 'disetujui'
  | 'ditolak'
  | 'dicairkan'
  | 'berjalan'
  | 'lunas'
  | 'bermasalah';

export type Collectibility = 'lancar' | 'kurang_lancar' | 'diragukan' | 'macet';

export interface Installment {
  id: string;
  financing_id: string;
  no_ke: number;
  jatuh_tempo: string;
  pokok: number;
  margin: number;
  total_angsuran: number;
  dibayar: boolean;
  tgl_bayar?: string;
  denda: number;
}

export interface Financing {
  id: string;
  no_akad: string;
  member_id: string;
  akad: FinancingAkad;
  tujuan_pengajuan: string;
  nama_barang?: string;
  harga_barang: number;
  uang_muka: number;
  pokok: number;
  margin_persen: number;
  margin_nominal: number;
  total_pembiayaan: number;
  tenor_bulan: number;
  angsuran_per_bulan: number;
  status: FinancingStatus;
  tgl_pengajuan: string;
  tgl_cair?: string;
  kolektibilitas: Collectibility;
  catatan?: string;
}

export type ProductSource = 'koperasi' | 'umkm_anggota';

export interface Product {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
  sumber: ProductSource;
  nama_umkm?: string;
  harga_beli: number;
  harga_jual: number;
  stok: number;
  stok_min: number;
  satuan: string;
  foto?: string;
  deskripsi: string;
}

export interface StockMove {
  id: string;
  product_id: string;
  tipe: 'masuk' | 'keluar' | 'opname';
  jumlah: number;
  stok_sebelum: number;
  stok_sesudah: number;
  tanggal: string;
  keterangan: string;
  ref_tipe?: 'invoice' | 'kulakan' | 'penyesuaian';
  ref_id?: string;
}

export type InvoiceStatus = 'draf' | 'terkirim' | 'lunas' | 'jatuh_tempo' | 'dibatalkan';

export interface InvoiceItem {
  product_id: string;
  nama_produk: string;
  harga: number;
  qty: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  no_invoice: string;
  member_id?: string;
  nama_pelanggan: string;
  telepon_pelanggan: string;
  tanggal: string;
  jatuh_tempo: string;
  items: InvoiceItem[];
  subtotal: number;
  diskon: number;
  total: number;
  status: InvoiceStatus;
  catatan?: string;
}

export interface CashEntry {
  id: string;
  no_kas: string;
  tanggal: string;
  arah: 'masuk' | 'keluar';
  kategori:
    | 'simpanan_masuk'
    | 'simpanan_tarik'
    | 'pencairan_pembiayaan'
    | 'angsuran_pokok'
    | 'margin_pembiayaan'
    | 'penjualan_toko'
    | 'kulakan_stok'
    | 'operasional'
    | 'bagi_hasil_shu'
    | 'lainnya';
  jumlah: number;
  keterangan: string;
  ref_tipe?: 'simpanan' | 'pembiayaan' | 'invoice' | 'shu' | 'manual';
  ref_id?: string;
}

export interface ShuPeriod {
  tahun: number;
  total_shu: number;
  persentase: {
    cadangan: number; // default 30%
    jasa_simpanan: number; // default 25%
    jasa_transaksi: number; // default 20%
    pengurus_pengawas: number; // default 10%
    dana_pendidikan: number; // default 5%
    dana_sosial: number; // default 5%
    dana_pembangunan: number; // default 5%
  };
  status: 'draf' | 'ditetapkan';
  tgl_penetapan?: string;
}

export interface ShuResult {
  member_id: string;
  tahun: number;
  simpanan_pokok_wajib: number;
  persentase_modal: number;
  jasa_simpanan: number;
  transaksi_belanja_pembiayaan: number;
  jasa_transaksi: number;
  total_shu_diterima: number;
}

export interface Campaign {
  id: string;
  kode: string; // utm_source / utm_campaign
  nama: string;
  kanal: 'WhatsApp' | 'Instagram' | 'Facebook' | 'Brosur/Banner' | 'Website' | 'Event';
  periode_mulai: string;
  periode_selesai: string;
  status: 'aktif' | 'selesai' | 'draf';
  target_prospek: number;
  total_klik?: number;
}

export interface AuditLog {
  id: string;
  user_id: string;
  nama_user: string;
  peran: string;
  aksi: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVAL' | 'CANCEL';
  tabel: string;
  record_id: string;
  keterangan: string;
  sebelum?: any;
  sesudah?: any;
  waktu: string;
}

export interface CooperativeConfig {
  nama: string;
  badan_hukum: string;
  alamat: string;
  telepon: string;
  email: string;
  website: string;
  ketua: string;
  bendahara: string;
  sekretaris: string;
  dps: string; // Dewan Pengawas Syariah
  rekening_bank: {
    bank: string;
    no_rekening: string;
    atas_nama: string;
  }[];
}
