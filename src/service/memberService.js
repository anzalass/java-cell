import { PrismaClient } from "@prisma/client";
import { createLog } from "./logService.js";
const prisma = new PrismaClient();
// ─── 1. GET ALL MEMBERS (tanpa filter) ───────────────────────────────
export const getAllMembers = async (user) => {
  try {
    const members = await prisma.member.findMany({
      where: {
        idToko: user.toko_id,
      },
      select: {
        id: true,
        nama: true,
        noTelp: true,
        createdAt: true,
        updatedAt: true,
        kodeMember: true,
        // Jangan include relasi berat secara default
      },
    });
    return members;
  } catch (error) {
    throw new Error(`Gagal mengambil semua member: ${error.message}`);
  }
};

// ─── 2. GET MEMBERS DENGAN FILTER + PAGINATION + SORT ───────────────
export const getMembersWithFilter = async ({
  page = 1,
  pageSize = 10,
  search = "",
  sortBy = "createdAt",
  sortOrder = "desc",
  minTotalTransaksi,
  maxTotalTransaksi,
  idToko,
}) => {
  // Validasi input
  page = Math.max(1, parseInt(page));
  pageSize = Math.min(100, Math.max(1, parseInt(pageSize))); // Max 100 per halaman
  sortOrder = sortOrder === "asc" ? "asc" : "desc";

  // Kolom yang boleh di-sort
  const allowedSortFields = ["nama", "createdAt", "updatedAt"];
  if (!allowedSortFields.includes(sortBy)) {
    sortBy = "createdAt";
  }

  // Bangun kondisi where
  const where = {};
  where.idToko = idToko;

  // Filter pencarian (nama atau noTelp)
  if (search) {
    where.OR = [
      { nama: { contains: search, mode: "insensitive" } },
      { noTelp: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    // Hitung total data
    const total = await prisma.member.count({ where });

    // Ambil data dengan pagination
    const members = await prisma.member.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        [sortBy]: sortOrder,
      },
      select: {
        id: true,
        nama: true,
        noTelp: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      data: members,
      totalMember: members.length,

      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page < Math.ceil(total / pageSize),
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    throw new Error(`Gagal mengambil member dengan filter: ${error.message}`);
  }
};

// ─── 3. GET MEMBER BY ID ────────────────────────────────────────────
export const getMemberById = async (id) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id },
      select: {
        id: true,
        nama: true,
        noTelp: true,
        createdAt: true,
        updatedAt: true,
        // Tambahkan relasi jika perlu, misal:
        // JualanHarian: true,
      },
    });
    if (!member) {
      throw new Error("Member tidak ditemukan");
    }
    return member;
  } catch (error) {
    if (error.message === "Member tidak ditemukan") throw error;
    throw new Error(`Gagal mengambil member: ${error.message}`);
  }
};

// ─── 4. CREATE MEMBER ───────────────────────────────────────────────
export const createMember = async (data, user) => {
  try {
    // Validasi data (opsional)
    if (!data.nama) throw new Error("Nama wajib diisi");

    const toko = await prisma.toko.findUnique({
      where: {
        id: user.toko_id,
      },
    });

    const uniqueMember =
      toko.namaToko.toUpperCase().replace(/\s+/g, "") +
      "-" +
      Math.floor(Date.now() / 1000);

    const member = await prisma.member.create({
      data: {
        nama: data.nama,
        noTelp: data.noTelp || null,
        kodeMember: uniqueMember.toString(),
        idToko: data.idToko,
      },
      select: {
        id: true,
        nama: true,
        noTelp: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await createLog({
      kategori: "Member",
      keterangan: `${user.nama} telah menambah Member`,
      nama: user.nama,
      idToko: user.toko_id,
    });
    return member;
  } catch (error) {
    throw new Error(`Gagal membuat member: ${error.message}`);
  }
};

// ─── 5. UPDATE MEMBER ───────────────────────────────────────────────
export const updateMember = async (id, data) => {
  try {
    const member = await prisma.member.update({
      where: { id },
      data: {
        ...(data.nama && { nama: data.nama }),
        ...(data.noTelp !== undefined && { noTelp: data.noTelp }),
      },
      select: {
        id: true,
        nama: true,
        noTelp: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await createLog({
      kategori: "Member",
      keterangan: `${user.nama} telah mengupdate Member ${member.nama}`,
      nama: user.nama,
      idToko: user.toko_id,
    });

    return member;
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error("Member tidak ditemukan");
    }
    throw new Error(`Gagal update member: ${error.message}`);
  }
};

// ─── 6. DELETE MEMBER ───────────────────────────────────────────────
export const deleteMember = async (id, user) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id },
    });

    await createLog({
      kategori: "Member",
      keterangan: `${user.nama} telah menghapus Member ${member.nama}`,
      nama: user.nama,
      idToko: user.toko_id,
    });

    await prisma.member.delete({
      where: { id },
    });

    return { success: true, message: "Member berhasil dihapus" };
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error("Member tidak ditemukan");
    }
    throw new Error(`Gagal menghapus member: ${error.message}`);
  }
};

