// src/services/transaksiAksesoris.service.js
import { PrismaClient } from "@prisma/client";
import { prismaErrorHandler } from "../utils/errorHandlerPrisma.js";
import { createLog } from "./logService.js";

const prisma = new PrismaClient();

// CREATE
export const createTransaksiAksesoris = async (
  { items, nama, keuntungan, status = "selesai", idMember },
  user
) => {
  try {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Item transaksi tidak boleh kosong");
    }

    const generateRandomCode = (length = 8) => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      return Array.from(
        { length },
        () => chars[Math.floor(Math.random() * chars.length)]
      ).join("");
    };

    return await prisma.$transaction(async (tx) => {
      let totalHarga = 0;
      const itemsToCreate = [];

      // ambil semua aksesoris sekaligus (lebih cepat)
      const aksesorisIds = items.map((i) => i.idAksesoris);

      const aksesorisList = await tx.aksesoris.findMany({
        where: {
          id: { in: aksesorisIds },
        },
        select: {
          id: true,
          nama: true,
          stok: true,
          hargaJual: true,
        },
      });

      const aksesorisMap = Object.fromEntries(
        aksesorisList.map((a) => [a.id, a])
      );

      for (const item of items) {
        const { idAksesoris, quantity } = item;

        if (!idAksesoris || !quantity || quantity <= 0) {
          throw new Error("Item tidak valid");
        }

        const aksesoris = aksesorisMap[idAksesoris];

        if (!aksesoris) {
          throw new Error(`Aksesoris tidak ditemukan`);
        }

        if (aksesoris.stok < quantity) {
          throw new Error(`Stok ${aksesoris.nama} tidak mencukupi`);
        }

        totalHarga += aksesoris.hargaJual * quantity;

        itemsToCreate.push({
          idAksesoris,
          quantity,
        });
      }

      let member = null;

      if (idMember) {
        member = await tx.member.findUnique({
          where: { id: idMember },
          select: { id: true, nama: true },
        });
      }

      const transaksi = await tx.transaksiAksesoris.create({
        data: {
          totalHarga,
          keuntungan,
          namaPembeli: member?.nama || nama || generateRandomCode(),
          status,
          tanggal: new Date(),

          Toko: {
            connect: {
              id: user.toko_id,
            },
          },

          ...(member && {
            Member: {
              connect: { id: member.id },
            },
          }),

          items: {
            create: itemsToCreate.map((item) => ({
              quantity: item.quantity,
              tanggal: new Date(),
              Toko: {
                connect: {
                  id: user.toko_id,
                },
              },
              Aksesoris: {
                connect: { id: item.idAksesoris },
              },
            })),
          },
        },
      });
      // update stok
      for (const item of itemsToCreate) {
        await tx.aksesoris.update({
          where: { id: item.idAksesoris },
          data: {
            stok: { decrement: item.quantity },
          },
        });
      }

      await createLog(
        {
          kategori: "Transaksi Aksesoris",
          keterangan: `${user.nama} membuat transaksi aksesoris`,
          nominal: transaksi.keuntungan,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return {
        id: transaksi.id,
        totalHarga,
      };
    });
  } catch (error) {
    console.error("Error createTransaksiSparepart:", error);

    throw new Error(
      error.message || "Terjadi kesalahan saat membuat transaksi sparepart"
    );
  }
};

