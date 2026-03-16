// src/services/keuntunganService.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import cron from "node-cron";

export const getTodayWIBRange = () => {
  const offset = 7 * 60 * 60 * 1000;

  const now = new Date();
  const nowWIB = new Date(now.getTime() + offset);

  const start = new Date(nowWIB);
  start.setHours(0, 0, 0, 0);

  const end = new Date(nowWIB);
  end.setHours(23, 59, 59, 999);

  return {
    start: new Date(start.getTime() - offset),
    end: new Date(end.getTime() - offset),
    tanggalWIB: start,
  };
};

export const toWIB = (date) => {
  if (!date) return null;
  const offset = 7 * 60 * 60 * 1000;
  return new Date(new Date(date).getTime() + offset);
};

export const generateDailyKeuntungan = async (idToko) => {
  try {
    const { start, end, tanggalWIB } = getTodayWIBRange();

    const [trx, vd, acc, sparepart, service, grosir] = await Promise.all([
      prisma.jualanHarian.aggregate({
        where: {
          idToko,
          createdAt: { gte: start, lte: end },
          deletedAt: null,
        },
        _sum: { keuntungan: true },
      }),

      prisma.transaksiVoucherHarian.aggregate({
        where: {
          idToko,
          createdAt: { gte: start, lte: end },
          deletedAt: null,
        },
        _sum: { keuntungan: true },
      }),

      prisma.transaksiAksesoris.aggregate({
        where: {
          idToko,
          createdAt: { gte: start, lte: end },
          deletedAt: null,
        },
        _sum: { keuntungan: true },
      }),

      prisma.transaksiSparepat.aggregate({
        where: {
          idToko,
          createdAt: { gte: start, lte: end },
          deletedAt: null,
        },
        _sum: { keuntungan: true },
      }),

      prisma.serviceHP.aggregate({
        where: {
          idToko,
          createdAt: { gte: start, lte: end },
          deletedAt: null,
        },
        _sum: { keuntungan: true },
      }),

      prisma.transaksiVoucherDownline.aggregate({
        where: {
          idToko,
          createdAt: { gte: start, lte: end },
          deletedAt: null,
        },
        _sum: { keuntungan: true },
      }),
    ]);

    const data = {
      keuntunganTransaksi: trx._sum.keuntungan || 0,
      keuntunganVoucherHarian: vd._sum.keuntungan || 0,
      keuntunganAcc: acc._sum.keuntungan || 0,
      keuntunganSparepart: sparepart._sum.keuntungan || 0,
      keuntunganService: service._sum.keuntungan || 0,
      keuntunganGrosirVoucher: grosir._sum.keuntungan || 0,
    };

    const result = await prisma.keuntungan.upsert({
      where: {
        idToko_tanggal: {
          idToko,
          tanggal: tanggalWIB,
        },
      },
      update: data,
      create: {
        idToko,
        tanggal: tanggalWIB,
        ...data,
      },
    });

    console.log("✅ Keuntungan harian tersimpan:", result.id);

    return result;
  } catch (error) {
    console.error("❌ Gagal generate keuntungan:", error);
    throw error;
  }
};
export const startDailyKeuntunganCron = () => {
  cron.schedule(
    "0 3 * * *", // 03:00 setiap hari
    async () => {
      try {
        const tokos = await prisma.toko.findMany({
          select: { id: true },
        });

        for (const toko of tokos) {
          await generateDailyKeuntungan(toko.id);
        }

        console.log(
          `✅ Keuntungan harian untuk ${tokos.length} toko berhasil di-generate`
        );
      } catch (error) {
        console.error("❌ Gagal jalankan cron keuntungan:", error);
      }
    },
    {
      timezone: "Asia/Jakarta",
    }
  );

  console.log("⏰ Cron job keuntungan harian aktif (03:00 WIB)");
};

/**
 * Ambil data keuntungan berdasarkan periode
 * @param {string} idToko - ID toko
 * @param {string} periode - 'harian', 'mingguan', 'bulanan'
 * @returns {Promise<Array>} Data keuntungan
 */
