// src/services/transaksiAksesoris.service.js
import { PrismaClient } from "@prisma/client";
import { prismaErrorHandler } from "../utils/errorHandlerPrisma.js";
import { createLog } from "./logService.js";

const prisma = new PrismaClient();

export const createTransaksiSparepart = async (
  { items, nama, keuntungan, idMember },
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

      const sparepartIds = items.map((i) => i.idSparepart);

      const sparepartList = await tx.sparePart.findMany({
        where: {
          id: { in: sparepartIds },
        },
        select: {
          id: true,
          nama: true,
          stok: true,
          hargaJual: true,
        },
      });

      const sparepartMap = Object.fromEntries(
        sparepartList.map((s) => [s.id, s])
      );

      for (const item of items) {
        const { idSparepart, quantity } = item;

        if (!idSparepart || !quantity || quantity <= 0) {
          throw new Error("Item tidak valid");
        }

        const sparepart = sparepartMap[idSparepart];

        if (!sparepart) {
          throw new Error("Sparepart tidak ditemukan");
        }

        if (sparepart.stok < quantity) {
          throw new Error(`Stok ${sparepart.nama} tidak mencukupi`);
        }

        totalHarga += sparepart.hargaJual * quantity;
      }

      let member = null;

      if (idMember) {
        member = await tx.member.findUnique({
          where: { id: idMember },
          select: { id: true, nama: true },
        });
      }

      const transaksi = await tx.transaksiSparepat.create({
        data: {
          totalHarga,
          keuntungan,
          namaPembeli: member?.nama || nama || generateRandomCode(),
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
            create: items.map((item) => ({
              quantity: item.quantity,
              tanggal: new Date(),
              Toko: {
                connect: {
                  id: user.toko_id,
                },
              },
              Sparepart: {
                connect: { id: item.idSparepart },
              },
            })),
          },
        },
      });

      for (const item of items) {
        await tx.sparePart.update({
          where: { id: item.idSparepart },
          data: {
            stok: { decrement: item.quantity },
          },
        });
      }

      await createLog(
        {
          kategori: "Transaksi Sparepart",
          keterangan: `${user.nama} membuat transaksi sparepart`,
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

export const deleteTransaksiSparepart = async (idTransaksi, user) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const transaksi = await tx.transaksiSparepat.findUnique({
        where: { id: idTransaksi },
        include: { items: true },
      });

      if (!transaksi) {
        throw new Error("Transaksi tidak ditemukan");
      }

      for (const item of transaksi.items) {
        await tx.sparePart.update({
          where: { id: item.idSparepart },
          data: {
            stok: { increment: item.quantity },
          },
        });
      }

      const now = new Date();

      await tx.transaksiSparepat.update({
        where: { id: idTransaksi },
        data: {
          deletedAt: now,
        },
      });

      await tx.itemsTransaksiSparepart.updateMany({
        where: {
          idTransaksi,
        },
        data: {
          deletedAt: now,
        },
      });

      await createLog(
        {
          kategori: "Transaksi Sparepart",
          keterangan: `${user.nama} menghapus transaksi sparepart`,
          nominal: transaksi.keuntungan,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return { success: true };
    });
  } catch (error) {
    console.error("Error deleteTransaksiSparepart:", error);

    throw new Error(
      error.message || "Terjadi kesalahan saat menghapus transaksi sparepart"
    );
  }
};

