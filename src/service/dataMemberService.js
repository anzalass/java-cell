import { PrismaClient } from "@prisma/client";
import { createLog } from "./logService.js";
const prisma = new PrismaClient();

export const getAllDataMember = async ({
  page = 1,
  pageSize = 10,
  search = "",
  idToko,
}) => {
  try {
    const skip = (page - 1) * pageSize;

    const where = {
      idToko,
      OR: [
        {
          nama: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          nomor: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    };

    const [data, total] = await prisma.$transaction([
      prisma.dataMember.findMany({
        where,
        include: {
          Member: true,
        },
        skip,
        take: Number(pageSize),
        orderBy: {
          nama: "asc",
        },
      }),
      prisma.dataMember.count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error("Error getDataMemberById:", error);
    throw new Error("Gagal mengambil data member");
  }
};

export const getDataMemberById = async (id) => {
  try {
    const data = await prisma.dataMember.findUnique({
      where: { id },
      include: {
        Member: true,
        Toko: true,
      },
    });

    return data;
  } catch (error) {
    console.error("Error getDataMemberById:", error);
    throw new Error("Gagal mengambil data member");
  }
};

/* =========================
   CREATE DATA MEMBER
========================= */
export const createDataMember = async (data, user) => {
  try {
    console.log(data);

    return await prisma.$transaction(async (tx) => {
      const result = await tx.dataMember.create({
        data: {
          nama: data.nama,
          idMember: data.idMember,
          nomor: data.nomor,
          idToko: user.toko_id,
        },
      });

      await createLog(
        {
          kategori: "Data Member",
          keterangan: `${user.nama} Menambahkan Data Member ${data.nama}`,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return result;
    });
  } catch (error) {
    console.error("Error createDataMember:", error);
    throw new Error("Gagal membuat data member");
  }
};

/* =========================
   UPDATE DATA MEMBER
========================= */
export const updateDataMember = async (id, data, user) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const result = await tx.dataMember.update({
        where: { id },
        data,
      });

      await createLog(
        {
          kategori: "Data Member",
          keterangan: `${user.nama} Mengupdate Data Member ${data.nama}`,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return result;
    });
  } catch (error) {
    console.error("Error updateDataMember:", error);
    throw new Error("Gagal mengupdate data member");
  }
};

/* =========================
   DELETE DATA MEMBER
========================= */
export const deleteDataMember = async (id, user) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const data = await tx.dataMember.findUnique({
        where: { id },
      });

      if (!data) {
        throw new Error("Data member tidak ditemukan");
      }

      const result = await tx.dataMember.delete({
        where: { id },
      });

      await createLog(
        {
          kategori: "Data Member",
          keterangan: `${user.nama} Menghapus Data Member ${data.nama}`,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return result;
    });
  } catch (error) {
    console.error("Error deleteDataMember:", error);
    throw new Error("Gagal menghapus data member");
  }
};
