import Prisma from "@prisma/client";
const { PrismaClient, PrismaClientKnownRequestError } = Prisma;

export function prismaErrorHandler(error) {
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2000":
        return "Data terlalu panjang untuk field tertentu.";
      case "P2001":
        return "Data yang diminta tidak ditemukan.";
      case "P2002":
        return `Data duplikat. Field unik '${error.meta?.target?.join(
          ", "
        )}' sudah digunakan.`;
      case "P2003":
        return `Gagal karena pelanggaran foreign key constraint pada '${error.meta?.field_name}'.`;
      case "P2004":
        return "Permintaan gagal karena pelanggaran constraint database.";
      case "P2005":
        return `Data tidak valid untuk field '${error.meta?.field_name}'.`;
      case "P2006":
        return `Nilai tidak valid untuk field '${error.meta?.field_name}'.`;
      case "P2007":
        return "Kesalahan validasi data.";
      case "P2008":
        return "Kueri Prisma tidak valid.";
      case "P2009":
        return "Kueri Prisma gagal dijalankan.";
      case "P2010":
        return "Database error selama eksekusi kueri.";
      case "P2011":
        return `Field '${error.meta?.target}' tidak boleh bernilai null.`;
      case "P2012":
        return `Field '${error.meta?.target}' wajib diisi.`;
      case "P2013":
        return "Argument yang diperlukan tidak ditemukan.";
      case "P2014":
        return "Pelanggaran integritas relasi (foreign key).";
      case "P2015":
        return "Record yang diminta tidak ditemukan.";
      case "P2016":
        return "Kueri Prisma gagal divalidasi.";
      case "P2020":
        return "Nilai yang diberikan tidak sesuai dengan tipe data.";
      case "P2021":
        return "Tabel atau kolom yang diminta tidak ditemukan.";
      case "P2022":
        return "Kolom tidak ditemukan di database.";
      case "P2023":
        return "Kueri tidak valid atau rusak.";
      case "P2024":
        return "Transaksi terlalu lama, melebihi waktu timeout.";
      case "P2025":
        return "Data tidak ditemukan untuk operasi ini.";
      case "P2028":
        return "Transaksi sudah kadaluarsa atau ditutup.";
      case "P2030":
        return "Pelanggaran unique constraint yang kompleks.";
      case "P2033":
        return "Database kelebihan beban.";
      default:
        return `Terjadi kesalahan yang tidak diketahui (Kode: ${error.code}).`;
    }
  }

  // Jika bukan Prisma error
  return "Terjadi kesalahan internal.";
}
