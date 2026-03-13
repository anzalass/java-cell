// src/services/user.service.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prismaErrorHandler } from "../utils/errorHandlerPrisma.js";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// ✅ GET ALL with filter & pagination
export const getAllUsers = async ({
  page = 1,
  pageSize = 10,
  search = "",
  role,
  penempatan,
  idToko,
}) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  const where = {};

  where.idToko = idToko;

  // Filter pencarian (nama atau email)
  if (search) {
    where.OR = [
      { nama: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  // Filter role
  if (role) {
    where.role = role;
  }

  // Filter penempatan
  if (penempatan) {
    where.penempatan = { contains: penempatan, mode: "insensitive" };
  }

  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { nama: "asc" },
      select: {
        id: true,
        nama: true,
        idToko: true,
        email: true,
        role: true,
        penempatan: true,
        password: false, // Jangan kembalikan password
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data,
    meta: {
      page: Number(page),
      pageSize: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

// ✅ GET BY ID
export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      nama: true,
      email: true,
      role: true,
      penempatan: true,
      password: false,
    },
  });

  if (!user) {
    throw new Error("User tidak ditemukan");
  }

  return user;
};

// ✅ CREATE
export const createUser = async (data) => {
  const { nama, email, password, role, penempatan, idToko } = data;

  // Validasi wajib
  if (!nama || !email || !password || !role) {
    throw new Error("Field nama, email, password, dan role wajib diisi");
  }

  // Cek email unik
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Email sudah terdaftar");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  return await prisma.user.create({
    data: {
      nama,
      email,
      idToko,
      password: hashedPassword,
      role,
      penempatan: penempatan || null,
    },
  });
};

// ✅ UPDATE
export const updateUser = async (id, data) => {
  const { nama, email, password, role, penempatan } = data;

  // Validasi minimal
  if (!nama || !email || !role) {
    throw new Error("Field nama, email, dan role wajib diisi");
  }

  // Cek email unik (kecuali milik user ini)
  const existing = await prisma.user.findFirst({
    where: {
      email,
      NOT: { id },
    },
  });

  if (existing) {
    throw new Error("Email sudah digunakan oleh user lain");
  }

  // Data update
  const updateData = {
    nama,
    email,
    role,
    penempatan: penempatan || null,
  };

  // Hash password jika ada
  if (password) {
    updateData.password = await bcrypt.hash(password, SALT_ROUNDS);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData, // ✅ harus pakai data
    select: {
      id: true,
      nama: true,
      email: true,
      role: true,
      penempatan: true,
    },
  });

  return user;
};
// ✅ DELETE
export const deleteUser = async (id) => {
  // Cek apakah user ada
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new Error("User tidak ditemukan");
  }

  // Hapus user
  await prisma.user.delete({ where: { id } });
  return { success: true };
};

export const login = async (auth) => {
  const { email, password } = auth;

  try {
    if (!process.env.JWT_SECRET_KEY) {
      throw new Error("JWT secret belum diset");
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new Error("NIP atau password salah");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new Error("NIP atau password salah");
    }

    const toko = await prisma.toko.findUnique({
      where: { id: user.idToko },
    });

    if (!toko) {
      throw new Error("Data toko tidak ditemukan");
    }

    if (!toko.SubscribeTime) {
      throw new Error("Toko belum memiliki masa langganan");
    }

    if (new Date(toko.SubscribeTime) < new Date()) {
      throw new Error("Silahkan Perpanjang Langganan");
    }

    if (!toko.isActive) {
      throw new Error("Toko Tidak Aktif Silahkan Hubungi CS 0859102604165");
    }

    const token = jwt.sign(
      {
        id: user.id,
        nama: user.nama,
        role: user.role,
        penempatan: user.penempatan,
        toko_id: toko.id,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "3d" }
    );

    return {
      token,
      id: user.id,
      nama: user.nama,
      role: user.role,
      penempatan: user.penempatan,
      toko_id: toko.id,
    };
  } catch (error) {
    console.log(error);

    if (error instanceof Error) {
      throw error;
    }
    throw new Error(prismaErrorHandler(error));
  }
};
