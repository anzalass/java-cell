// src/services/transaksiHarian.service.js
import { PrismaClient } from "@prisma/client";
import { createLog } from "./logService.js";

const prisma = new PrismaClient();

// Helper: dapatkan rentang waktu hari ini
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

// ✅ GET ALL Jualan Harian hari ini (DateTime)
export const getJualanHarianToday = async (
  user,
  { deletedFilter = "active" } = {}
) => {
  const { start, end } = getTodayRange();

  const where = {
    idToko: user.toko_id,
    tanggal: {
      gte: start,
      lte: end,
    },
  };

  if (deletedFilter === "active") {
    where.deletedAt = null;
  } else if (deletedFilter === "deleted") {
    where.deletedAt = { not: null };
  }
  // "all" → tidak difilter

  return await prisma.jualanHarian.findMany({
    where,
    orderBy: { tanggal: "desc" },
  });
};

// ✅ GET ALL Kejadian Tak Terduga hari ini
export const getKejadianTakTerdugaToday = async (user) => {
  const { start, end } = getTodayRange();
  return await prisma.kejadianTakTerduga.findMany({
    where: {
      tanggal: {
        gte: start,
        lte: end,
      },
      idToko: user.toko_id,
    },
    orderBy: { tanggal: "desc" },
  });
};

// ✅ CREATE Jualan Harian (DateTime)
export const createJualanHarian = async ({
  kategori,
  nominal,
  penempatan,
  idMember,
  user,
  idToko,
}) => {
  if (!kategori || !nominal) {
    throw new Error("Kategori dan nominal wajib diisi");
  }

  await prisma.jualanHarian.create({
    data: {
      kategori,
      ...(idMember && {
        Member: {
          connect: { id: idMember },
        },
      }),
      Toko: {
        connect: {
          id: idToko,
        },
      },
      nominal: nominal, // tetap string sesuai model
      tanggal: new Date(), // ✅ sekarang DateTime
    },
  });

  await createLog({
    kategori: "Trx Harian",
    keterangan: `${user.nama} telah melakukan Trx harian`,
    nominal: nominal,
    nama: user.nama,
    idToko: idToko,
  });
};

// ✅ CREATE Kejadian Tak Terduga
export const createKejadianTakTerduga = async ({
  keterangan,
  nominal,
  no_transaksi,
  penempatan,
  user,
  idToko,
}) => {
  if (!keterangan || nominal == null || no_transaksi == null) {
    throw new Error("Semua field wajib diisi");
  }

  await prisma.kejadianTakTerduga.create({
    data: {
      keterangan,
      penempatan,
      nominal: Number(nominal),
      no_transaksi: Number(no_transaksi),
      tanggal: new Date(),
      idToko,
    },
  });

  await createLog({
    kategori: "Kejadian Tak Terduga",
    keterangan: `${user.nama} telah membuat kejadian tak terduga`,
    nominal: nominal,
    nama: user.nama,
    idToko,
  });
};

// ✅ DELETE (sama seperti sebelumnya)
export const deleteJualanHarian = async (id, user) => {
  const jualan = await prisma.jualanHarian.findUnique({
    where: {
      id,
    },
  });

  if (!jualan) {
    throw new Error("Jualan ga ditemuin");
  }

  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);

  await prisma.jualanHarian.update({
    where: { id },
    data: {
      deletedAt: wib,
    },
  });

  await createLog({
    kategori: "Trx Harian",
    keterangan: `${user.nama} telah mmenghapus Trx harian`,
    nominal: jualan.nominal,
    nama: user.nama,
    idToko: user.toko_id,
  });
};

// ✅ GET ALL dengan filter & pagination
// export const getLaporanKeuangan = async ({
//   page = 1,
//   pageSize = 10,
//   page2 = 1,
//   pageSize2 = 10,
//   filterPeriod = "all",
//   startDate,
//   endDate,
//   filterJenis = "all",
//   filterKategori = "all",
//   idToko,
// }) => {
//   const safeNumber = (val, def) => {
//     const n = Number(val);
//     return Number.isFinite(n) && n > 0 ? n : def;
//   };

//   const pageSafe = safeNumber(page, 1);
//   const pageSizeSafe = safeNumber(pageSize, 10);
//   const page2Safe = safeNumber(page2, 1);
//   const pageSize2Safe = safeNumber(pageSize2, 10);

//   const skip = (pageSafe - 1) * pageSizeSafe;
//   const take = pageSizeSafe;

//   const skip2 = (page2Safe - 1) * pageSize2Safe;
//   const take2 = pageSize2Safe;

//   // Tentukan rentang tanggal
//   let dateFilter = {};
//   const now = new Date();