export const deleteTransaksiAksesoris = async (idTransaksi, user) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const transaksi = await tx.transaksiAksesoris.findUnique({
        where: { id: idTransaksi },
        include: {
          items: true,
        },
      });

      if (!transaksi) {
        throw new Error("Transaksi tidak ditemukan");
      }

      for (const item of transaksi.items) {
        await tx.aksesoris.update({
          where: { id: item.idAksesoris },
          data: {
            stok: { increment: item.quantity },
          },
        });
      }

      const now = new Date();

      await tx.transaksiAksesoris.update({
        where: { id: idTransaksi },
        data: {
          deletedAt: now,
        },
      });

      await tx.itemsTransaksiAksesoris.updateMany({
        where: {
          idTransaksi: idTransaksi,
        },
        data: {
          deletedAt: now,
        },
      });

      await createLog(
        {
          kategori: "Transaksi Aksesoris",
          keterangan: `${user.nama} menghapus transaksi aksesoris`,
          nominal: transaksi.keuntungan,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return { success: true };
    });
  } catch (error) {
    console.error("Error createTransaksiSparepart:", error);
    throw new Error(
      error.message || "Terjadi kesalahan saat membuat transaksi sparepart"
    );
  }
};

// ✅ GET ALL dengan filter & pagination
export const getAllTransaksiAksesoris = async ({
  page = 1,
  pageSize = 10,
  search = "",
  startDate,
  endDate,
  status,
  idToko,
  deletedFilter = "active", // ✅ PARAM BARU
}) => {
  // const skip = (Number(page) - 1) * Number(pageSize);
  // const take = Number(pageSize);

  const where = {
    idToko,
  };

  // ✅ Flexible deletedAt filter
  if (deletedFilter === "active") {
    where.deletedAt = null;
  } else if (deletedFilter === "deleted") {
    where.deletedAt = { not: null };
  }
  // kalau "all" → tidak set deletedAt sama sekali

  // 🔍 Filter pencarian
  if (search) {
    where.namaPembeli = { contains: search, mode: "insensitive" };
  }

  // 📅 Filter tanggal
  if (startDate || endDate) {
    where.tanggal = {};
    if (startDate) where.tanggal.gte = new Date(startDate);
    if (endDate) where.tanggal.lte = new Date(endDate);
  }

  // 📌 Filter status
  if (status) {
    where.status = status;
  }

  const [data, total] = await prisma.$transaction([
    prisma.transaksiAksesoris.findMany({
      where,
      // skip,
      // take,
      orderBy: { tanggal: "desc" },
      include: {
        items: {
          include: {
            Aksesoris: {
              select: {
                nama: true,
                hargaModal: true,
                hargaJual: true,
              },
            },
          },
        },
      },
    }),
    prisma.transaksiAksesoris.count({ where }),
  ]);

  const formatted = data.map((trx) => {
    const totalKeuntungan = trx.items.reduce((sum, item) => {
      const modal = item.Aksesoris.hargaModal || 0;
      const jual = item.Aksesoris.hargaJual || 0;
      return sum + item.quantity * (jual - modal);
    }, 0);

    return {
      id: trx.id,
      namaPembeli: trx.namaPembeli,
      totalHarga: trx.totalHarga,
      keuntungan: trx.keuntungan || totalKeuntungan,
      tanggal: trx.createdAt,
      status: trx.status,
      deletedAt: trx.deletedAt,
      detail: {
        itemTransaksi: trx.items.map((item) => ({
          id: item.id,
          namaProduk: item.Aksesoris.nama,
          qty: item.quantity,
          hargaJual: item.Aksesoris.hargaJual || 0,
          hargaModal: item.Aksesoris.hargaModal || 0,
        })),
      },
    };
  });

  return {
    formatted,
    // meta: {
    //   page: Number(page),
    //   pageSize: take,
    //   total,
    //   totalPages: Math.ceil(total / take),
    // },
  };
};

