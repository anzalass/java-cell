import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createJualan = async (idVoucher) => {
  try {
    // Validasi stok
    const voucher = await prisma.voucher.findUnique({
      where: { id: idVoucher },
    });

    if (!voucher) {
      throw new Error("Voucher tidak ditemukan");
    }

    if (voucher.stok <= 0) {
      throw new Error("Stok habis");
    }

    const keuntungan = voucher.hargaEceran - voucher.hargaPokok;

    await prisma.transaksiVoucherHarian.create({
      data: {
        idVoucher: voucher.id,
        keuntungan: keuntungan,
      },
    });

    await prisma.voucher.update({
      where: { id: idVoucher },
      data: { stok: { decrement: 1 } }, // ✅ decrement, bukan increment!
    });
  } catch (error) {
    console.error("Error createJualan:", error);
    throw error; // ✅ lempar error agar bisa ditangkap di frontend
  }
};

export const deleteTransaksiVoucher = async (idTransaksi) => {
  try {
    const transaksi = await prisma.transaksiVoucherHarian.findUnique({
      where: { id: idTransaksi },
      include: { Voucher: true }, // Ambil data voucher terkait
    });

    if (!transaksi) {
      throw new Error("Transaksi tidak ditemukan");
    }

    const voucher = transaksi.Voucher;
    if (!voucher) {
      throw new Error("Voucher terkait tidak ditemukan");
    }

    await prisma.$transaction([
      prisma.transaksiVoucherHarian.delete({
        where: { id: idTransaksi },
      }),
      // Kembalikan stok (+1)
      prisma.voucher.update({
        where: { id: voucher.id },
        data: { stok: { increment: 1 } }, // ✅ Kembalikan stok!
      }),
    ]);

    return {
      success: true,
      message: "Transaksi berhasil dihapus dan stok dikembalikan",
      restoredStok: voucher.stok + 1,
    };
  } catch (error) {
    console.error("Error deleteTransaksiVoucher:", error);
    throw new Error(error.message || "Gagal menghapus transaksi");
  }
};