export const getTrxMember = async (idMember) => {
  const member = await prisma.member.findUnique({
    where: {
      id: idMember,
    },
  });
  const [voucherHarian, serviceHp, trxAksesoris, trxSparepart, jualanHarian] =
    await Promise.all([
      prisma.transaksiVoucherHarian.findMany({
        where: { idMember, deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          Voucher: {
            select: { nama: true, hargaEceran: true },
          },
        },
      }),

      prisma.serviceHP.findMany({
        where: { idMember, deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          Sparepart: {
            include: {
              Sparepart: {
                select: { nama: true, hargaJual: true },
              },
            },
          },
        },
      }),

      prisma.transaksiAksesoris.findMany({
        where: { idMember, deletedAt: null },
        orderBy: { tanggal: "desc" },
        include: {
          items: {
            include: {
              Aksesoris: {
                select: { nama: true, hargaJual: true },
              },
            },
          },
        },
      }),

      prisma.transaksiSparepat.findMany({
        where: { idMember, deletedAt: null },
        orderBy: { tanggal: "desc" },
        include: {
          items: {
            include: {
              Sparepart: {
                select: { nama: true, hargaJual: true },
              },
            },
          },
        },
      }),

      prisma.jualanHarian.findMany({
        where: { idMember, deletedAt: null },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  let result = [];

  /* =========================
     1️⃣ VOUCHER
  ========================== */
  voucherHarian.forEach((trx) => {
    result.push({
      jenis: "voucher",
      id: trx.id,
      tanggal: trx.createdAt,
      totalHarga: trx.Voucher?.hargaEceran ?? 0,
      keuntungan: trx.keuntungan ?? 0,
      items: trx.Voucher
        ? [
            {
              nama: trx.Voucher.nama,
              harga: trx.Voucher.hargaEceran,
            },
          ]
        : [],
    });
  });

  /* =========================
     2️⃣ SERVICE HP
  ========================== */
  serviceHp.forEach((trx) => {
    result.push({
      jenis: "service",
      id: trx.id,
      tanggal: trx.tanggal,
      totalHarga: (trx.hargaSparePart ?? 0) + (trx.biayaJasa ?? 0),
      keuntungan: trx.keuntungan ?? 0,
      items:
        trx.Sparepart?.map((sp) => ({
          nama: sp.Sparepart?.nama,
          harga: sp.Sparepart?.hargaJual,
        })) ?? [],
    });
  });

  /* =========================
     3️⃣ AKSESORIS
  ========================== */
  trxAksesoris.forEach((trx) => {
    result.push({
      jenis: "aksesoris",
      id: trx.id,
      tanggal: trx.tanggal,
      totalHarga: trx.totalHarga ?? 0,
      keuntungan: trx.keuntungan ?? 0,
      items:
        trx.items?.map((item) => ({
          nama: item.Aksesoris?.nama,
          harga: item.Aksesoris?.hargaJual,
          qty: item.quantity,
        })) ?? [],
    });
  });

  /* =========================
     4️⃣ SPAREPART
  ========================== */
  trxSparepart.forEach((trx) => {
    result.push({
      jenis: "sparepart",
      id: trx.id,
      tanggal: trx.tanggal,
      totalHarga: trx.totalHarga ?? 0,
      keuntungan: trx.keuntungan ?? 0,
      items:
        trx.items?.map((item) => ({
          nama: item.Sparepart?.nama,
          harga: item.Sparepart?.hargaJual,
          qty: item.quantity,
        })) ?? [],
    });
  });

  /* =========================
     5️⃣ JUALAN HARIAN
  ========================== */
  jualanHarian.forEach((trx) => {
    result.push({
      jenis: "jualanHarian",
      id: trx.id,
      tanggal: trx.tanggal,
      totalHarga: trx.nominal ?? 0,
      keuntungan: trx.nominal ?? 0,
      items: trx.kategori
        ? [
            {
              nama: trx.kategori,
            },
          ]
        : [],
    });
  });

  /* =========================
     SORT GLOBAL BY TANGGAL
  ========================== */
  result.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

  return {
    nama: member.nama,
    noTelp: member.noTelp,
    result,
  };
};