const getDateRange = (period, startDate, endDate) => {
  const now = new Date();

  if (period === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === "week") {
    const start = new Date(now);
    const day = now.getDay() || 7;
    start.setDate(now.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === "custom" && startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  return { start: new Date("1970-01-01"), end: now };
};

export const getLaporanBarangKeluar = async (
  {
    page = 1,
    pageSize = 10,
    filterPeriod = "all",
    startDate,
    endDate,
    searchNama = "",
    sortQty = "none", // "asc", "desc", "none"
  },
  user
) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  // Tentukan rentang tanggal
  const { start, end } = getDateRange(filterPeriod, startDate, endDate);

  // Ambil SEMUA data yang sesuai filter (tanpa pagination dulu)
  const whereItems = {
    tanggal: {
      gte: start,
      lte: end,
    },
    idToko: user.toko_id,
    ...(searchNama && {
      Aksesoris: {
        nama: { contains: searchNama, mode: "insensitive" },
      },
    }),
    deletedAt: null,
  };

  const allItems = await prisma.itemsTransaksiAksesoris.findMany({
    where: whereItems,
    orderBy: { tanggal: "desc" },
    include: {
      Aksesoris: {
        select: {
          nama: true,
          brand: true,
          hargaModal: true,
          hargaJual: true,
        },
      },
      TransaksiAksesoris: {
        select: { tanggal: true },
      },
    },
  });

  // ✅ GROUP BY nama barang & hitung total qty
  const groupedItems = allItems.reduce((acc, item) => {
    const key = item.Aksesoris.nama; // group by nama

    if (!acc[key]) {
      acc[key] = {
        id: key,
        namaBarang: item.Aksesoris.nama,
        merk: item.Aksesoris.brand,
        hargaModal: item.Aksesoris.hargaModal,
        hargaJual: item.Aksesoris.hargaJual,
        modal: 0,
        keuntungan: 0,
        qty: 0,
        tanggalTerakhir: item.tanggal || item.TransaksiAksesoris?.tanggal,
      };
    }

    acc[key].qty += item.quantity;
    acc[key].modal += item.quantity * item.Aksesoris.hargaModal;
    acc[key].keuntungan +=
      item.quantity * (item.Aksesoris.hargaJual - item.Aksesoris.hargaModal);

    // Update tanggal terakhir jika lebih baru
    const itemDate = item.tanggal || item.TransaksiAksesoris?.tanggal;
    if (itemDate > acc[key].tanggalTerakhir) {
      acc[key].tanggalTerakhir = itemDate;
    }

    return acc;
  }, {});

  // Konversi ke array dan urutkan berdasarkan tanggal terakhir
  let resultArray = Object.values(groupedItems).sort(
    (a, b) => new Date(b.tanggalTerakhir) - new Date(a.tanggalTerakhir)
  );

  resultArray = Object.values(groupedItems);

  // ✅ SORT BERDASARKAN QUANTITY
  if (sortQty === "desc") {
    // Terbanyak dulu
    resultArray.sort((a, b) => b.qty - a.qty);
  } else if (sortQty === "asc") {
    // Terdikit dulu
    resultArray.sort((a, b) => a.qty - b.qty);
  } else {
    // Default: urutkan berdasarkan tanggal terakhir
    resultArray.sort(
      (a, b) => new Date(b.tanggalTerakhir) - new Date(a.tanggalTerakhir)
    );
  }

  // Total items setelah grouping
  const totalCount = resultArray.length;

  // Terapkan pagination
  const paginatedData = resultArray;

  return {
    paginatedData,
    meta: {
      page: Number(page),
      pageSize: take,
      total: totalCount,
      totalPages: Math.ceil(totalCount / take),
    },
  };
};

export const getDetailTransaksiAksesoris = async (id, user) => {
  const transaksi = await prisma.transaksiAksesoris.findUnique({
    where: { id },
    include: {
      Member: true,
      items: {
        include: {
          Aksesoris: true,
        },
      },
    },
  });

  if (!transaksi) {
    throw new Error("Transaksi tidak ditemukan");
  }

  const toko = await prisma.toko.findUnique({
    where: {
      id: user.toko_id,
    },
  });

  return {
    namaToko: toko.namaToko,
    logoToko: toko.logoToko,
    alamat: toko.alamat,
    noTelp: toko.noTelp,
    transaksi,
  };

  return transaksi;
};
