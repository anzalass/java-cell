import { PrismaClient } from "@prisma/client";
import { createLog } from "./logService.js";
const prisma = new PrismaClient();

export const createJualan = async (data, user) => {
  try {
    await prisma.$transaction(async (tx) => {
      // 1️⃣ Ambil voucher
      const voucher = await tx.voucher.findUnique({
        where: { id: data?.idVoucher },
      });

      if (!voucher) {
        throw new Error("Voucher tidak ditemukan");
      }

      if (voucher.stok <= 0) {
        throw new Error("Stok habis");
      }

      const keuntungan = voucher.hargaEceran - voucher.hargaPokok;

      // 2️⃣ Buat transaksi
      await tx.transaksiVoucherHarian.create({
        data: {
          idVoucher: voucher.id,
          keuntungan,
          idMember: data?.idMember || null,
          idToko: user.toko_id,
        },
      });

      // 3️⃣ Kurangi stok
      await tx.voucher.update({
        where: { id: voucher.id },
        data: {
          stok: {
            decrement: 1,
          },
        },
      });

      // 5️⃣ Create log
      await createLog({
        kategori: "Jualan Voucher Harian",
        keterangan: `${user.nama} telah menambah Jualan Voucher harian`,
        nominal: keuntungan, // <- pastikan ini benar
        nama: user.nama,
        idToko: user.toko_id,
      });
    });
  } catch (error) {
    console.error("Error createJualan:", error);
    throw error;
  }
};
export const deleteTransaksiVoucher = async (idTransaksi, user) => {
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

    const now = new Date();
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    await prisma.$transaction([
      prisma.transaksiVoucherHarian.update({
        where: { id: idTransaksi },
        data: {
          deletedAt: wib,
        },
      }),
      // Kembalikan stok (+1)
      prisma.voucher.update({
        where: { id: voucher.id },
        data: { stok: { increment: 1 } }, // ✅ Kembalikan stok!
      }),
    ]);

    await createLog({
      kategori: "Jualan Voucher Harian",
      keterangan: `${user.nama} telah mmenghapus Trx harian`,
      nominal: voucher.hargaJual,
      nama: user.nama,
      idToko: user.toko_id,
    });

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

export const getJualanVoucherHarian = async (
  user,
  { deletedFilter = "active" } = {}
) => {
  try {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const where = {
      idToko: user.toko_id,
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
      deletedAt: null,
    };

    // 🔥 Flexible deletedAt
    if (deletedFilter === "active") {
      where.deletedAt = null;
    } else if (deletedFilter === "deleted") {
      where.deletedAt = { not: null };
    }
    // "all" → tidak difilter

    const transaksiHarian = await prisma.transaksiVoucherHarian.findMany({
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
      orderBy: {
        createdAt: "desc",
      },
    });

    let totalOmset = 0;
    let totalKeuntungan = 0;

    transaksiHarian.forEach((trx) => {
      totalOmset += trx.Voucher.hargaEceran;
      totalKeuntungan += trx.keuntungan;
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
        deletedAt: trx.deletedAt, // optional biar frontend tau status
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
  periode = "semua",
  startDate,
  endDate,
  search,
  brand,
  deletedFilter = "active", // 🔥 tambahan
  idToko,
}) => {
  try {
    const take = Math.max(1, Math.min(Number(pageSize), 100));
    const skip = (Math.max(1, Number(page)) - 1) * take;

    const { start: dateStart, end: dateEnd } = getDateRange(
      periode,
      startDate,
      endDate
    );

    // 🔥 Build where dasar
    const where = {
      createdAt: {
        gte: dateStart,
        lte: dateEnd,
      },
      idToko,
    };

    // 🔥 Flexible deletedAt
    if (deletedFilter === "active") {
      where.deletedAt = null;
    } else if (deletedFilter === "deleted") {
      where.deletedAt = { not: null };
    }

    // 🔥 Fix: gabung filter Voucher dengan benar
    if (search || brand) {
      where.Voucher = {};
      if (search) {
        where.Voucher.nama = {
          contains: search,
          mode: "insensitive",
        };
      }
      if (brand) {
        where.Voucher.brand = {
          contains: brand,
          mode: "insensitive",
        };
      }
    }

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
        deletedAt: trx.deletedAt, // optional biar frontend tahu status
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
  idToko,
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
        idToko,
        deletedAt: null,
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
    // const pagedGrouped = grouped.slice(skip, skip + take);
    const pagedGrouped = grouped;

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
