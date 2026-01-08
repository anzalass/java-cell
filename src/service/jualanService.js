// src/services/transaksiHarian.service.js
import { PrismaClient } from "@prisma/client";

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
export const getJualanHarianToday = async () => {
  const { start, end } = getTodayRange();
  return await prisma.jualanHarian.findMany({
    where: {
      tanggal: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { tanggal: "desc" },
  });
};

// ✅ GET ALL Kejadian Tak Terduga hari ini
export const getKejadianTakTerdugaToday = async () => {
  const { start, end } = getTodayRange();
  return await prisma.kejadianTakTerduga.findMany({
    where: {
      tanggal: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { tanggal: "desc" },
  });
};

// ✅ CREATE Jualan Harian (DateTime)
export const createJualanHarian = async ({
  kategori,
  nominal,
  penempatan,
  idUser,
  idMember,
}) => {
  if (!kategori || !nominal) {
    throw new Error("Kategori dan nominal wajib diisi");
  }

  let member = null;

  if (idMember) {
    member = await prisma.member.findUnique({
      where: {
        id: idMember,
      },
    });
  }

  await prisma.jualanHarian.create({
    data: {
      kategori,
      idMember,
      idUser,
      penempatan,
      nominal: nominal, // tetap string sesuai model
      tanggal: new Date(), // ✅ sekarang DateTime
    },
  });

  if (member !== null) {
    await prisma.member.update({
      where: { id: idMember },
      data: {
        totalTransaksi: {
          increment: nominal,
        },
      },
    });
  }
};

// ✅ CREATE Kejadian Tak Terduga
export const createKejadianTakTerduga = async ({
  keterangan,
  nominal,
  no_transaksi,
  penempatan,
  idUser,
}) => {
  if (!keterangan || nominal == null || no_transaksi == null) {
    throw new Error("Semua field wajib diisi");
  }

  return await prisma.kejadianTakTerduga.create({
    data: {
      keterangan,
      penempatan,
      idUser,
      nominal: Number(nominal),
      no_transaksi: Number(no_transaksi),
      tanggal: new Date(), // ✅ DateTime
    },
  });
};

// ✅ DELETE (sama seperti sebelumnya)
export const deleteJualanHarian = async (id) => {
  await prisma.jualanHarian.delete({ where: { id } });
  return { success: true };
};

// ✅ GET ALL dengan filter & pagination
export const getLaporanKeuangan = async ({
  page = 1,
  pageSize = 10,
  page2 = 1,
  pageSize2 = 10,
  filterPeriod = "all",
  startDate,
  endDate,
  filterJenis = "all",
  filterKategori = "all",
}) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  const skip2 = (Number(page2) - 1) * Number(pageSize2);
  const take2 = Number(pageSize2);

  // Tentukan rentang tanggal
  let dateFilter = {};
  const now = new Date();

  if (filterPeriod === "today") {
    const { start, end } = getTodayRange();
    dateFilter = { gte: start, lte: end };
  } else if (filterPeriod === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    start.setHours(0, 0, 0, 0);
    dateFilter = { gte: start, lte: now };
  } else if (filterPeriod === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    dateFilter = { gte: start, lte: now };
  } else if (filterPeriod === "custom" && startDate && endDate) {
    dateFilter = {
      gte: new Date(`${startDate}T00:00:00Z`),
      lte: new Date(`${endDate}T00:00:00Z`),
    };
  }

  // Query keuntungan
  const whereKeuntungan = {
    ...(dateFilter.gte && { tanggal: dateFilter }),
    ...(filterKategori !== "all" && { kategori: filterKategori }),
  };

  // Query kejadian tak terduga
  const whereUnexpected = dateFilter.gte ? { tanggal: dateFilter } : {};

  // Ambil data
  const [keuntungan, totalKeuntungan, unexpected, totalUnexpected] =
    await Promise.all([
      prisma.jualanHarian.findMany({
        where: filterJenis === "unexpected" ? { id: "none" } : whereKeuntungan,
        skip: filterJenis === "unexpected" ? 0 : skip,
        take: filterJenis === "unexpected" ? 0 : take,
        orderBy: { tanggal: "desc" },
      }),
      prisma.jualanHarian.count({ where: whereKeuntungan }),
      prisma.kejadianTakTerduga.findMany({
        where: filterJenis === "keuntungan" ? { id: "none" } : whereUnexpected,
        skip: filterJenis === "keuntungan" ? 0 : skip2,
        take: filterJenis === "keuntungan" ? 0 : take2,
        orderBy: { tanggal: "desc" },
      }),
      prisma.kejadianTakTerduga.count({ where: whereUnexpected }),
    ]);

  // Hitung total
  const totalKeuntunganValue = keuntungan.reduce(
    (sum, item) => sum + Number(item.nominal),
    0
  );
  const totalKerugianValue = unexpected.reduce(
    (sum, item) => sum + Math.abs(item.nominal),
    0
  );

  return {
    keuntungan,
    unexpected,
    totalKeuntungan: totalKeuntunganValue,
    totalKerugian: totalKerugianValue,
    saldoBersih: totalKeuntunganValue - totalKerugianValue,
    meta: {
      page: Number(page),
      pageSize: take,
      page2: Number(page2),
      pageSize2: take2,
      totalKeuntunganItems: totalKeuntungan,
      totalUnexpectedItems: totalUnexpected,
      totalItems:
        filterJenis === "all"
          ? totalKeuntungan + totalUnexpected
          : filterJenis === "keuntungan"
          ? totalKeuntungan
          : totalUnexpected,
    },
  };
};

// ✅ DELETE Kejadian Tak Terduga
export const deleteKejadianTakTerduga = async (id) => {
  await prisma.kejadianTakTerduga.delete({ where: { id } });
  return { success: true };
};
