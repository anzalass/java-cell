import { PrismaClient } from "@prisma/client";
import { prismaErrorHandler } from "../utils/errorHandlerPrisma.js";
import { getJualanVoucherHarian } from "./jualanVoucherService.js";
const prisma = new PrismaClient();

export const dashboardPageService = async () => {
  try {
    // Hitung awal dan akhir hari ini
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const endOfToday = new Date(new Date(startOfToday).setHours(24, 0, 0, 0));

    const todayFilter = {
      gte: startOfToday,
      lt: endOfToday,
    };

    // ================== Transaksi Voucher ==================
    const transaksiVoucherToday = await prisma.transaksiVoucherDownline.count({
      where: { tanggal: todayFilter },
    });

    const { _sum: voucherSum } =
      await prisma.transaksiVoucherDownline.aggregate({
        _sum: { totalHarga: true },
        where: { tanggal: todayFilter, status: "Selesai" },
      });
    const totalPendapatanVoucherHariIni = voucherSum.totalHarga || 0;

    // ================== Transaksi Sparepart ==================
    const transaksiSparepartToday = await prisma.transaksiSparepat.count({
      where: { tanggal: todayFilter },
    });

    const { _sum: SparepartSum } = await prisma.transaksiSparepat.aggregate({
      _sum: { totalHarga: true },
      where: { tanggal: todayFilter },
    });
    const totalPendapatanSparepartHariIni = SparepartSum.totalHarga || 0;

    // ================== Transaksi Aksesoris ==================
    const transaksiAksesorisToday = await prisma.transaksiAksesoris.count({
      where: { tanggal: todayFilter },
    });

    const { _sum: aksesorisSum } = await prisma.transaksiAksesoris.aggregate({
      _sum: { totalHarga: true },
      where: { tanggal: todayFilter },
    });
    const totalPendapatanAksesorisHariIni = aksesorisSum.totalHarga || 0;

    // ================== Service HP ==================
    const serviceHpToday = await prisma.serviceHP.count({
      where: { tanggal: todayFilter },
    });

    const { _sum: serviceSum } = await prisma.serviceHP.aggregate({
      _sum: { biayaJasa: true },
      where: { tanggal: todayFilter },
    });
    const totalPendapatanServiceHariIni = serviceSum.biayaJasa || 0;

    // ================== Uang Modal ==================
    const { _sum: modalSum } = await prisma.uangModal.aggregate({
      _sum: { jumlah: true },
      where: { tanggal: todayFilter },
    });
    const totalUangModalHariIni = modalSum.jumlah || 0;

    // ================== Pending Voucher ==================
    const pendingVoucher = await prisma.transaksiVoucherDownline.count({
      where: { status: "Pending" },
    });

    // ================== Tabel Transaksi Hari Ini ==================
    const tableTransaksiVoucherToday =
      await prisma.transaksiVoucherDownline.findMany({
        where: { tanggal: todayFilter },
      });

    const tableTransaksiAksesorisToday =
      await prisma.transaksiAksesoris.findMany({
        where: { tanggal: todayFilter },
      });

    const tableTransaksiSparepartToday =
      await prisma.transaksiSparepat.findMany({
        where: { tanggal: todayFilter },
      });

    const tableUangModalToday = await prisma.uangModal.findMany({
      where: { tanggal: todayFilter },
    });

    const tableServiceHPToday = await prisma.serviceHP.findMany({
      where: { tanggal: todayFilter },
    });

    const tableLogs = await prisma.log.findMany();

    // ================== Aksesoris Terlaris by Brand ==================
    const aksesorisItems = await prisma.itemsTransaksiAksesoris.findMany({
      include: { Aksesoris: true },
    });

    const brandMap = new Map(); // brand => Map<kategori, total>
    const kategoriMap = new Map(); // kategori => Map<brand, total>
    const nameMap = new Map(); // nama => { total, brand, kategori }

    aksesorisItems.forEach((item) => {
      const { brand, kategori, nama } = item.Aksesoris ?? {};
      const quantity = item.quantity;

      if (!brand || !kategori || !nama) return;

      // --- NAME MAP ---
      if (!nameMap.has(nama)) {
        nameMap.set(nama, { total: 0, brand, kategori });
      }
      const existing = nameMap.get(nama);
      existing.total += quantity;

      // --- BRAND MAP ---
      if (!brandMap.has(brand)) brandMap.set(brand, new Map());
      const kategoriMapForBrand = brandMap.get(brand);
      kategoriMapForBrand.set(
        kategori,
        (kategoriMapForBrand.get(kategori) || 0) + quantity
      );

      // --- KATEGORI MAP ---
      if (!kategoriMap.has(kategori)) kategoriMap.set(kategori, new Map());
      const brandMapForKategori = kategoriMap.get(kategori);
      brandMapForKategori.set(
        brand,
        (brandMapForKategori.get(brand) || 0) + quantity
      );
    });

    // --- Aksesoris Terlaris by Nama ---
    const aksesorisTerlarisByNama = [];
    nameMap.forEach(({ total, brand, kategori }, nama) => {
      aksesorisTerlarisByNama.push({
        nama,
        total,
        brand,
        kategori,
      });
    });

    // Optional: urutkan berdasarkan total terbanyak
    aksesorisTerlarisByNama.sort((a, b) => b.total - a.total);

    // Hasil akhir: cari kategori terlaris per brand
    const aksesorisTerlarisByBrand = [];
    brandMap.forEach((kategoriTotals, brand) => {
      let topKategori = "";
      let maxTotal = 0;
      kategoriTotals.forEach((total, kategori) => {
        if (total > maxTotal) {
          maxTotal = total;
          topKategori = kategori;
        }
      });

      aksesorisTerlarisByBrand.push({
        brand,
        kategori: topKategori,
        total: maxTotal,
      });
    });

    // Hasil akhir: cari brand terlaris per kategori
    const aksesorisTerlarisByKategori = [];
    kategoriMap.forEach((brandTotals, kategori) => {
      let topBrand = "";
      let maxTotal = 0;
      brandTotals.forEach((total, brand) => {
        if (total > maxTotal) {
          maxTotal = total;
          topBrand = brand;
        }
      });

      aksesorisTerlarisByKategori.push({
        kategori,
        brand: topBrand,
        total: maxTotal,
      });
    });

    // Sortir hasil
    aksesorisTerlarisByBrand.sort((a, b) => b.total - a.total);
    aksesorisTerlarisByKategori.sort((a, b) => b.total - a.total);
    aksesorisTerlarisByNama.sort((a, b) => b.total - a.total);

    // ================== Voucher Terlaris by Brand ==================
    const voucherItems = await prisma.itemsTransaksiVoucherDownline.findMany({
      include: { Voucher: true },
    });

    const brandVoucherMap = new Map();

    voucherItems.forEach((item) => {
      const brand = item.Voucher.brand;
      const quantity = item.quantity;

      if (!brandVoucherMap.has(brand)) {
        brandVoucherMap.set(brand, { brand, total: 0 });
      }
      brandVoucherMap.get(brand).total += quantity;
    });

    const voucherTerlarisByBrand = Array.from(brandVoucherMap.values()).sort(
      (a, b) => b.total - a.total
    );

    // ================== Return Data ==================
    return {
      transaksiVoucherToday,
      totalPendapatanVoucherHariIni,
      transaksiSparepartToday,
      totalPendapatanSparepartHariIni,
      transaksiAksesorisToday,
      totalPendapatanAksesorisHariIni,
      serviceHpToday,
      totalPendapatanServiceHariIni,
      totalUangModalHariIni,
      pendingVoucher,
      tableTransaksiVoucherToday,
      tableTransaksiAksesorisToday,
      tableTransaksiSparepartToday,
      tableUangModalToday,
      tableServiceHPToday,
      tableLogs,
      aksesorisTerlarisByBrand,
      aksesorisTerlarisByKategori,
      voucherTerlarisByBrand,
      aksesorisTerlarisByNama,
    };
  } catch (error) {
    console.error("Dashboard Service Error:", error);
    const errorMessage = prismaErrorHandler(error);
    throw new Error(errorMessage);
  }
};

