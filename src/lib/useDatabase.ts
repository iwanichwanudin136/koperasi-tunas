'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { AppDatabase, loadDatabase, saveDatabase, resetDatabase, DEFAULT_USERS } from './storage';
import {
  AuditLog,
  CashEntry,
  CateringOrder,
  CateringPackage,
  CateringPaymentStatus,
  Financing,
  Installment,
  Invoice,
  Member,
  Product,
  SavingsTransaction,
  ShuPeriod,
  ShuResult,
  StockMove,
  UserProfile,
  UserRole,
} from '@/types';


import { formatISODate, generateSequenceCode } from './utils';

function useDatabaseInternal() {
  const [db, setDb] = useState<AppDatabase>(() => {
    return loadDatabase();
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const current = loadDatabase();
    setDb(current);
    setIsLoaded(true);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'koperasi_syariah_db_v1') {
        setDb(loadDatabase());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const mutate = useCallback((updater: (prev: AppDatabase) => AppDatabase) => {
    setDb((prev) => {
      const next = updater(prev);
      saveDatabase(next);
      return next;
    });
  }, []);

  // --- M1: User & Role ---
  const switchUserRole = useCallback((role: UserRole) => {
    mutate((prev) => ({
      ...prev,
      currentUser: DEFAULT_USERS[role],
    }));
  }, [mutate]);

  const logAudit = useCallback((
    aksi: AuditLog['aksi'],
    tabel: string,
    recordId: string,
    keterangan: string,
    sebelum?: any,
    sesudah?: any
  ) => {
    mutate((prev) => {
      const newLog: AuditLog = {
        id: `LOG-${Date.now()}`,
        user_id: prev.currentUser.id,
        nama_user: prev.currentUser.nama,
        peran: prev.currentUser.peran,
        aksi,
        tabel,
        record_id: recordId,
        keterangan,
        sebelum,
        sesudah,
        waktu: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      return {
        ...prev,
        auditLogs: [newLog, ...prev.auditLogs],
      };
    });
  }, [mutate]);

  // --- M2: Members ---
  const addMember = useCallback((memberData: Omit<Member, 'id' | 'no_anggota'>) => {
    let createdMember: Member | null = null;
    mutate((prev) => {
      const activeMembers = prev.members.filter((m) => m.status === 'aktif');
      const candidateMembers = prev.members.filter((m) => m.status === 'calon');

      const prefix = memberData.status === 'calon' ? 'C-' : 'A-';
      const count = memberData.status === 'calon' ? candidateMembers.length : activeMembers.length;
      const no_anggota = generateSequenceCode(prefix, count, 4);

      createdMember = {
        ...memberData,
        id: `MB-${Date.now()}`,
        no_anggota,
      };

      const nextMembers = [createdMember, ...prev.members];
      return { ...prev, members: nextMembers };
    });

    if (createdMember) {
      logAudit('CREATE', 'members', (createdMember as Member).id, `Menambahkan ${(createdMember as Member).status === 'calon' ? 'Calon Anggota' : 'Anggota Baru'}: ${(createdMember as Member).nama}`);
    }
    return createdMember;
  }, [mutate, logAudit]);

  const updateMember = useCallback((id: string, updates: Partial<Member>) => {
    mutate((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
    logAudit('UPDATE', 'members', id, `Memperbarui data anggota ${id}`);
  }, [mutate, logAudit]);

  const approveCandidate = useCallback((id: string) => {
    let approvedName = '';
    mutate((prev) => {
      const activeMembers = prev.members.filter((m) => m.status === 'aktif');
      const nextNoAnggota = generateSequenceCode('A-', activeMembers.length, 4);

      const nextMembers = prev.members.map((m) => {
        if (m.id === id) {
          approvedName = m.nama;
          return {
            ...m,
            no_anggota: nextNoAnggota,
            status: 'aktif' as const,
            tgl_bergabung: formatISODate(new Date()),
          };
        }
        return m;
      });

      return { ...prev, members: nextMembers };
    });
    logAudit('APPROVAL', 'members', id, `Menyetujui calon anggota ${approvedName} menjadi Anggota Aktif`);
  }, [mutate, logAudit]);

  // --- M3: Simpanan ---
  const recordSavingsTx = useCallback((
    memberId: string,
    productId: string,
    tipe: 'setor' | 'tarik',
    jumlah: number,
    keterangan: string
  ) => {
    if (jumlah <= 0) throw new Error('Nominal transaksi harus lebih dari 0');

    let createdTx: SavingsTransaction | null = null;
    let memberName = '';

    mutate((prev) => {
      const member = prev.members.find((m) => m.id === memberId);
      if (!member) throw new Error('Anggota tidak ditemukan');
      memberName = member.nama;

      const product = prev.savingsProducts.find((p) => p.id === productId);
      if (!product) throw new Error('Produk simpanan tidak ditemukan');

      // Validasi Saldo jika penarikan
      if (tipe === 'tarik') {
        const memberTx = prev.savingsTransactions.filter(
          (t) => t.member_id === memberId && t.product_id === productId
        );
        const currentBalance = memberTx.reduce((acc, t) => {
          return t.tipe === 'setor' ? acc + t.jumlah : acc - t.jumlah;
        }, 0);

        if (jumlah > currentBalance) {
          throw new Error(`Saldo tidak mencukupi. Saldo saat ini: Rp ${currentBalance.toLocaleString('id-ID')}`);
        }

        if (product.jenis === 'pokok' || product.jenis === 'wajib') {
          if (member.status !== 'keluar') {
            throw new Error(`Simpanan ${product.nama} hanya dapat ditarik saat anggota berstatus keluar.`);
          }
        }
      }

      const txCount = prev.savingsTransactions.length;
      const no_transaksi = generateSequenceCode('STX-2026-', txCount, 4);

      createdTx = {
        id: `STX-${Date.now()}`,
        no_transaksi,
        member_id: memberId,
        product_id: productId,
        tipe,
        jumlah,
        tanggal: formatISODate(new Date()),
        keterangan: keterangan || (tipe === 'setor' ? `Setoran ${product.nama}` : `Penarikan ${product.nama}`),
        dibuat_oleh: prev.currentUser.nama,
      };

      // Buat entri kas otomatis sesuai PRD
      const newCash: CashEntry = {
        id: `CSH-${Date.now()}`,
        no_kas: generateSequenceCode('KAS-2026-', prev.cashEntries.length, 4),
        tanggal: formatISODate(new Date()),
        arah: tipe === 'setor' ? 'masuk' : 'keluar',
        kategori: tipe === 'setor' ? 'simpanan_masuk' : 'simpanan_tarik',
        jumlah,
        keterangan: `${tipe === 'setor' ? 'Setoran' : 'Penarikan'} ${product.nama} a.n ${memberName} (${member.no_anggota})`,
        ref_tipe: 'simpanan',
        ref_id: createdTx.id,
      };

      return {
        ...prev,
        savingsTransactions: [createdTx, ...prev.savingsTransactions],
        cashEntries: [newCash, ...prev.cashEntries],
      };
    });

    logAudit('CREATE', 'savings_tx', (createdTx as any)?.id || '', `Mencatat transaksi ${tipe} ${jumlah} pada simpanan a.n ${memberName}`);
    return createdTx;
  }, [mutate, logAudit]);

  // --- M4: Pembiayaan ---
  const createFinancing = useCallback((
    data: Omit<Financing, 'id' | 'no_akad' | 'status' | 'kolektibilitas' | 'tgl_pengajuan'>
  ) => {
    let createdFin: Financing | null = null;
    let schedule: Installment[] = [];

    mutate((prev) => {
      const akadCode = data.akad.substring(0, 3).toUpperCase();
      const count = prev.financings.length;
      const no_akad = `AKAD-${akadCode}-2026-${(count + 1).toString().padStart(3, '0')}`;

      createdFin = {
        ...data,
        id: `FIN-${Date.now()}`,
        no_akad,
        status: 'diajukan',
        kolektibilitas: 'lancar',
        tgl_pengajuan: formatISODate(new Date()),
      };

      return {
        ...prev,
        financings: [createdFin, ...prev.financings],
      };
    });

    if (createdFin) {
      logAudit('CREATE', 'financings', (createdFin as Financing).id, `Mengajukan Pembiayaan ${(createdFin as Financing).no_akad} a.n Member ${(createdFin as Financing).member_id}`);
    }
    return createdFin;
  }, [mutate, logAudit]);

  const approveAndDisburseFinancing = useCallback((financingId: string) => {
    let finRecord: Financing | undefined;

    mutate((prev) => {
      finRecord = prev.financings.find((f) => f.id === financingId);
      if (!finRecord) throw new Error('Data pembiayaan tidak ditemukan');

      const member = prev.members.find((m) => m.id === finRecord!.member_id);
      const today = formatISODate(new Date());

      // Buat jadwal angsuran
      const angsuranPokok = Math.round(finRecord.pokok / finRecord.tenor_bulan);
      const angsuranMargin = Math.round(finRecord.margin_nominal / finRecord.tenor_bulan);
      const newSchedule = Array.from({ length: finRecord.tenor_bulan }, (_, i) => {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + (i + 1));
        return {
          id: `INST-${financingId}-${(i + 1).toString().padStart(2, '0')}`,
          financing_id: financingId,
          no_ke: i + 1,
          jatuh_tempo: formatISODate(dueDate),
          pokok: angsuranPokok,
          margin: angsuranMargin,
          total_angsuran: angsuranPokok + angsuranMargin,
          dibayar: false,
          denda: 0,
        };
      });

      // Kas Keluar untuk pencairan pokok
      const cashOut: CashEntry = {
        id: `CSH-${Date.now()}`,
        no_kas: generateSequenceCode('KAS-2026-', prev.cashEntries.length, 4),
        tanggal: today,
        arah: 'keluar',
        kategori: 'pencairan_pembiayaan',
        jumlah: finRecord.pokok,
        keterangan: `Pencairan Pokok Pembiayaan ${finRecord.no_akad} a.n ${member?.nama || '-'}`,
        ref_tipe: 'pembiayaan',
        ref_id: financingId,
      };

      const updatedFinancings = prev.financings.map((f) =>
        f.id === financingId
          ? { ...f, status: 'berjalan' as const, tgl_cair: today }
          : f
      );

      return {
        ...prev,
        financings: updatedFinancings,
        installments: [...prev.installments, ...newSchedule],
        cashEntries: [cashOut, ...prev.cashEntries],
      };
    });

    logAudit('APPROVAL', 'financings', financingId, `Menyetujui dan mencairkan pembiayaan ${finRecord?.no_akad}`);
  }, [mutate, logAudit]);

  const payInstallment = useCallback((installmentId: string) => {
    let paidInst: Installment | undefined;
    let finAkad = '';

    mutate((prev) => {
      paidInst = prev.installments.find((i) => i.id === installmentId);
      if (!paidInst) throw new Error('Jadwal angsuran tidak ditemukan');
      if (paidInst.dibayar) throw new Error('Angsuran sudah pernah dibayar');

      const financing = prev.financings.find((f) => f.id === paidInst!.financing_id);
      finAkad = financing?.no_akad || '';
      const today = formatISODate(new Date());

      // Update installment
      const nextInstallments = prev.installments.map((inst) =>
        inst.id === installmentId
          ? { ...inst, dibayar: true, tgl_bayar: today }
          : inst
      );

      // Cek apakah seluruh angsuran pembiayaan ini sudah lunas
      const remainingForThisFin = nextInstallments.filter(
        (inst) => inst.financing_id === paidInst!.financing_id && !inst.dibayar
      );
      const isAllPaid = remainingForThisFin.length === 0;

      const nextFinancings = prev.financings.map((f) =>
        f.id === paidInst!.financing_id
          ? { ...f, status: isAllPaid ? ('lunas' as const) : f.status }
          : f
      );

      // Catat Kas Masuk (Pokok & Margin)
      const cashEntriesToAdd: CashEntry[] = [];
      if (paidInst.pokok > 0) {
        cashEntriesToAdd.push({
          id: `CSH-P-${Date.now()}`,
          no_kas: generateSequenceCode('KAS-2026-', prev.cashEntries.length, 4),
          tanggal: today,
          arah: 'masuk',
          kategori: 'angsuran_pokok',
          jumlah: paidInst.pokok,
          keterangan: `Angsuran Pokok ke-${paidInst.no_ke} ${finAkad}`,
          ref_tipe: 'pembiayaan',
          ref_id: paidInst.id,
        });
      }
      if (paidInst.margin > 0) {
        cashEntriesToAdd.push({
          id: `CSH-M-${Date.now()}`,
          no_kas: generateSequenceCode('KAS-2026-', prev.cashEntries.length + 1, 4),
          tanggal: today,
          arah: 'masuk',
          kategori: 'margin_pembiayaan',
          jumlah: paidInst.margin,
          keterangan: `Margin Pembiayaan ke-${paidInst.no_ke} ${finAkad}`,
          ref_tipe: 'pembiayaan',
          ref_id: paidInst.id,
        });
      }

      return {
        ...prev,
        installments: nextInstallments,
        financings: nextFinancings,
        cashEntries: [...cashEntriesToAdd, ...prev.cashEntries],
      };
    });

    logAudit('CREATE', 'installments', installmentId, `Mencatat pembayaran angsuran ke-${paidInst?.no_ke} untuk ${finAkad}`);
  }, [mutate, logAudit]);

  // --- M5 & M6: Produk & Invoice ---
  const addProduct = useCallback((productData: Omit<Product, 'id'>) => {
    let createdProduct: Product | null = null;
    mutate((prev) => {
      createdProduct = {
        ...productData,
        id: `PRD-${Date.now()}`,
      };

      // Catat initial stock move jika stok awal > 0
      const moves: StockMove[] = [];
      if (createdProduct.stok > 0) {
        moves.push({
          id: `SMV-${Date.now()}`,
          product_id: createdProduct.id,
          tipe: 'masuk',
          jumlah: createdProduct.stok,
          stok_sebelum: 0,
          stok_sesudah: createdProduct.stok,
          tanggal: formatISODate(new Date()),
          keterangan: 'Stok Awal Pendaftaran Produk',
          ref_tipe: 'kulakan',
        });
      }

      return {
        ...prev,
        products: [createdProduct, ...prev.products],
        stockMoves: [...moves, ...prev.stockMoves],
      };
    });
    logAudit('CREATE', 'products', (createdProduct as any)?.id || '', `Menambahkan produk baru: ${(createdProduct as any)?.nama}`);
    return createdProduct;
  }, [mutate, logAudit]);

  const updateProductStock = useCallback((
    productId: string,
    tipe: 'masuk' | 'keluar' | 'opname',
    jumlah: number,
    keterangan: string
  ) => {
    let moveRecord: StockMove | null = null;
    mutate((prev) => {
      const product = prev.products.find((p) => p.id === productId);
      if (!product) throw new Error('Produk tidak ditemukan');

      let newStock = product.stok;
      if (tipe === 'masuk') {
        newStock += jumlah;
      } else if (tipe === 'keluar') {
        if (jumlah > product.stok) throw new Error(`Stok tidak mencukupi (tersisa ${product.stok})`);
        newStock -= jumlah;
      } else if (tipe === 'opname') {
        newStock = jumlah; // set exact
      }

      moveRecord = {
        id: `SMV-${Date.now()}`,
        product_id: productId,
        tipe,
        jumlah,
        stok_sebelum: product.stok,
        stok_sesudah: newStock,
        tanggal: formatISODate(new Date()),
        keterangan,
        ref_tipe: 'penyesuaian',
      };

      const updatedProducts = prev.products.map((p) =>
        p.id === productId ? { ...p, stok: newStock } : p
      );

      return {
        ...prev,
        products: updatedProducts,
        stockMoves: [moveRecord, ...prev.stockMoves],
      };
    });

    logAudit('UPDATE', 'products', productId, `Penyesuaian stok (${tipe}) produk: ${keterangan}`);
  }, [mutate, logAudit]);

  const createInvoice = useCallback((
    invoiceData: Omit<Invoice, 'id' | 'no_invoice'>,
    isPaidImmediately: boolean = false
  ) => {
    let createdInvoice: Invoice | null = null;

    mutate((prev) => {
      // Validasi stok produk
      for (const item of invoiceData.items) {
        const product = prev.products.find((p) => p.id === item.product_id);
        if (!product) throw new Error(`Produk ${item.nama_produk} tidak ditemukan`);
        if (product.stok < item.qty) {
          throw new Error(`Stok untuk produk ${product.nama} tidak mencukupi (tersedia: ${product.stok})`);
        }
      }

      const count = prev.invoices.length;
      const no_invoice = generateSequenceCode('INV-2026-', count, 4);

      createdInvoice = {
        ...invoiceData,
        id: `INV-${Date.now()}`,
        no_invoice,
        status: isPaidImmediately ? 'lunas' : invoiceData.status,
      };

      // Potong stok produk
      const nextProducts = prev.products.map((p) => {
        const item = invoiceData.items.find((i) => i.product_id === p.id);
        if (item) {
          return { ...p, stok: p.stok - item.qty };
        }
        return p;
      });

      // Catat pergerakan stok keluar
      const newStockMoves: StockMove[] = invoiceData.items.map((item) => {
        const prod = prev.products.find((p) => p.id === item.product_id)!;
        return {
          id: `SMV-${Date.now()}-${item.product_id}`,
          product_id: item.product_id,
          tipe: 'keluar',
          jumlah: item.qty,
          stok_sebelum: prod.stok,
          stok_sesudah: prod.stok - item.qty,
          tanggal: invoiceData.tanggal,
          keterangan: `Penjualan Invoice ${no_invoice} (${invoiceData.nama_pelanggan})`,
          ref_tipe: 'invoice',
          ref_id: createdInvoice!.id,
        };
      });

      // Jika langsung lunas, catat ke Buku Kas Masuk
      const nextCash = [...prev.cashEntries];
      if (isPaidImmediately || createdInvoice.status === 'lunas') {
        nextCash.unshift({
          id: `CSH-${Date.now()}`,
          no_kas: generateSequenceCode('KAS-2026-', prev.cashEntries.length, 4),
          tanggal: invoiceData.tanggal,
          arah: 'masuk',
          kategori: 'penjualan_toko',
          jumlah: createdInvoice.total,
          keterangan: `Penjualan Toko Invoice ${no_invoice} a.n ${createdInvoice.nama_pelanggan}`,
          ref_tipe: 'invoice',
          ref_id: createdInvoice.id,
        });
      }

      return {
        ...prev,
        invoices: [createdInvoice, ...prev.invoices],
        products: nextProducts,
        stockMoves: [...newStockMoves, ...prev.stockMoves],
        cashEntries: nextCash,
      };
    });

    logAudit('CREATE', 'invoices', (createdInvoice as any)?.id || '', `Membuat invoice ${(createdInvoice as any)?.no_invoice} senilai Rp ${(createdInvoice as any)?.total?.toLocaleString('id-ID')}`);
    return createdInvoice;
  }, [mutate, logAudit]);

  const payInvoice = useCallback((invoiceId: string) => {
    let invoiceNo = '';
    mutate((prev) => {
      const inv = prev.invoices.find((i) => i.id === invoiceId);
      if (!inv) throw new Error('Invoice tidak ditemukan');
      if (inv.status === 'lunas') throw new Error('Invoice sudah lunas');
      invoiceNo = inv.no_invoice;

      const updatedInvoices = prev.invoices.map((i) =>
        i.id === invoiceId ? { ...i, status: 'lunas' as const } : i
      );

      const cashEntry: CashEntry = {
        id: `CSH-${Date.now()}`,
        no_kas: generateSequenceCode('KAS-2026-', prev.cashEntries.length, 4),
        tanggal: formatISODate(new Date()),
        arah: 'masuk',
        kategori: 'penjualan_toko',
        jumlah: inv.total,
        keterangan: `Pelunasan Invoice ${inv.no_invoice} a.n ${inv.nama_pelanggan}`,
        ref_tipe: 'invoice',
        ref_id: invoiceId,
      };

      return {
        ...prev,
        invoices: updatedInvoices,
        cashEntries: [cashEntry, ...prev.cashEntries],
      };
    });

    logAudit('UPDATE', 'invoices', invoiceId, `Pelunasan invoice ${invoiceNo}`);
  }, [mutate, logAudit]);

  // --- M5: Kas Manual ---
  const addCashEntry = useCallback((
    entry: Omit<CashEntry, 'id' | 'no_kas'>
  ) => {
    let createdCash: CashEntry | null = null;
    mutate((prev) => {
      const count = prev.cashEntries.length;
      createdCash = {
        ...entry,
        id: `CSH-${Date.now()}`,
        no_kas: generateSequenceCode('KAS-2026-', count, 4),
      };
      return {
        ...prev,
        cashEntries: [createdCash, ...prev.cashEntries],
      };
    });
    logAudit('CREATE', 'cash_entries', (createdCash as any)?.id || '', `Mencatat Kas ${entry.arah.toUpperCase()} Rp ${entry.jumlah.toLocaleString('id-ID')}: ${entry.keterangan}`);
    return createdCash;
  }, [mutate, logAudit]);

  // --- M7: Pemegang Saham & SHU Calculation ---
  const calculateAndSetShu = useCallback((
    tahun: number,
    totalShu: number,
    persentase: ShuPeriod['persentase']
  ) => {
    // Validasi total persentase harus 100% sesuai AC PRD
    const totalPersen = Object.values(persentase).reduce((a, b) => a + b, 0);
    if (Math.abs(totalPersen - 100) > 0.01) {
      throw new Error(`Total alokasi komponen SHU harus tepat 100% (saat ini ${totalPersen}%)`);
    }

    mutate((prev) => {
      // Hitung total simpanan pokok & wajib semua anggota aktif (Modal Anggota)
      const activeMembers = prev.members.filter((m) => m.status === 'aktif');
      
      const memberModalMap = new Map<string, number>();
      let grandTotalModal = 0;

      activeMembers.forEach((member) => {
        const memberTx = prev.savingsTransactions.filter(
          (t) => t.member_id === member.id && (t.product_id === 'SP-01' || t.product_id === 'SP-02')
        );
        const modal = memberTx.reduce((acc, t) => (t.tipe === 'setor' ? acc + t.jumlah : acc - t.jumlah), 0);
        memberModalMap.set(member.id, modal);
        grandTotalModal += modal;
      });

      // Hitung total transaksi/belanja & pembiayaan per anggota
      const memberTransaksiMap = new Map<string, number>();
      let grandTotalTransaksi = 0;

      activeMembers.forEach((member) => {
        // Dari invoice belanja
        const invTotal = prev.invoices
          .filter((inv) => inv.member_id === member.id && inv.status === 'lunas')
          .reduce((acc, inv) => acc + inv.total, 0);

        // Dari pembiayaan
        const finTotal = prev.financings
          .filter((f) => f.member_id === member.id && f.status !== 'ditolak')
          .reduce((acc, f) => acc + f.pokok, 0);

        const totalTrx = invTotal + finTotal;
        memberTransaksiMap.set(member.id, totalTrx);
        grandTotalTransaksi += totalTrx;
      });

      // Alokasi Dana SHU
      const poolJasaSimpanan = Math.round(totalShu * (persentase.jasa_simpanan / 100));
      const poolJasaTransaksi = Math.round(totalShu * (persentase.jasa_transaksi / 100));

      const shuResults: ShuResult[] = activeMembers.map((member) => {
        const modal = memberModalMap.get(member.id) || 0;
        const persentaseModal = grandTotalModal > 0 ? (modal / grandTotalModal) * 100 : 0;
        const jasaSimpanan = grandTotalModal > 0 ? Math.round((modal / grandTotalModal) * poolJasaSimpanan) : 0;

        const trx = memberTransaksiMap.get(member.id) || 0;
        const jasaTransaksi = grandTotalTransaksi > 0 ? Math.round((trx / grandTotalTransaksi) * poolJasaTransaksi) : 0;

        const totalShuMember = jasaSimpanan + jasaTransaksi;

        return {
          member_id: member.id,
          tahun,
          simpanan_pokok_wajib: modal,
          persentase_modal: Number(persentaseModal.toFixed(2)),
          jasa_simpanan: jasaSimpanan,
          transaksi_belanja_pembiayaan: trx,
          jasa_transaksi: jasaTransaksi,
          total_shu_diterima: totalShuMember,
        };
      });

      const newShuPeriod: ShuPeriod = {
        tahun,
        total_shu: totalShu,
        persentase,
        status: 'ditetapkan',
        tgl_penetapan: formatISODate(new Date()),
      };

      const nextPeriods = [
        newShuPeriod,
        ...prev.shuPeriods.filter((p) => p.tahun !== tahun),
      ];

      return {
        ...prev,
        shuPeriods: nextPeriods,
        shuResults: shuResults,
      };
    });

    logAudit('APPROVAL', 'shu_periods', `${tahun}`, `Menetapkan pembagian SHU Tahun Buku ${tahun} senilai Rp ${totalShu.toLocaleString('id-ID')}`);
  }, [mutate, logAudit]);

  // --- M8: Katering Syariah ---
  const addCateringPackage = useCallback((pkgData: Omit<CateringPackage, 'id'>) => {
    let createdPkg: CateringPackage | null = null;
    mutate((prev) => {
      createdPkg = {
        ...pkgData,
        id: `CAT-${Date.now()}`,
      };
      return {
        ...prev,
        cateringPackages: [createdPkg, ...prev.cateringPackages],
      };
    });
    logAudit('CREATE', 'catering_packages', (createdPkg as any)?.id || '', `Menambahkan paket katering baru: ${(createdPkg as any)?.nama}`);
    return createdPkg;
  }, [mutate, logAudit]);

  const updateCateringPackage = useCallback((id: string, updates: Partial<CateringPackage>) => {
    mutate((prev) => ({
      ...prev,
      cateringPackages: prev.cateringPackages.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
    logAudit('UPDATE', 'catering_packages', id, `Memperbarui data paket katering ${id}`);
  }, [mutate, logAudit]);

  const deleteCateringPackage = useCallback((id: string) => {
    mutate((prev) => ({
      ...prev,
      cateringPackages: prev.cateringPackages.filter((p) => p.id !== id),
    }));
    logAudit('DELETE', 'catering_packages', id, `Menghapus paket katering ${id}`);
  }, [mutate, logAudit]);

  const createCateringOrder = useCallback((
    orderData: Omit<CateringOrder, 'id' | 'no_pesanan' | 'tgl_pesan'>,
    isDpPaidImmediately: boolean = false
  ) => {
    let createdOrder: CateringOrder | null = null;
    const today = formatISODate(new Date());

    mutate((prev) => {
      const count = prev.cateringOrders.length;
      const no_pesanan = generateSequenceCode('KAT-2026-', count, 4);

      const paymentStatus: CateringOrder['status_pembayaran'] =
        orderData.uang_muka_dp >= orderData.total_harga
          ? 'lunas'
          : orderData.uang_muka_dp > 0
          ? 'dp_lunas'
          : 'belum_dp';

      createdOrder = {
        ...orderData,
        id: `CORD-${Date.now()}`,
        no_pesanan,
        tgl_pesan: today,
        status_pembayaran: paymentStatus,
      };

      const nextCash = [...prev.cashEntries];
      if (isDpPaidImmediately && createdOrder.uang_muka_dp > 0) {
        nextCash.unshift({
          id: `CSH-${Date.now()}`,
          no_kas: generateSequenceCode('KAS-2026-', prev.cashEntries.length, 4),
          tanggal: today,
          arah: 'masuk',
          kategori: 'penjualan_toko',
          jumlah: createdOrder.uang_muka_dp,
          keterangan: `Penerimaan DP Katering ${no_pesanan} (${createdOrder.nama_paket} - ${createdOrder.nama_pemesan})`,
          ref_tipe: 'invoice',
          ref_id: createdOrder.id,
        });
      }

      return {
        ...prev,
        cateringOrders: [createdOrder, ...prev.cateringOrders],
        cashEntries: nextCash,
      };
    });

    logAudit('CREATE', 'catering_orders', (createdOrder as any)?.id || '', `Pemesanan katering baru ${(createdOrder as any)?.no_pesanan} a.n ${(createdOrder as any)?.nama_pemesan}`);
    return createdOrder;
  }, [mutate, logAudit]);

  const updateCateringOrderStatus = useCallback((orderId: string, status: CateringOrder['status_pesanan']) => {
    let orderNo = '';
    mutate((prev) => {
      const ord = prev.cateringOrders.find((o) => o.id === orderId);
      if (ord) orderNo = ord.no_pesanan;
      return {
        ...prev,
        cateringOrders: prev.cateringOrders.map((o) =>
          o.id === orderId ? { ...o, status_pesanan: status } : o
        ),
      };
    });
    logAudit('UPDATE', 'catering_orders', orderId, `Memperbarui status pesanan katering ${orderNo} menjadi: ${status.toUpperCase()}`);
  }, [mutate, logAudit]);

  const payCateringOrder = useCallback((orderId: string, amount: number, tipe: 'dp' | 'pelunasan') => {
    if (amount <= 0) throw new Error('Nominal pembayaran harus lebih dari 0');

    let ordRecord: CateringOrder | undefined;
    const today = formatISODate(new Date());

    mutate((prev) => {
      ordRecord = prev.cateringOrders.find((o) => o.id === orderId);
      if (!ordRecord) throw new Error('Pesanan katering tidak ditemukan');

      const newDp = ordRecord.uang_muka_dp + amount;
      const newSisa = Math.max(0, ordRecord.total_harga - newDp);
      const newStatusBayar: CateringPaymentStatus = newSisa === 0 ? 'lunas' : newDp > 0 ? 'dp_lunas' : 'belum_dp';

      const updatedOrders = prev.cateringOrders.map((o) =>

        o.id === orderId
          ? {
              ...o,
              uang_muka_dp: newDp,
              sisa_tagihan: newSisa,
              status_pembayaran: newStatusBayar,
            }
          : o
      );

      const cashEntry: CashEntry = {
        id: `CSH-${Date.now()}`,
        no_kas: generateSequenceCode('KAS-2026-', prev.cashEntries.length, 4),
        tanggal: today,
        arah: 'masuk',
        kategori: 'penjualan_toko',
        jumlah: amount,
        keterangan: `Pembayaran ${tipe === 'dp' ? 'DP' : 'Pelunasan'} Katering ${ordRecord.no_pesanan} a.n ${ordRecord.nama_pemesan}`,
        ref_tipe: 'invoice',
        ref_id: orderId,
      };

      return {
        ...prev,
        cateringOrders: updatedOrders,
        cashEntries: [cashEntry, ...prev.cashEntries],
      };
    });

    logAudit('CREATE', 'catering_orders', orderId, `Menerima pembayaran ${tipe} Rp ${amount.toLocaleString('id-ID')} untuk ${ordRecord?.no_pesanan}`);
  }, [mutate, logAudit]);

  const resetToDefault = useCallback(() => {
    const fresh = resetDatabase();
    setDb(fresh);
  }, []);

  return {
    db,
    isLoaded,
    switchUserRole,
    addMember,
    updateMember,
    approveCandidate,
    recordSavingsTx,
    createFinancing,
    approveAndDisburseFinancing,
    payInstallment,
    addProduct,
    updateProductStock,
    createInvoice,
    payInvoice,
    addCashEntry,
    calculateAndSetShu,
    addCateringPackage,
    updateCateringPackage,
    deleteCateringPackage,
    createCateringOrder,
    updateCateringOrderStatus,
    payCateringOrder,
    resetToDefault,
    logAudit,
  };
}


export type DatabaseContextType = ReturnType<typeof useDatabaseInternal>;

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const value = useDatabaseInternal();
  return React.createElement(DatabaseContext.Provider, { value }, children);
}

export function useDatabase(): DatabaseContextType {
  const context = useContext(DatabaseContext);
  if (!context) {
    return useDatabaseInternal();
  }
  return context;
}

