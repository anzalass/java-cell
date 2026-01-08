import { PrismaClient } from "@prisma/client";
import { createLog } from "../utils/Log.js";
const prisma = new PrismaClient();
// ─── 1. GET ALL MEMBERS (tanpa filter) ───────────────────────────────
export const getAllMembers = async () => {
  try {
    const members = await prisma.member.findMany({
      select: {
        id: true,
        nama: true,
        noTelp: true,
        totalTransaksi: true,
        createdAt: true,
        updatedAt: true,
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
}) => {
  // Validasi input
  page = Math.max(1, parseInt(page));
  pageSize = Math.min(100, Math.max(1, parseInt(pageSize))); // Max 100 per halaman
  sortOrder = sortOrder === "asc" ? "asc" : "desc";

  // Kolom yang boleh di-sort
  const allowedSortFields = [
    "nama",
    "totalTransaksi",
    "createdAt",
    "updatedAt",
  ];
  if (!allowedSortFields.includes(sortBy)) {
    sortBy = "createdAt";
  }

  // Bangun kondisi where
  const where = {};

  // Filter pencarian (nama atau noTelp)
  if (search) {
    where.OR = [
      { nama: { contains: search, mode: "insensitive" } },
      { noTelp: { contains: search, mode: "insensitive" } },
    ];
  }

  // Filter totalTransaksi
  if (minTotalTransaksi !== undefined || maxTotalTransaksi !== undefined) {
    where.totalTransaksi = {};
    if (minTotalTransaksi !== undefined) {
      where.totalTransaksi.gte = parseInt(minTotalTransaksi);
    }
    if (maxTotalTransaksi !== undefined) {
      where.totalTransaksi.lte = parseInt(maxTotalTransaksi);
    }
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
        totalTransaksi: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const totalTrx = await prisma.member.aggregate({
      _sum: {
        totalTransaksi: true,
      },
    });

    return {
      data: members,
      totalMember: members.length,
      totalTransaksi: totalTrx,

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
        totalTransaksi: true,
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
export const createMember = async (data) => {
  try {
    // Validasi data (opsional)
    if (!data.nama) throw new Error("Nama wajib diisi");

    const member = await prisma.member.create({
      data: {
        nama: data.nama,
        noTelp: data.noTelp || null,
        totalTransaksi: data.totalTransaksi || 0,
      },
      select: {
        id: true,
        nama: true,
        noTelp: true,
        totalTransaksi: true,
        createdAt: true,
        updatedAt: true,
      },
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
        ...(data.totalTransaksi !== undefined && {
          totalTransaksi: data.totalTransaksi,
        }),
      },
      select: {
        id: true,
        nama: true,
        noTelp: true,
        totalTransaksi: true,
        createdAt: true,
        updatedAt: true,
      },
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
export const deleteMember = async (id) => {
  try {
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