export const grosirVoucherPageService = async () => {
  try {
    const allTransaksiVoucher =
      await prisma.transaksiVoucherDownline.findMany();
    const allItemTransaksi =
      await prisma.itemsTransaksiVoucherDownline.findMany({
        include: {
          Voucher: true, // Ambil data relasi
        },
      });

    // Flatten data — gabungkan nama voucher ke dalam item
    const flattened = allItemTransaksi.map((item) => ({
      id: item.id,
      idTransaksi: item.idTransaksi,
      quantity: item.quantity,
      brand: item.Voucher.brand,
      namaVoucher: item.Voucher.nama, // ✅ ambil langsung dari relasi
      hargaVoucher: item.Voucher.harga,
    }));

    return {
      allTransaksiVoucher,
      allItemTransaksi: flattened,
    };
  } catch (error) {
    console.error("Dashboard Service Error:", error);
    const errorMessage = prismaErrorHandler(error);
    throw new Error(errorMessage);
  }
};

export const transaksiSparepartPageService = async () => {
  try {
    const allTransaksiSparepart = await prisma.transaksiSparepat.findMany();
    const allItemTransaksi = await prisma.itemsTransaksiSparepart.findMany({
      include: {
        Sparepart: true, // Ambil data relasi
      },
    });

    // Flatten data — gabungkan nama voucher ke dalam item
    const flattened = allItemTransaksi.map((item) => ({
      id: item.id,
      idTransaksi: item.idTransaksi,
      quantity: item.quantity,
      brand: item.Sparepart.brand,
      namaSparepart: item.Sparepart.nama, // ✅ ambil langsung dari relasi
      hargaJual: item.Sparepart.hargaJual,
    }));

    return {
      allTransaksiSparepart,
      allItemTransaksi: flattened,
    };
  } catch (error) {
    console.error("Dashboard Service Error:", error);
    const errorMessage = prismaErrorHandler(error);
    throw new Error(errorMessage);
  }
};

