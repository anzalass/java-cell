import ImageKit from "imagekit";
import dotenv from "dotenv";
dotenv.config();

const imagekit = new ImageKit({
  publicKey: "public_+LsWTN2IGXkaGmgXD8PpE/n7HFo=",
  privateKey: "private_8X6RPe0HkLf3rPJCtJK5doTtdog=",
  urlEndpoint: "https://ik.imagekit.io/blogemyu",
});

export const uploadToImageKit = async (file, folder) => {
  try {
    console.log("filename", file.originalname);

    const filename = file?.originalname + new Date().getTime();
    const result = await imagekit.upload({
      file: file.buffer.toString("base64"),
      fileName: filename,
      folder: `management_sekolah/${folder}`,
    });

    return result;
  } catch (error) {
    throw new Error("Upload failed: " + error.message);
  }
};

export const deleteFromImageKit = async (fileId) => {
  try {
    const result = await imagekit.deleteFile(fileId);
    return result;
  } catch (error) {
    throw new Error("Delete failed: " + error.message);
  }
};

import { v2 as cloudinary } from "cloudinary";

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: "dyofh7ecq",
  api_key: "927867245521265",
  api_secret: "G4yz1UqzywU4hXNaklR541BdFvY",
});

/**
 * Fungsi untuk mengunggah file ke Cloudinary
 * @param {Buffer} fileBuffer - Buffer dari file yang diunggah
 * @param {string} folder - Folder tempat penyimpanan di Cloudinary
 * @param {string} fileName - Nama file yang akan disimpan (opsional, default: "image")
 * @returns {Promise<{ secure_url: string }>} - Hasil upload dari Cloudinary
 */
export const uploadToCloudinary = (fileBuffer, folder, fileName = "image") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: `${fileName}_${Date.now()}`,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          return reject(new Error("Upload failed: " + error.message));
        }
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );

    uploadStream.end(fileBuffer); // Kirim buffer ke Cloudinary
  });
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === "ok") {
      console.log(`File ${publicId} berhasil dihapus.`);
      return true;
    }
    console.log(`Gagal menghapus file ${publicId}.`);
    return false;
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    return false;
  }
};