export const getJualanVoucherHarian = async () => {
  try {
    // Dapatkan tanggal hari ini (tanpa jam)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    // Ambil semua transaksi hari ini + data voucher
    const transaksiHarian = await prisma.transaksiVoucherHarian.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        Voucher: {
          select: {
            id: true,
            nama: true,
            brand: true,
            hargaEceran: true,
            hargaPokok: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Hitung statistik
    let totalOmset = 0;
    let totalKeuntungan = 0;

    transaksiHarian.forEach((trx) => {
      totalOmset += trx.Voucher.hargaEceran;
      totalKeuntungan += trx.keuntungan; // asumsi field keuntungan sudah dihitung saat create
    });

    return {
      transaksi: transaksiHarian.map((trx) => ({
        id: trx.id,
        tanggal: trx.createdAt,
        voucher: {
          id: trx.Voucher.id,
          nama: trx.Voucher.nama,
          brand: trx.Voucher.brand,
        },
        hargaJual: trx.Voucher.hargaEceran,
        keuntungan: trx.keuntungan,
      })),
      statistik: {
        totalTransaksi: transaksiHarian.length,
        totalOmset,
        totalKeuntungan,
      },
    };
  } catch (error) {
    console.error("Error getJualanVoucherHarian:", error);
    throw new Error("Gagal mengambil data transaksi hari ini");
  }
};

// Helper: dapatkan rentang tanggal berdasarkan periode

export const getAllTransaksiVoucher = async ({
  page = 1,
  pageSize = 10,
  periode = "semua", // "harian", "mingguan", "bulanan", "custom", "semua"
  startDate,
  endDate,
  search, // untuk nama voucher
  brand,
}) => {
  try {
    // Validasi pagination
    const take = Math.max(1, Math.min(Number(pageSize), 100)); // max 100 per halaman
    const skip = (Math.max(1, Number(page)) - 1) * take;

    // Dapatkan rentang tanggal
    const { start: dateStart, end: dateEnd } = getDateRange(
      periode,
      startDate,
      endDate
    );

    // Bangun kondisi where untuk transaksi
    const where = {
      createdAt: {
        gte: dateStart,
        lte: dateEnd,
      },
      ...(search && {
        Voucher: {
          nama: { contains: search, mode: "insensitive" },
        },
      }),
      ...(brand && {
        Voucher: {
          brand: { contains: brand, mode: "insensitive" },
        },
      }),
    };

    // Ambil data transaksi
    const [transaksi, total] = await Promise.all([
      prisma.transaksiVoucherHarian.findMany({
        where,
        include: {
          Voucher: {
            select: {
              id: true,
              nama: true,
              brand: true,
              hargaEceran: true,
              hargaPokok: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.transaksiVoucherHarian.count({ where }),
    ]);

    return {
      data: transaksi.map((trx) => ({
        id: trx.id,
        tanggal: trx.createdAt,
        voucher: {
          id: trx.Voucher.id,
          nama: trx.Voucher.nama,
          brand: trx.Voucher.brand,
        },
        hargaJual: trx.Voucher.hargaEceran,
        keuntungan: trx.keuntungan,
      })),
      meta: {
        page: Number(page),
        pageSize: take,
        totalItems: total,
        totalPages: Math.ceil(total / take),
      },
    };
  } catch (error) {
    console.error("Error getAllTransaksiVoucher:", error);
    throw new Error("Gagal mengambil data transaksi");
  }
};

// Helper: dapatkan rentang tanggal berdasarkan periode
const getDateRange = (periode, startDate = null, endDate = null) => {
  const now = new Date();

  if (periode === "custom" && startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  let start, end;
  switch (periode) {
    case "hari":
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      break;
    case "minggu":
      start = new Date(now);
      start.setDate(
        now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)
      );
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      break;
    case "bulan":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    default: // "semua"
      start = new Date("1970-01-01");
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
  }
  return { start, end };
};
export const getLaporanVoucherTerlaris = async ({
  periode = "semua",
  startDate,
  endDate,
  search,
  brand,
  page = 1,
  pageSize = 10,
}) => {
  try {
    const { start: dateStart, end: dateEnd } = getDateRange(
      periode,
      startDate,
      endDate
    );

    const take = Number(pageSize);
    const skip = (Number(page) - 1) * take;

    /* ===============================
       1️⃣ GROUP BY TRANSAKSI
    =============================== */
    const grouped = await prisma.transaksiVoucherHarian.groupBy({
      by: ["idVoucher"],
      where: {
        createdAt: {
          gte: dateStart,
          lte: dateEnd,
        },
      },
      _count: { id: true },
      _sum: { keuntungan: true },
      orderBy: {
        _count: { id: "desc" },
      },
    });

    const totalItems = grouped.length;

    if (totalItems === 0) {
      return {
        data: [],
        statistik: {
          totalTerjual: 0,
          totalPendapatan: 0,
          totalKeuntungan: 0,
        },
        meta: {
          page,
          pageSize: take,
          totalItems: 0,
          totalPages: 0,
        },
      };
    }

    /* ===============================
       2️⃣ PAGINATION (SETELAH SORT)
    =============================== */
    const pagedGrouped = grouped.slice(skip, skip + take);

    /* ===============================
       3️⃣ FILTER VOUCHER
    =============================== */
    const voucherWhere = {
      id: {
        in: pagedGrouped.map((g) => g.idVoucher),
      },
      ...(search && {
        nama: { contains: search, mode: "insensitive" },
      }),
      ...(brand && {
        brand: { contains: brand, mode: "insensitive" },
      }),
    };

    const vouchers = await prisma.voucher.findMany({
      where: voucherWhere,
      select: {
        id: true,
        nama: true,
        brand: true,
        hargaJual: true,
        hargaPokok: true,
        hargaEceran: true,
      },
    });

    const voucherMap = Object.fromEntries(vouchers.map((v) => [v.id, v]));

    /* ===============================
       4️⃣ GABUNGKAN HASIL
    =============================== */
    const data = pagedGrouped
      .filter((g) => voucherMap[g.idVoucher])
      .map((g) => {
        const v = voucherMap[g.idVoucher];
        const jumlahTerjual = g._count.id;
        const totalKeuntungan = g._sum.keuntungan ?? 0;
        const totalPendapatan = jumlahTerjual * (v.hargaEceran ?? 0);
        const modal = jumlahTerjual * (v.hargaPokok ?? 0);

        return {
          voucher: v,
          jumlahTerjual,
          totalKeuntungan,
          totalPendapatan,
          modal,
        };
      });

    /* ===============================
       5️⃣ STATISTIK GLOBAL
    =============================== */
    const statistik = {
      totalTerjual: grouped.reduce((s, i) => s + i._count.id, 0),
      totalPendapatan: grouped.reduce((s, i) => {
        const v = voucherMap[i.idVoucher];
        return s + (v ? i._count.id * (v.hargaEceran ?? 0) : 0);
      }, 0),
      totalKeuntungan: grouped.reduce(
        (s, i) => s + (i._sum.keuntungan ?? 0),
        0
      ),
    };

    return {
      data,
      statistik,
      meta: {
        page: Number(page),
        pageSize: take,
        totalItems,
        totalPages: Math.ceil(totalItems / take),
      },
      filter: {
        periode,
        startDate: dateStart.toISOString().split("T")[0],
        endDate: dateEnd.toISOString().split("T")[0],
        search,
        brand,
      },
    };
  } catch (error) {
    console.error("Error getLaporanVoucherTerlaris:", error);
    throw new Error("Gagal mengambil laporan voucher terlaris");
  }
};