//   if (filterPeriod === "today") {
//     const { start, end } = getTodayRange();
//     dateFilter = { gte: start, lte: end };
//   } else if (filterPeriod === "week") {
//     const start = new Date(now);
//     start.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
//     start.setHours(0, 0, 0, 0);
//     dateFilter = { gte: start, lte: now };
//   } else if (filterPeriod === "month") {
//     const start = new Date(now.getFullYear(), now.getMonth(), 1);
//     dateFilter = { gte: start, lte: now };
//   } else if (filterPeriod === "custom" && startDate && endDate) {
//     dateFilter = {
//       gte: new Date(`${startDate}T00:00:00Z`),
//       lte: new Date(`${endDate}T00:00:00Z`),
//     };
//   }

//   // Query keuntungan
//   const whereKeuntungan = {
//     ...(dateFilter.gte && { tanggal: dateFilter }),
//     ...(filterKategori !== "all" && { kategori: filterKategori }),
//   };
//   whereKeuntungan.idToko = idToko;

//   // Query kejadian tak terduga
//   const whereUnexpected = dateFilter.gte ? { tanggal: dateFilter } : {};
//   whereUnexpected.idToko = idToko;
//   // Ambil data
//   const [keuntungan, totalKeuntungan, unexpected, totalUnexpected] =
//     await Promise.all([
//       prisma.jualanHarian.findMany({
//         where: filterJenis === "unexpected" ? { id: "none" } : whereKeuntungan,
//         skip: filterJenis === "unexpected" ? 0 : skip,
//         take: filterJenis === "unexpected" ? 0 : take,
//         orderBy: { tanggal: "desc" },
//       }),
//       prisma.jualanHarian.count({ where: whereKeuntungan }),
//       prisma.kejadianTakTerduga.findMany({
//         where: filterJenis === "keuntungan" ? { id: "none" } : whereUnexpected,
//         skip: filterJenis === "keuntungan" ? 0 : skip2,
//         take: filterJenis === "keuntungan" ? 0 : take2,
//         orderBy: { tanggal: "desc" },
//       }),
//       prisma.kejadianTakTerduga.count({ where: whereUnexpected }),
//     ]);

//   // Hitung total
//   const totalKeuntunganValue = keuntungan.reduce(
//     (sum, item) => sum + Number(item.nominal),
//     0
//   );
//   const totalKerugianValue = unexpected.reduce(
//     (sum, item) => sum + Math.abs(item.nominal),
//     0
//   );

//   return {
//     keuntungan,
//     unexpected,
//     totalKeuntungan: totalKeuntunganValue,
//     totalKerugian: totalKerugianValue,
//     saldoBersih: totalKeuntunganValue - totalKerugianValue,
//     meta: {
//       page: Number(page),
//       pageSize: take,
//       page2: Number(page2),
//       pageSize2: take2,
//       totalKeuntunganItems: totalKeuntungan,
//       totalUnexpectedItems: totalUnexpected,
//       totalItems:
//         filterJenis === "all"
//           ? totalKeuntungan + totalUnexpected
//           : filterJenis === "keuntungan"
//           ? totalKeuntungan
//           : totalUnexpected,
//     },
//   };
// };

