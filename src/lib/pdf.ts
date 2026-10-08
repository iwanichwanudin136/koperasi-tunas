'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CateringOrder, CooperativeConfig, Financing, Installment, Invoice, Member, ShuPeriod, ShuResult } from '@/types';

import { formatDate, formatRupiah } from './utils';

// Helper: Header Dokumen Koperasi
function drawCooperativeHeader(doc: jsPDF, config: CooperativeConfig, title: string) {
  // Garis atas pita dua warna: biru (#1d5fc1) & merah (#d32a2a)
  doc.setFillColor(29, 95, 193); // Blue
  doc.rect(14, 10, 120, 3, 'F');
  doc.setFillColor(211, 42, 42); // Red
  doc.rect(134, 10, 62, 3, 'F');

  // Nama Koperasi
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(21, 63, 138); // Blue2
  doc.text(config.nama.toUpperCase(), 14, 20);

  // Detail Badan Hukum & Kontak
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`Badan Hukum: ${config.badan_hukum}`, 14, 25);
  doc.text(`${config.alamat} | Telp: ${config.telepon} | Email: ${config.email}`, 14, 29);

  // Garis Pemisah
  doc.setDrawColor(227, 231, 238);
  doc.setLineWidth(0.8);
  doc.line(14, 32, 196, 32);

  // Judul Dokumen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(29, 95, 193);
  doc.text(title.toUpperCase(), 105, 40, { align: 'center' });
}

/**
 * Cetak Surat Perjanjian Akad Pembiayaan Murabahah (PDF)
 */
