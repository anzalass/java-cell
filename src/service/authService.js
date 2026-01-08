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
}) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  const where = {};

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
  const { nama, email, password, role, penempatan } = data;

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
    where: { email, NOT: { id } },
  });
  if (existing) {
    throw new Error("Email sudah digunakan oleh user lain");
  }

  // Hash password jika diubah
  let updateData = { nama, email, role, penempatan: penempatan || null };
  if (password) {
    updateData.password = await bcrypt.hash(password, SALT_ROUNDS);
  }

  const user = await prisma.user.update({
    where: { id },
    updateData,
    select: {
      id: true,
      nama: true,
      email: true,
      role: true,
      penempatan: true,
      password: false,
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

    const token = jwt.sign(
      {
        id: user.id,
        nama: user.nama,
        role: user.role,
        penempatan: user.penempatan,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "3d" } // token berlaku 5 menit
    );

    const decoded = jwt.decode(token);

    return {
      token,
      expiresIn: decoded.exp,
      id: decoded.id,
      nama: decoded.nama,
      role: decoded.role,
      penempatan: decoded.penempatan,
    };
  } catch (error) {
    console.log(error);
    const errorMessage = prismaErrorHandler(error);
    throw new Error(errorMessage);
  }
};