export const getKeuntunganChartData = async (idToko, periode = "harian") => {
  const now = new Date();

  // Tentukan rentang waktu berdasarkan periode
  let startDate, endDate;
  let groupBy;

  switch (periode) {
    case "harian":
      // 7 hari terakhir
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6); // 7 hari termasuk hari ini
      endDate = new Date(now);
      groupBy = "day";
      break;

    case "mingguan":
      // 4 minggu terakhir
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 27); // 28 hari = 4 minggu
      endDate = new Date(now);
      groupBy = "week";
      break;

    case "bulanan":
      // 6 bulan terakhir
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 5); // 6 bulan termasuk bulan ini
      endDate = new Date(now);
      groupBy = "month";
      break;

    default:
      throw new Error(
        "Periode tidak valid. Gunakan: harian, mingguan, atau bulanan"
      );
  }

  // Pastikan tanggal awal jam 00:00:00 dan akhir jam 23:59:59
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  // Ambil semua transaksi dalam rentang waktu
  const [
    transaksiHarian,
    voucherHarian,
    aksesoris,
    sparepart,
    service,
    grosir,
  ] = await Promise.all([
    prisma.jualanHarian.findMany({
      where: { idToko, tanggal: { gte: startDate, lte: endDate } },
      select: { createdAt: true, nominal: true },
    }),
    prisma.transaksiVoucherHarian.findMany({
      where: { idToko, createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true, keuntungan: true },
    }),
    prisma.transaksiAksesoris.findMany({
      where: { idToko, createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true, keuntungan: true },
    }),
    prisma.transaksiSparepat.findMany({
      where: { idToko, createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true, keuntungan: true },
    }),
    prisma.serviceHP.findMany({
      where: { idToko, createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true, keuntungan: true },
    }),
    prisma.transaksiVoucherDownline.findMany({
      where: { idToko, createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true, keuntungan: true },
    }),
  ]);

  // Gabungkan semua transaksi
  const allTransactions = [
    ...transaksiHarian.map((t) => ({ ...t, type: "trx" })),
    ...voucherHarian.map((t) => ({ ...t, type: "vd" })),
    ...aksesoris.map((t) => ({ ...t, type: "acc" })),
    ...sparepart.map((t) => ({ ...t, type: "sparepart" })),
    ...service.map((t) => ({ ...t, type: "service" })),
    ...grosir.map((t) => ({ ...t, type: "grosir" })),
  ];

  // Buat array tanggal berdasarkan periode
  const dateLabels = generateDateLabels(periode, startDate, endDate);

  // Hitung keuntungan per kategori per periode
  const chartData = dateLabels.map((label) => {
    const periodStart = label.startDate;
    const periodEnd = label.endDate;

    const trx = allTransactions
      .filter(
        (t) =>
          t.type === "trx" && t.tanggal >= periodStart && t.tanggal <= periodEnd
      )
      .reduce((sum, t) => sum + (t.keuntungan || 0), 0);

    const vd = allTransactions
      .filter(
        (t) =>
          t.type === "vd" && t.tanggal >= periodStart && t.tanggal <= periodEnd
      )
      .reduce((sum, t) => sum + (t.keuntungan || 0), 0);

    const acc = allTransactions
      .filter(
        (t) =>
          t.type === "acc" && t.tanggal >= periodStart && t.tanggal <= periodEnd
      )
      .reduce((sum, t) => sum + (t.keuntungan || 0), 0);

    const sparepart = allTransactions
      .filter(
        (t) =>
          t.type === "sparepart" &&
          t.tanggal >= periodStart &&
          t.tanggal <= periodEnd
      )
      .reduce((sum, t) => sum + (t.keuntungan || 0), 0);

    const service = allTransactions
      .filter(
        (t) =>
          t.type === "service" &&
          t.tanggal >= periodStart &&
          t.tanggal <= periodEnd
      )
      .reduce((sum, t) => sum + (t.keuntungan || 0), 0);

    const grosir = allTransactions
      .filter(
        (t) =>
          t.type === "grosir" &&
          t.tanggal >= periodStart &&
          t.tanggal <= periodEnd
      )
      .reduce((sum, t) => sum + (t.keuntungan || 0), 0);

    return {
      tanggal: label.label,
      keuntunganTrx: trx,
      keuntunganVd: vd,
      keuntunganAcc: acc,
      keuntunganSparepart: sparepart,
      keuntunganService: service,
      keuntunganGrosirVd: grosir,
    };
  });

  return chartData;
};

/**
 * Generate label tanggal berdasarkan periode
 */
function generateDateLabels(periode, startDate, endDate) {
  const labels = [];
  const currentDate = new Date(startDate);

  if (periode === "harian") {
    // 7 hari terakhir
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() + i);

      if (date > endDate) break;

      labels.push({
        label: date.toLocaleDateString("id-ID", { weekday: "short" }),
        startDate: new Date(date.setHours(0, 0, 0, 0)),
        endDate: new Date(date.setHours(23, 59, 59, 999)),
      });
    }
  } else if (periode === "mingguan") {
    // 4 minggu terakhir
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() + i * 7);

      if (weekStart > endDate) break;

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      labels.push({
        label: `Minggu ${i + 1}`,
        startDate: new Date(weekStart.setHours(0, 0, 0, 0)),
        endDate: new Date(weekEnd.setHours(23, 59, 59, 999)),
      });
    }
  } else if (periode === "bulanan") {
    // 6 bulan terakhir
    const startMonth = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      1
    );
    const endMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);

    let current = new Date(startMonth);
    let count = 0;

    while (current <= endMonth && count < 6) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const monthEnd = new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        0
      );

      labels.push({
        label: monthStart.toLocaleDateString("id-ID", {
          month: "short",
          year: "numeric",
        }),
        startDate: new Date(monthStart.setHours(0, 0, 0, 0)),
        endDate: new Date(monthEnd.setHours(23, 59, 59, 999)),
      });

      current.setMonth(current.getMonth() + 1);
      count++;
    }
  }

  return labels;
}