// ✅ GET ALL dengan filter & pagination
export const getAllTransaksiSparepart = async ({
  page = 1,
  pageSize = 10,
  search = "",
  startDate,
  endDate,
  status,
  idToko,
  deletedFilter = "active", // ✅ tambahan
}) => {
  // const skip = (Number(page) - 1) * Number(pageSize);
  // const take = Number(pageSize);

  const where = {
    idToko,
  };

  // ✅ Flexible deleted filter
  if (deletedFilter === "active") {
    where.deletedAt = null;
  } else if (deletedFilter === "deleted") {
    where.deletedAt = { not: null };
  }
  // kalau "all" → tidak difilter

  // 🔍 Search
  if (search) {
    where.namaPembeli = {
      contains: search,
      mode: "insensitive",
    };
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
    prisma.transaksiSparepat.findMany({
      where,
      // skip,
      // take,
      orderBy: { tanggal: "desc" },
      include: {
        items: {
          include: {
            Sparepart: {
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
    prisma.transaksiSparepat.count({ where }),
  ]);

  const formatted = data.map((trx) => {
    const totalKeuntungan = trx.items.reduce((sum, item) => {
      const modal = item.Sparepart?.hargaModal || 0;
      const jual = item.Sparepart?.hargaJual || 0;
      return sum + item.quantity * (jual - modal);
    }, 0);

    return {
      id: trx.id,
      namaPembeli: trx.namaPembeli,
      totalHarga: trx.totalHarga,
      keuntungan: trx.keuntungan ?? totalKeuntungan,
      status: trx.status,
      deletedAt: trx.deletedAt,
      tanggal: trx.createdAt,
      detail: {
        itemTransaksi: trx.items.map((item) => ({
          id: item.id,
          namaProduk: item.Sparepart?.nama,
          qty: item.quantity,
          hargaJual: item.Sparepart?.hargaJual || 0,
          hargaModal: item.Sparepart?.hargaModal || 0,
        })),
      },
    };
  });

  return {
    formatted,
    // meta: {
    //   page: Number(page),
    //   // pageSize: take,
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

export const getLaporanBarangKeluar = async ({
  page = 1,
  pageSize = 10,
  filterPeriod = "all",
  startDate,
  endDate,
  searchNama = "",
  sortQty = "none",
  idToko,
}) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  const { start, end } = getDateRange(filterPeriod, startDate, endDate);

  // ✅ 1. Ambil data dari ItemsTransaksiSparepart
  const whereSparepart = {
    tanggal: { gte: start, lte: end },
    deletedAt: null,
    idToko: idToko,
    ...(searchNama && {
      Sparepart: { nama: { contains: searchNama, mode: "insensitive" } },
    }),
  };

  const itemsSparepart = await prisma.itemsTransaksiSparepart.findMany({
    where: whereSparepart,
    include: {
      Sparepart: {
        select: { nama: true, brand: true, hargaModal: true, hargaJual: true },
      },
    },
  });

  // ✅ 2. Ambil data dari SparepartServiceHP
  const whereService = {
    tanggal: { gte: start, lte: end },
    ...(searchNama && {
      Sparepart: { nama: { contains: searchNama, mode: "insensitive" } },
    }),
    deletedAt: null,
  };

  const itemsService = await prisma.sparepartServiceHP.findMany({
    where: whereService,
    include: {
      Sparepart: {
        select: { nama: true, brand: true, hargaModal: true, hargaJual: true },
      },
    },
  });

  // ✅ 3. Gabungkan kedua data
  const allItems = [
    ...itemsSparepart.map((item) => ({
      ...item,
      sumber: "transaksi_sparepart",
    })),
    ...itemsService.map((item) => ({
      ...item,
      sumber: "service_hp",
    })),
  ];

  // ✅ 4. GROUP BY nama sparepart
  const groupedItems = allItems.reduce((acc, item) => {
    const key = item.Sparepart.nama;

    if (!acc[key]) {
      acc[key] = {
        id: key,
        namaBarang: item.Sparepart.nama,
        merk: item.Sparepart.brand,
        hargaModal: item.Sparepart.hargaModal,
        hargaJual: item.Sparepart.hargaJual,
        qty: 0,
        modal: 0, // field baru
        keuntungan: 0,
        sumber: [], // Lacak sumber data
      };
    }

    acc[key].qty += item.quantity;
    acc[key].modal += item.Sparepart.hargaModal * item.quantity;
    acc[key].keuntungan +=
      (item.Sparepart.hargaJual - item.Sparepart.hargaModal) * item.quantity;
    acc[key].sumber.push(item.sumber);

    return acc;
  }, {});

  // ✅ 5. Sort berdasarkan qty atau tanggal
  let resultArray = Object.values(groupedItems);

  if (sortQty === "desc") {
    resultArray.sort((a, b) => b.qty - a.qty);
  } else if (sortQty === "asc") {
    resultArray.sort((a, b) => a.qty - b.qty);
  } else {
    // Default: urutkan berdasarkan nama
    resultArray.sort((a, b) => a.namaBarang.localeCompare(b.namaBarang));
  }

  // ✅ 6. Pagination
  const totalCount = resultArray.length;
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

export const getDetailTransaksiSparepart = async (id, user) => {
  const transaksi = await prisma.transaksiSparepat.findUnique({
    where: { id },
    include: {
      Member: true,
      items: {
        include: {
          Sparepart: true,
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
};