export function generateMurabahahContractPDF(
  financing: Financing,
  member: Member,
  installments: Installment[],
  config: CooperativeConfig
) {
  const doc = new jsPDF();
  drawCooperativeHeader(doc, config, 'SURAT AKAD PEMBIAYAAN MURABAHAH (JUAL BELI)');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  doc.text(`Nomor Akad: ${financing.no_akad}`, 14, 48);
  doc.text(`Tanggal Akad: ${formatDate(financing.tgl_pengajuan)}`, 14, 53);

  const introText =
    'Pada hari ini telah disepakati akad pembiayaan Murabahah bil Wakalah antara Pihak Pertama (Koperasi Taawun Amal Sejahtera) selaku Penjual/Penyedia Dana dan Pihak Kedua (Anggota) selaku Pembeli:';
  doc.text(doc.splitTextToSize(introText, 182), 14, 60);

  // Informasi Pihak Kedua (Anggota)
  autoTable(doc, {
    startY: 68,
    head: [['Identitas Anggota', 'Rincian']],
    body: [
      ['Nomor Anggota', member.no_anggota],
      ['Nama Lengkap', member.nama],
      ['Nomor Induk Kependudukan (NIK)', member.nik],
      ['Alamat Domisili', member.alamat],
      ['Nomor Telepon / WhatsApp', member.telepon],
      ['Pekerjaan / Usaha', member.pekerjaan],
      ['Ahli Waris / Penjamin', `${member.ahli_waris.nama} (${member.ahli_waris.hubungan}) - ${member.ahli_waris.telepon}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [29, 95, 193], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } },
  });

  const lastY1 = (doc as any).lastAutoTable.finalY || 110;

  // Detail Akad & Keuangan
  autoTable(doc, {
    startY: lastY1 + 5,
    head: [['Objek & Rincian Transaksi Murabahah', 'Nominal / Ketentuan']],
    body: [
      ['Tujuan Pembiayaan', financing.tujuan_pengajuan],
      ['Barang yang Dibiayai', financing.nama_barang || '-'],
      ['Harga Beli Barang (Objek Murabahah)', formatRupiah(financing.harga_barang)],
      ['Uang Muka (Urbun / DP)', formatRupiah(financing.uang_muka)],
      ['Pokok Pembiayaan Koperasi', formatRupiah(financing.pokok)],
      ['Margin Keuntungan Koperasi', `${financing.margin_persen}% (${formatRupiah(financing.margin_nominal)})`],
      ['Total Kewajiban Pembeli (Harga Jual)', formatRupiah(financing.total_pembiayaan)],
      ['Jangka Waktu (Tenor)', `${financing.tenor_bulan} Bulan`],
      ['Angsuran Tetap per Bulan', `${formatRupiah(financing.angsuran_per_bulan)} / bulan`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [21, 63, 138], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold' } },
  });

  const lastY2 = (doc as any).lastAutoTable.finalY || 165;

  // Jadwal Angsuran Ringkas (5 baris pertama)
  const scheduleRows = installments.slice(0, 6).map((inst) => [
    `Ke-${inst.no_ke}`,
    formatDate(inst.jatuh_tempo),
    formatRupiah(inst.pokok),
    formatRupiah(inst.margin),
    formatRupiah(inst.total_angsuran),
    inst.dibayar ? 'LUNAS' : 'Belum Bayar',
  ]);

  autoTable(doc, {
    startY: lastY2 + 5,
    head: [['Angsuran', 'Jatuh Tempo', 'Pokok', 'Margin', 'Total Angsuran', 'Status']],
    body: scheduleRows,
    theme: 'striped',
    headStyles: { fillColor: [100, 116, 139], textColor: 255 },
    styles: { fontSize: 7.5, cellPadding: 1.5 },
  });

  const lastY3 = (doc as any).lastAutoTable.finalY || 215;

  // Area Tanda Tangan
  const sigY = Math.min(lastY3 + 12, 240);
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);

  doc.text('Pihak Kedua (Anggota)', 30, sigY, { align: 'center' });
  doc.text('Pihak Pertama (Ketua Koperasi)', 105, sigY, { align: 'center' });
  doc.text('Mengetahui (Dewan Pengawas)', 170, sigY, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.text(member.nama, 30, sigY + 22, { align: 'center' });
  doc.text(config.ketua, 105, sigY + 22, { align: 'center' });
  doc.text(config.dps, 170, sigY + 22, { align: 'center' });

  doc.save(`Akad-Murabahah-${financing.no_akad}-${member.nama.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Cetak Buku Simpanan / Mutasi Tabungan (PDF)
 */
export function generateSavingsStatementPDF(
  member: Member,
  productName: string,
  transactions: {
    tanggal: string;
    no_transaksi: string;
    keterangan: string;
    debet: number;
    kredit: number;
    saldo: number;
  }[],
  config: CooperativeConfig
) {
  const doc = new jsPDF();
  drawCooperativeHeader(doc, config, `BUKU MUTASI SIMPANAN: ${productName.toUpperCase()}`);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);

  doc.text(`Nomor Anggota : ${member.no_anggota}`, 14, 48);
  doc.text(`Nama Anggota  : ${member.nama}`, 14, 53);
  doc.text(`No. Telepon   : ${member.telepon}`, 14, 58);
  doc.text(`Tanggal Cetak : ${formatDate(new Date().toISOString())}`, 140, 48);

  const rows = transactions.map((tx) => [
    formatDate(tx.tanggal),
    tx.no_transaksi,
    tx.keterangan,
    tx.debet > 0 ? formatRupiah(tx.debet) : '-',
    tx.kredit > 0 ? formatRupiah(tx.kredit) : '-',
    formatRupiah(tx.saldo),
  ]);

  autoTable(doc, {
    startY: 65,
    head: [['Tanggal', 'No. Transaksi', 'Keterangan Transaksi', 'Setor (Kredit)', 'Tarik (Debet)', 'Saldo Akhir']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [29, 95, 193], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      3: { halign: 'right', textColor: [16, 149, 193] },
      4: { halign: 'right', textColor: [211, 42, 42] },
      5: { halign: 'right', fontStyle: 'bold' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 150;
  const currentSaldo = transactions.length > 0 ? transactions[transactions.length - 1].saldo : 0;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(21, 63, 138);
  doc.text(`TOTAL SALDO AKHIR: ${formatRupiah(currentSaldo)}`, 196, finalY + 10, { align: 'right' });

  doc.save(`Buku-Simpanan-${member.no_anggota}-${productName.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Cetak Invoice Penjualan Toko Koperasi (PDF)
 */
export function generateInvoicePDF(invoice: Invoice, config: CooperativeConfig) {
  const doc = new jsPDF();
  drawCooperativeHeader(doc, config, 'FAKTUR / INVOICE PENJUALAN');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);

  doc.text(`Nomor Invoice : ${invoice.no_invoice}`, 14, 48);
  doc.text(`Tanggal        : ${formatDate(invoice.tanggal)}`, 14, 53);
  doc.text(`Status         : ${invoice.status.toUpperCase()}`, 14, 58);

  doc.text(`Kepada Yth.   : ${invoice.nama_pelanggan}`, 120, 48);
  doc.text(`Telepon       : ${invoice.telepon_pelanggan || '-'}`, 120, 53);

  const itemRows = invoice.items.map((item, idx) => [
    (idx + 1).toString(),
    item.nama_produk,
    formatRupiah(item.harga),
    item.qty.toString(),
    formatRupiah(item.subtotal),
  ]);

  autoTable(doc, {
    startY: 65,
    head: [['No', 'Nama Produk / Item', 'Harga Satuan', 'Qty', 'Subtotal']],
    body: itemRows,
    theme: 'striped',
    headStyles: { fillColor: [29, 95, 193], textColor: 255 },
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'center' },
      4: { halign: 'right', fontStyle: 'bold' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 120;

  // Ringkasan Total
  doc.setFontSize(9);
  doc.text(`Subtotal : ${formatRupiah(invoice.subtotal)}`, 196, finalY + 8, { align: 'right' });
  if (invoice.diskon > 0) {
    doc.text(`Diskon   : -${formatRupiah(invoice.diskon)}`, 196, finalY + 13, { align: 'right' });
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(21, 63, 138);
  doc.text(`TOTAL BAYAR : ${formatRupiah(invoice.total)}`, 196, finalY + 20, { align: 'right' });

  // Tanda terima
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text('Petugas Kasir Toko,', 25, finalY + 30);
  doc.text(config.bendahara, 25, finalY + 48);

  doc.save(`Invoice-${invoice.no_invoice}.pdf`);
}

/**
 * Cetak Sertifikat Saham & Hasil SHU Anggota (PDF)
 */
export function generateShuCertificatePDF(
  member: Member,
  shuResult: ShuResult,
  period: ShuPeriod,
  config: CooperativeConfig
) {
  const doc = new jsPDF();
  drawCooperativeHeader(doc, config, `BUKTI BAGI HASIL SISA HASIL USAHA (SHU) - TAHUN BUKU ${period.tahun}`);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);

  doc.text(`Diberikan kepada Anggota Resmi Koperasi:`, 14, 48);

  autoTable(doc, {
    startY: 53,
    head: [['Keterangan Anggota', 'Rincian']],
    body: [
      ['Nomor Anggota', member.no_anggota],
      ['Nama Lengkap', member.nama],
      ['NIK', member.nik],
      ['Alamat', member.alamat],
      ['Total Simpanan Modal (Pokok + Wajib)', formatRupiah(shuResult.simpanan_pokok_wajib)],
      ['Persentase Modal Saham Anggota', `${shuResult.persentase_modal}% dari Total Modal Anggota`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [29, 95, 193], textColor: 255 },
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold' } },
  });

  const finalY1 = (doc as any).lastAutoTable.finalY || 100;

  // Komponen Hak SHU
  autoTable(doc, {
    startY: finalY1 + 6,
    head: [['Komponen SHU Diterima', 'Persentase Alokasi AD/ART', 'Hak Diterima']],
    body: [
      ['Jasa Modal Simpanan (Jasa Simpanan)', `${period.persentase.jasa_simpanan}%`, formatRupiah(shuResult.jasa_simpanan)],
      ['Jasa Transaksi & Usaha (Jasa Transaksi)', `${period.persentase.jasa_transaksi}%`, formatRupiah(shuResult.jasa_transaksi)],
      ['TOTAL SHU DITERIMA ANGGOTA', '100% Sesuai RAT', formatRupiah(shuResult.total_shu_diterima)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [21, 63, 138], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      2: { halign: 'right', fontStyle: 'bold', textColor: [16, 149, 193] },
    },
  });

  const finalY2 = (doc as any).lastAutoTable.finalY || 150;

  const sigY = finalY2 + 15;
  doc.setFontSize(8.5);
  doc.text(`Ditetapkan di Jakarta pada tanggal ${formatDate(period.tgl_penetapan || new Date().toISOString())}`, 14, sigY - 5);
  doc.text('Ketua Pengurus,', 35, sigY);
  doc.text(config.ketua, 35, sigY + 22);

  doc.text('Bendahara,', 140, sigY);
  doc.text(config.bendahara, 140, sigY + 22);

  doc.save(`SHU-${period.tahun}-${member.no_anggota}-${member.nama.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Cetak Surat Pesanan & Faktur Katering Syariah (Akad Istishna / Salam)
 */
export function generateCateringOrderPDF(order: CateringOrder, config: CooperativeConfig) {
  const doc = new jsPDF();
  const akadTitle = order.akad === 'istishna' ? 'AKAD ISTISHNA (PESANAN PEMBUATAN)' : 'AKAD SALAM (PESANAN DIMUKA)';
  drawCooperativeHeader(doc, config, `SURAT PESANAN & FAKTUR KATERING SYARIAH\n${akadTitle}`);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);

  doc.text(`Nomor Pesanan  : ${order.no_pesanan}`, 14, 50);
  doc.text(`Tanggal Pesan  : ${formatDate(order.tgl_pesan)}`, 14, 55);
  doc.text(`Akad Syariah   : ${order.akad.toUpperCase()} (Jual Beli Pesanan Halal)`, 14, 60);

  doc.text(`Pemesan / Klien : ${order.nama_pemesan}`, 115, 50);
  doc.text(`No. Kontak      : ${order.telepon}`, 115, 55);
  doc.text(`Status Bayar    : ${order.status_pembayaran.toUpperCase().replace('_', ' ')}`, 115, 60);

  // Tabel Detail Acara & Pengiriman
  autoTable(doc, {
    startY: 66,
    head: [['Detail Pelaksanaan Acara', 'Keterangan']],
    body: [
      ['Jenis Acara', order.jenis_acara],
      ['Tanggal & Waktu Acara', `${formatDate(order.tgl_acara)} pukul ${order.waktu_acara}`],
      ['Alamat Lengkap Pengiriman', order.alamat_pengiriman],
      ['Catatan / Permintaan Khusus', order.menu_custom || order.catatan || '-'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [29, 95, 193], textColor: 255 },
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } },
  });

  const lastY1 = (doc as any).lastAutoTable.finalY || 105;

  // Tabel Rincian Menu & Harga
  autoTable(doc, {
    startY: lastY1 + 5,
    head: [['No', 'Paket Katering Syariah', 'Jumlah Porsi', 'Harga / Porsi', 'Total Biaya']],
    body: [
      [
        '1',
        `${order.nama_paket}\n${order.menu_custom ? `Catatan: ${order.menu_custom}` : ''}`,
        `${order.porsi} Porsi`,
        formatRupiah(order.harga_satuan),
        formatRupiah(order.total_harga),
      ],
    ],
    theme: 'striped',
    headStyles: { fillColor: [21, 63, 138], textColor: 255 },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
    },
  });

  const lastY2 = (doc as any).lastAutoTable.finalY || 140;

  // Rincian Pembayaran (DP & Sisa)
  autoTable(doc, {
    startY: lastY2 + 5,
    head: [['Rincian Pembayaran', 'Nominal']],
    body: [
      ['Total Nilai Pesanan', formatRupiah(order.total_harga)],
      ['Uang Muka (DP) yang Telah Dibayar', formatRupiah(order.uang_muka_dp)],
      ['Sisa Pelunasan', formatRupiah(order.sisa_tagihan)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [100, 116, 139], textColor: 255 },
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right', fontStyle: 'bold', textColor: [21, 63, 138] },
    },
  });

  const lastY3 = (doc as any).lastAutoTable.finalY || 180;

  // Rekening Pembayaran Koperasi
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text('Pembayaran dapat ditransfer melalui Rekening Resmi Koperasi:', 14, lastY3 + 8);
  config.rekening_bank.forEach((rek, idx) => {
    doc.text(`• ${rek.bank} No. ${rek.no_rekening} a.n ${rek.atas_nama}`, 18, lastY3 + 13 + idx * 4.5);
  });

  const sigY = lastY3 + 28;
  doc.setFontSize(8.5);
  doc.text('Pemesan / Klien,', 35, sigY);
  doc.text(order.nama_pemesan, 35, sigY + 20);

  doc.text('Penanggung Jawab Katering,', 135, sigY);
  doc.text(config.bendahara, 135, sigY + 20);

  doc.save(`Surat-Pesanan-Katering-${order.no_pesanan}-${order.nama_pemesan.replace(/\s+/g, '_')}.pdf`);
}