/**
 * Ambil data keuntungan dari tabel Keuntungan berdasarkan periode
 * @param {string} idToko - ID toko
 * @param {string} periode - 'harian', 'mingguan', 'bulanan'
 * @returns {Promise<Array>} Data siap grafik
 */
export const getKeuntunganChartDataFromTable = async (
  idToko,
  periode = "harian"
) => {
  try {
    const now = new Date();
    let startDate;

    switch (periode) {
      case "harian":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        break;

      case "mingguan":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 27);
        break;

      case "bulanan":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 5);
        break;

      default:
        throw new Error("Periode tidak valid");
    }

    startDate.setHours(0, 0, 0, 0);

    const records = await prisma.keuntungan.findMany({
      where: {
        idToko,
        tanggal: {
          gte: startDate,
          lte: now,
        },
      },
    });

    const labels = generateDateLabels(periode, startDate, now);

    const chartData = labels.map((bucket) => {
      const result = {
        tanggal: bucket.label,
        keuntunganTrx: 0,
        keuntunganVd: 0,
        keuntunganAcc: 0,
        keuntunganSparepart: 0,
        keuntunganService: 0,
        keuntunganGrosirVd: 0,
      };

      for (const r of records) {
        const date = r.tanggal;

        if (date >= bucket.startDate && date <= bucket.endDate) {
          result.keuntunganTrx += Number(r.keuntunganTransaksi || 0);
          result.keuntunganVd += Number(r.keuntunganVoucherHarian || 0);
          result.keuntunganAcc += Number(r.keuntunganAcc || 0);
          result.keuntunganSparepart += Number(r.keuntunganSparepart || 0);
          result.keuntunganService += Number(r.keuntunganService || 0);
          result.keuntunganGrosirVd += Number(r.keuntunganGrosirVoucher || 0);
        }
      }

      return result;
    });

    return chartData;
  } catch (error) {
    console.error("Error getKeuntunganChartData:", error);
    throw error;
  }
};
/**
 * Format tanggal untuk label grafik
 */
function formatTanggal(date, periode) {
  if (periode === "harian") {
    return date.toLocaleDateString("id-ID", { weekday: "short" }); // Sen, Sel, Rab...
  }
  if (periode === "mingguan") {
    // Minggu ke-n dari awal rentang
    const weekNum = Math.ceil((date.getDate() - 1) / 7) + 1;
    return `Minggu ${weekNum}`;
  }
  if (periode === "bulanan") {
    return date.toLocaleDateString("id-ID", {
      month: "short",
      year: "numeric",
    }); // Apr 2025
  }
  return date.toISOString().split("T")[0];
}

const convertBigInt = (obj) => {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? Number(value) : value
    )
  );
};

export const getKeuntunganService = async ({
  idToko,
  filter,
  startDate,
  endDate,
}) => {
  const now = new Date();
  let start;
  let end;

  switch (filter) {
    case "hari":
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date(now.setHours(23, 59, 59, 999));
      break;

    case "minggu":
      const firstDayWeek = new Date(now);
      firstDayWeek.setDate(now.getDate() - now.getDay());

      const lastDayWeek = new Date(firstDayWeek);
      lastDayWeek.setDate(firstDayWeek.getDate() + 6);

      start = firstDayWeek;
      end = lastDayWeek;
      break;

    case "bulan":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;

    case "tahun":
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      break;

    case "custom":
      start = new Date(startDate);
      end = new Date(endDate);
      break;
  }

  const where = {
    idToko,
    ...(start &&
      end && {
        createdAt: {
          gte: start,
          lte: end,
        },
      }),
  };

  const data = await prisma.keuntungan.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const dataWithTotal = data.map((item) => {
    const totalKeuntungan =
      Number(item.keuntunganTransaksi) +
      Number(item.keuntunganVoucherHarian) +
      Number(item.keuntunganAcc) +
      Number(item.keuntunganSparepart) +
      Number(item.keuntunganService) +
      Number(item.keuntunganGrosirVoucher);

    return {
      ...item,
      totalKeuntungan,
    };
  });

  const total = await prisma.keuntungan.aggregate({
    where,
    _sum: {
      keuntunganTransaksi: true,
      keuntunganVoucherHarian: true,
      keuntunganAcc: true,
      keuntunganSparepart: true,
      keuntunganService: true,
      keuntunganGrosirVoucher: true,
    },
  });

  const totalKeseluruhan =
    Number(total._sum.keuntunganTransaksi || 0) +
    Number(total._sum.keuntunganVoucherHarian || 0) +
    Number(total._sum.keuntunganAcc || 0) +
    Number(total._sum.keuntunganSparepart || 0) +
    Number(total._sum.keuntunganService || 0) +
    Number(total._sum.keuntunganGrosirVoucher || 0);

  return convertBigInt({
    data: dataWithTotal,
    total: {
      ...total._sum,
      totalKeuntungan: totalKeseluruhan,
    },
  });
};