export const transaksiAksesorisPageService = async () => {
  try {
    const allTransaksiAksesoris = await prisma.transaksiAksesoris.findMany();
    const allItemTransaksi = await prisma.itemsTransaksiAksesoris.findMany({
      include: {
        Aksesoris: true, // Ambil data relasi
      },
    });

    // Flatten data — gabungkan nama voucher ke dalam item
    const flattened = allItemTransaksi.map((item) => ({
      id: item.id,
      idTransaksi: item.idTransaksi,
      quantity: item.quantity,
      nama: item.Aksesoris.nama, // ✅ ambil langsung dari relasi
      harga: item.Aksesoris.harga,
      brand: item.Aksesoris.brand,
    }));

    return {
      allTransaksiAksesoris,
      allItemTransaksi: flattened,
    };
  } catch (error) {
    console.error("Dashboard Service Error:", error);
    const errorMessage = prismaErrorHandler(error);
    throw new Error(errorMessage);
  }
};

export const serviceHPPageService = async () => {
  try {
    const allService = await prisma.serviceHP.findMany();
    const allItemTransaksi = await prisma.sparepartServiceHP.findMany({
      include: {
        Sparepart: true, // Ambil data relasi
      },
    });

    // Flatten data — gabungkan nama voucher ke dalam item
    const flattened = allItemTransaksi.map((item) => ({
      id: item.id,
      idTransaksi: item.idTransaksi,
      quantity: item.quantity,
      nama: item.Sparepart.nama, // ✅ ambil langsung dari relasi
      harga: item.Sparepart.hargaJual,
      brand: item.Sparepart.brand,
    }));

    return {
      allService,
      allItemTransaksi: flattened,
    };
  } catch (error) {
    console.error("Dashboard Service Error:", error);
    const errorMessage = prismaErrorHandler(error);
    throw new Error(errorMessage);
  }
};