export const getLaporanKeuangan = async (params) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      page2 = 1,
      pageSize2 = 10,
      filterPeriod = "all",
      startDate,
      endDate,
      filterJenis = "all",
      filterKategori = "all",
      deletedFilter = "active", // 🔥 tambahin ini
      idToko,
    } = params;
    /* =========================
       1️⃣ VALIDATION
    ========================== */

    if (!idToko) {
      throw new Error("idToko wajib diisi");
    }

    const safeNumber = (val, def) => {
      const n = Number(val);
      return Number.isFinite(n) && n > 0 ? n : def;
    };

    const pageSafe = safeNumber(page, 1);
    const pageSizeSafe = safeNumber(pageSize, 10);
    const page2Safe = safeNumber(page2, 1);
    const pageSize2Safe = safeNumber(pageSize2, 10);

    const skip = (pageSafe - 1) * pageSizeSafe;
    const skip2 = (page2Safe - 1) * pageSize2Safe;

    /* =========================
       2️⃣ DATE FILTER BUILDER
    ========================== */

    const now = new Date();
    let dateFilter = undefined;

    if (filterPeriod === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      dateFilter = { gte: start, lte: end };
    }

    if (filterPeriod === "week") {
      const day = now.getDay() || 7;
      const start = new Date(now);
      start.setDate(now.getDate() - day + 1);
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      dateFilter = { gte: start, lte: end };
    }

    if (filterPeriod === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      dateFilter = { gte: start, lte: end };
    }

    if (filterPeriod === "custom") {
      if (!startDate || !endDate) {
        throw new Error("Custom period membutuhkan startDate dan endDate");
      }

      dateFilter = {
        gte: new Date(`${startDate}T00:00:00.000Z`),
        lte: new Date(`${endDate}T23:59:59.999Z`),
      };
    }

    /* =========================
       3️⃣ WHERE BUILDER
    ========================== */

    // base tanpa deletedAt
    const baseWhere = {
      idToko,
      ...(dateFilter && { tanggal: dateFilter }),
    };

    // khusus untuk model yang punya deletedAt
    const baseWhereWithDeleted = { ...baseWhere };

    if (deletedFilter === "active") {
      baseWhereWithDeleted.deletedAt = null;
    } else if (deletedFilter === "deleted") {
      baseWhereWithDeleted.deletedAt = { not: null };
    }

    // keuntungan (jualanHarian punya deletedAt)
    const whereKeuntungan = {
      ...baseWhereWithDeleted,
      ...(filterKategori !== "all" && { kategori: filterKategori }),
    };

    // unexpected (tidak punya deletedAt)
    const whereUnexpected = {
      ...baseWhere,
    };
    /* =========================
       4️⃣ QUERY (ONLY 4 HITS)
    ========================== */

    const [keuntunganData, keuntunganAgg, unexpectedData, unexpectedAgg] =
      await Promise.all([
        // 🔹 Keuntungan list + count
        filterJenis === "unexpected"
          ? Promise.resolve([])
          : prisma.jualanHarian.findMany({
              where: whereKeuntungan,
              skip,
              take: pageSizeSafe,
              orderBy: { tanggal: "desc" },
            }),

        filterJenis === "unexpected"
          ? Promise.resolve({ _sum: { nominal: 0 }, _count: 0 })
          : prisma.jualanHarian.aggregate({
              where: whereKeuntungan,
              _sum: { nominal: true },
              _count: true,
            }),

        // 🔹 Unexpected list + count
        filterJenis === "keuntungan"
          ? Promise.resolve([])
          : prisma.kejadianTakTerduga.findMany({
              where: whereUnexpected,
              skip: skip2,
              take: pageSize2Safe,
              orderBy: { tanggal: "desc" },
            }),

        filterJenis === "keuntungan"
          ? Promise.resolve({ _sum: { nominal: 0 }, _count: 0 })
          : prisma.kejadianTakTerduga.aggregate({
              where: whereUnexpected,
              _sum: { nominal: true },
              _count: true,
            }),
      ]);

    /* =========================
       5️⃣ TOTAL CALCULATION
    ========================== */

    const totalKeuntungan = keuntunganAgg?._sum?.nominal ?? 0;

    const totalKerugian = Math.abs(unexpectedAgg?._sum?.nominal ?? 0);

    const totalKeuntunganItems = keuntunganAgg?._count ?? 0;

    const totalUnexpectedItems = unexpectedAgg?._count ?? 0;

    /* =========================
       6️⃣ RESPONSE
    ========================== */

    return {
      keuntungan: keuntunganData,
      unexpected: unexpectedData,
      totalKeuntungan,
      totalKerugian,
      saldoBersih: totalKeuntungan - totalKerugian,
      meta: {
        page: pageSafe,
        pageSize: pageSizeSafe,
        page2: page2Safe,
        pageSize2: pageSize2Safe,
        totalKeuntunganItems,
        totalUnexpectedItems,
        totalItems:
          filterJenis === "all"
            ? totalKeuntunganItems + totalUnexpectedItems
            : filterJenis === "keuntungan"
            ? totalKeuntunganItems
            : totalUnexpectedItems,
      },
    };
  } catch (error) {
    console.error("[LAPORAN_KEUANGAN_ERROR]", {
      message: error.message,
      stack: error.stack,
    });

    throw new Error("Gagal mengambil laporan keuangan");
  }
};

// ✅ DELETE Kejadian Tak Terduga
export const deleteKejadianTakTerduga = async (id, user) => {
  const data = await prisma.kejadianTakTerduga.findUnique({
    where: {
      id,
    },
  });

  if (!data) {
    throw new Error("Kejadian tak terduga ga ada");
  }
  await prisma.kejadianTakTerduga.delete({ where: { id } });
  await createLog({
    kategori: "Kejadian Tak Terduga",
    keterangan: `${user.nama} telah menghapus Kejadian Tak Terduga : ${data.keterangan}`,
    nominal: data.nominal,
    nama: user.nama,
    idToko: user.toko_id,
  });
};
