import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from "bcrypt";
import { uploadToCloudinary } from "../utils/ImageHandler.js";

/* =========================
   HELPER TAMBAH WAKTU
========================= */
const addSubscribeTime = (currentDate, type) => {
  const date = new Date(currentDate);

  switch (type) {
    case "1 Bulan":
      date.setMonth(date.getMonth() + 1);
      break;
    case "3 Bulan":
      date.setMonth(date.getMonth() + 3);
      break;
    case "6 Bulan":
      date.setMonth(date.getMonth() + 6);
      break;
    case "1 Tahun":
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      throw new Error("Tipe subscribe tidak valid");
  }

  return date;
};

/* =========================
   CREATE TOKO
========================= */
export const createToko = async (payload, image) => {
  try {
    let imageUploadResult;

    const { namaToko, logoToko, logoTokoId, alamat, noTelp } = payload;

    if (image && image.buffer && image.buffer.length > 0) {
      imageUploadResult = await uploadToCloudinary(
        image.buffer,
        "logo_toko",
        namaToko
      );
    }

    const now = new Date();
    const subscribePlus7 = new Date();
    subscribePlus7.setDate(now.getDate() + 7);

    return await prisma.toko.create({
      data: {
        namaToko,
        logoToko: imageUploadResult?.secure_url,
        logoTokoId: imageUploadResult?.public_id,
        alamat,
        noTelp,
        SubscribeTime: subscribePlus7,
        isActive: true,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

export const createUserServiceSuperAdmin = async (payload) => {
  const { idToko, nama, email, password, role } = payload;

  const hashedPassword = await bcrypt.hash(password, 10);

  return await prisma.user.create({
    data: {
      idToko,
      email,
      nama,
      password: hashedPassword,
      role,
    },
  });
};

/* =========================
   GET ALL + FILTER
========================= */
export const getAllToko = async (query) => {
  try {
    const { namaToko, isActive } = query;

    return await prisma.toko.findMany({
      where: {
        namaToko: namaToko
          ? { contains: namaToko, mode: "insensitive" }
          : undefined,
        isActive: isActive !== undefined ? isActive === "true" : undefined,
      },
      include: {
        User: true,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

/* =========================
   GET DETAIL
========================= */
export const getDetailToko = async (id) => {
  const data = await prisma.toko.findUnique({
    where: { id },
  });

  if (!data) throw new Error("Toko tidak ditemukan");

  return data;
};

/* =========================
   UPDATE TOKO
========================= */
export const updateToko = async (id, payload, image) => {
  let imageUploadResult;

  if (image && image.buffer && image.buffer.length > 0) {
    imageUploadResult = await uploadToCloudinary(
      image.buffer,
      "logo_toko",
      payload.namaToko
    );
  }

  payload.logoToko = imageUploadResult?.secure_url;
  payload.logoTokoId = imageUploadResult?.public_id;

  return await prisma.toko.update({
    where: { id },
    data: payload,
  });
};

export const updateUserSuperAdmin = async (id, payload) => {
  return await prisma.user.update({
    where: { id },
    data: payload,
  });
};

export const updatePassUserSuperAdmin = async (id, payload) => {
  const hashedPassword = await bcrypt.hash(payload.password, 10);

  return await prisma.user.update({
    where: { id },
    data: {
      password: hashedPassword,
    },
  });
};

/* =========================
   DELETE (SOFT DELETE)
========================= */
export const deleteToko = async (id) => {
  return await prisma.toko.update({
    where: { id },
    data: { isActive: false },
  });
};

/* =========================
   UPDATE SUBSCRIBE
========================= */
export const updateSubscribe = async (id, type) => {
  const toko = await prisma.toko.findUnique({
    where: { id },
  });

  if (!toko) throw new Error("Toko tidak ditemukan");

  const newDate = addSubscribeTime(toko.SubscribeTime || new Date(), type);

  return await prisma.toko.update({
    where: { id },
    data: {
      SubscribeTime: newDate,
    },
  });
};