export const dashboardPageService2 = async (
  user,
  {
    // === Search (opsional) ===
    searchAccStok = "",
    searchSparepartStok = "",
    searchVdStok = "",
  } = {}
) => {
  try {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    const todayFilter = {
      createdAt: {
        gte: startOfToday,
        lt: endOfToday,
      },
    };

    // === AGREGAT & COUNT (ringan, tidak perlu paginate) ===
    const [
      totalKeuntunganHariIni, //o
      trxHariIniTotal, // o

      omsetGrosirVoucherHariIni, //o
      keuntunganGrosirVoucherHariIni, //o
      trxVoucherDownlineHariIniTotal, // o
      trxVoucherPendingHariIni, //o

      omsetAccHariIni,
      keuntunganAccHariIni,
      trxAccHariIniTotal,
      omsetSparepartHariIni,
      keuntunganSparepartHariIni,
      trxSparepartHariIniTotal,
      omsetServicetHariIni,
      keuntunganServiceHariIni,
      trxServiceHariIniTotal,
      uangModal,
    ] = await prisma.$transaction([
      prisma.jualanHarian.aggregate({
        _sum: { nominal: true },
        where: todayFilter,
      }),
      prisma.jualanHarian.count({
        where: {
          createdAt: {
            gte: startOfToday,
            lt: endOfToday,
          },
        },
      }),

      //================
      prisma.transaksiVoucherDownline.aggregate({
        _sum: { totalHarga: true },
        where: {
          createdAt: {
            gte: startOfToday,
            lt: endOfToday,
          },
          status: "Selesai",
        },
      }),
      prisma.transaksiVoucherDownline.aggregate({
        _sum: { keuntungan: true },
        where: {
          createdAt: {
            gte: startOfToday,
            lt: endOfToday,
          },
          status: "Selesai",
        },
      }),
      prisma.transaksiVoucherDownline.count({
        where: todayFilter,
      }),

      prisma.transaksiVoucherDownline.count({
        where: {
          createdAt: {
            gte: startOfToday,
            lt: endOfToday,
          },
          status: "Pending",
        },
      }),
      prisma.transaksiAksesoris.aggregate({
        _sum: { totalHarga: true },
        where: todayFilter,
      }),
      prisma.transaksiAksesoris.aggregate({
        _sum: { keuntungan: true },
        where: todayFilter,
      }),
      prisma.transaksiAksesoris.count({ where: todayFilter }),
      prisma.transaksiSparepat.aggregate({
        _sum: { totalHarga: true },
        where: todayFilter,
      }),
      prisma.transaksiSparepat.aggregate({
        _sum: { keuntungan: true },
        where: todayFilter,
      }),
      prisma.transaksiSparepat.count({ where: todayFilter }),
      prisma.serviceHP.aggregate({
        _sum: {
          hargaSparePart: true,
          biayaJasa: true,
        },
        where: todayFilter,
      }),
      prisma.serviceHP.aggregate({
        _sum: { keuntungan: true },
        where: {
          createdAt: {
            gte: startOfToday,
            lt: endOfToday,
          },
          status: "Selesai",
        },
      }),
      prisma.serviceHP.count({ where: todayFilter }),
      prisma.uangModal.aggregate({
        _sum: { jumlah: true },
        where: todayFilter,
      }),
    ]);

    // === FIND MANY DENGAN PAGINATION (limit terpisah) ===
    const [
      trxVoucherDownlineHariIni,
      trxAccHariIni,
      trxServiceHariIni,
      trxSparepartHariIni,
      uangModalHariIni,
      stokAcc,
      stokSparepart,
      stokVd,
    ] = await prisma.$transaction([
      // Voucher
      prisma.transaksiVoucherDownline.findMany({
        where: todayFilter,
        select: {
          id: true,
          downline: {
            select: {
              kodeDownline: true,
              nama: true,
            },
          },
          tanggal: true,
          keuntungan: true,
          penempatan: true,
          status: true,
          items: {
            select: {
              Voucher: {
                select: {
                  nama: true,
                  brand: true,
                  hargaJual: true,
                  hargaPokok: true,
                },
              },
              quantity: true,
            },
          },
          totalHarga: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      // Aksesoris (transaksi jual beli aksesoris)
      prisma.transaksiAksesoris.findMany({
        where: todayFilter,
        select: {
          namaPembeli: true,
          keuntungan: true,
          id: true,
          tanggal: true,
          totalHarga: true,
          penempatan: true,
          items: {
            select: {
              Aksesoris: {
                select: {
                  nama: true,
                  brand: true,
                  hargaJual: true,
                },
              },
              quantity: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      // Service HP (service handphone)
      prisma.serviceHP.findMany({
        where: todayFilter,
        select: {
          brandHP: true,
          id: true,
          keterangan: true,
          keuntungan: true,
          namaPelangan: true,
          biayaJasa: true,
          penempatan: true,
          tanggal: true,
          status: true,
          Member: {
            select: {
              nama: true,
              noTelp: true,
            },
          },
          Sparepart: {
            select: {
              Sparepart: {
                select: {
                  nama: true,
                  hargaJual: true,
                  hargaModal: true,
                  brand: true,
                },
              },
              quantity: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      // Transaksi Sparepart (jual beli sparepart, bukan service)
      prisma.transaksiSparepat.findMany({
        where: todayFilter,
        select: {
          namaPembeli: true,
          id: true,
          idMember: true,
          keuntungan: true,
          penempatan: true,
          tanggal: true,
          totalHarga: true,
          items: {
            select: {
              Sparepart: {
                select: {
                  brand: true,
                  nama: true,
                  hargaJual: true,
                  hargaModal: true,
                },
              },
              quantity: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.uangModal.findMany({
        where: todayFilter,
        orderBy: { createdAt: "desc" },
      }),
      // Stok Aksesoris
      prisma.aksesoris.findMany({
        where: {
          stok: { lte: 3 },
          nama: { contains: searchAccStok, mode: "insensitive" },
        },
      }),
      // Stok Sparepart
      prisma.sparePart.findMany({
        where: {
          stok: { lte: 2 },
          nama: { contains: searchSparepartStok, mode: "insensitive" },
        },
      }),
      // Stok VD
      prisma.voucher.findMany({
        where: {
          stok: { lte: 20 },
          nama: { contains: searchVdStok, mode: "insensitive" },
        },
      }),
    ]);

    // === TOTAL COUNT untuk pagination ===

    const voucherHarian = await getJualanVoucherHarian();

    return {
      // === AGREGAT ===
      totalKeuntunganHariIni: totalKeuntunganHariIni._sum.nominal || 0,
      trxHariIniTotal,
      keuntunganVoucherHarian: voucherHarian.statistik.totalKeuntungan || 0,
      omsetVoucherHarian: voucherHarian.statistik.totalOmset || 0,
      totalTransaksiVoucherHarian: voucherHarian.statistik.totalTransaksi || 0,
      omsetGrosirVoucherHariIni: omsetGrosirVoucherHariIni._sum.totalHarga || 0,
      keuntunganGrosirVoucherHariIni:
        keuntunganGrosirVoucherHariIni._sum.keuntungan || 0,
      trxVoucherDownlineHariIniTotal,
      trxVoucherPendingHariIni,

      omsetAccHariIni: omsetAccHariIni._sum.totalHarga || 0,
      keuntunganAccHariIni: keuntunganAccHariIni._sum.keuntungan || 0,
      trxAccHariIniTotal,

      omsetSparepartHariIni: omsetSparepartHariIni._sum.totalHarga || 0,
      keuntunganSparepartHariIni:
        keuntunganSparepartHariIni._sum.keuntungan || 0,
      trxSparepartHariIniTotal,

      omsetServicetHariIni:
        omsetServicetHariIni._sum.hargaSparePart +
          omsetServicetHariIni._sum.biayaJasa || 0,
      keuntunganServiceHariIni: keuntunganServiceHariIni._sum.keuntungan || 0,
      trxServiceHariIniTotal,
      uangModal: uangModal._sum.jumlah || 0,

      trxVoucherDownlineHariIni,
      trxAccHariIni,
      trxServiceHariIni,
      uangModalHariIni,
      trxSparepartHariIni,
      stokAcc,
      stokSparepart,
      stokVd,
    };
  } catch (error) {
    console.error("Dashboard query error:", error);
    throw new Error("Gagal memuat data dashboard");
  }
};
