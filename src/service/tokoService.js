import { PrismaClient } from "@prisma/client";
import { createLog } from "./logService.js";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../utils/ImageHandler.js";
const prisma = new PrismaClient();

export const getTokoById = async (user) => {
  try {
    const toko = await prisma.toko.findUnique({
      where: {
        id: user.toko_id,
      },
      select: {
        isActive: true,
        SubscribeTime: true,
        namaToko: true,
        alamat: true,
        logoToko: true,
      },
    });

    return toko;
  } catch (error) {
    console.log(error);
  }
};

export const updateTokoById = async (data, user) => {
  try {
    const { namaToko, alamat } = data;

    const updatedToko = await prisma.toko.update({
      where: {
        id: user.toko_id,
      },
      data: {
        ...(namaToko && { namaToko }),
        ...(alamat && { alamat }),
      },
      select: {
        id: true,
        namaToko: true,
        alamat: true,
        logoToko: true,
      },
    });

    await createLog({
      keterangan: `${user.nama} telah mengubah toko`,
      kategori: "Toko",
      nama: user.nama,
      idToko: user.toko_id,
    });

    return updatedToko;
  } catch (error) {
    console.error("Update toko error:", error);
    throw new Error("Gagal memperbarui data toko");
  }
};

export const updateFoto = async (image, user) => {
  try {
    let imageUploadResult;

    const toko = await prisma.toko.findUnique({
      where: {
        id: user.toko_id,
      },
      select: {
        namaToko: true,
        logoTokoId: true,
      },
    });

    if (!toko) {
      throw new Error("Toko tidak ditemukan");
    }

    if (image?.buffer?.length) {
      imageUploadResult = await uploadToCloudinary(
        image.buffer,
        "logo_toko",
        toko.namaToko
      );

      if (toko.logoTokoId) {
        await deleteFromCloudinary(toko.logoTokoId);
      }
    }

    const updated = await prisma.toko.update({
      where: {
        id: user.toko_id,
      },
      data: {
        ...(imageUploadResult && {
          logoToko: imageUploadResult.secure_url,
          logoTokoId: imageUploadResult.public_id,
        }),
      },
      select: {
        id: true,
        namaToko: true,
        logoToko: true,
      },
    });

    return updated;
  } catch (error) {
    console.error("Update toko logo error:", error);
    throw new Error("Gagal memperbarui logo toko");
  }
};
