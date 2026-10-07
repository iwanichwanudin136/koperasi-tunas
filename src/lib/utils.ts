import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format integer to Indonesian Rupiah currency string
 * e.g. 1000000 -> "Rp 1.000.000"
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  const integerAmount = Math.round(amount);
  return `Rp ${integerAmount.toLocaleString('id-ID')}`;
}

/**
 * Format date to standard Indonesian cooperative date format
 * e.g. "2026-10-02" -> "02 Okt 2026"
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format date to ISO format YYYY-MM-DD
 */
export function formatISODate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate Murabahah Financing details
 * AC: simulasi (harga 10 jt, DP 1 jt, margin 12% flat per thn, 12 bulan)
 * Pokok = 10jt - 1jt = 9jt
 * Margin nominal = 9jt * 12% * (12/12) = 1.080.000
 * Total Pembiayaan = 9jt + 1.080.000 = 10.080.000
 * Angsuran per bulan = 10.080.000 / 12 = 840.000
 */
export function calculateMurabahah(
  hargaBarang: number,
  uangMuka: number,
  marginPersenPerTahun: number,
  tenorBulan: number
) {
  const harga = Math.max(0, Math.round(hargaBarang));
  const dp = Math.max(0, Math.min(harga, Math.round(uangMuka)));
  const pokok = harga - dp;
  
  // Margin dihitung proporsional thd durasi tahun (tenorBulan / 12)
  const tenorTahun = tenorBulan / 12;
  const marginNominal = Math.round(pokok * (marginPersenPerTahun / 100) * tenorTahun);
  const totalPembiayaan = pokok + marginNominal;
  
  const angsuranPerBulan = tenorBulan > 0 ? Math.round(totalPembiayaan / tenorBulan) : totalPembiayaan;
  const angsuranPokokPerBulan = tenorBulan > 0 ? Math.round(pokok / tenorBulan) : pokok;
  const angsuranMarginPerBulan = tenorBulan > 0 ? angsuranPerBulan - angsuranPokokPerBulan : marginNominal;

  return {
    harga,
    uangMuka: dp,
    pokok,
    marginPersen: marginPersenPerTahun,
    marginNominal,
    totalPembiayaan,
    tenorBulan,
    angsuranPerBulan,
    angsuranPokokPerBulan,
    angsuranMarginPerBulan,
  };
}

/**
 * Generate Schedule of Installments for Financing
 */
export function generateInstallmentSchedule(
  financingId: string,
  startDateStr: string,
  tenorBulan: number,
  angsuranPokok: number,
  angsuranMargin: number
) {
  const schedule = [];
  const baseDate = new Date(startDateStr);

  for (let i = 1; i <= tenorBulan; i++) {
    const dueDate = new Date(baseDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      id: `INST-${financingId}-${i.toString().padStart(2, '0')}`,
      financing_id: financingId,
      no_ke: i,
      jatuh_tempo: formatISODate(dueDate),
      pokok: angsuranPokok,
      margin: angsuranMargin,
      total_angsuran: angsuranPokok + angsuranMargin,
      dibayar: false,
      denda: 0,
    });
  }

  return schedule;
}

/**
 * Calculate Kolektibilitas based on Overdue Days
 */
export function getCollectibility(overdueDays: number) {
  if (overdueDays <= 0) return 'lancar';
  if (overdueDays <= 90) return 'kurang_lancar';
  if (overdueDays <= 180) return 'diragukan';
  return 'macet';
}

/**
 * Helper to generate sequential code (e.g. A-0001, INV-0001, AKAD-2026-001)
 */
export function generateSequenceCode(prefix: string, lastNumber: number, padLength: number = 4): string {
  const nextNumber = lastNumber + 1;
  return `${prefix}${nextNumber.toString().padStart(padLength, '0')}`;
}
