import dotenv from "dotenv";
dotenv.config();
import { fileTypeFromBuffer } from "file-type";
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";

const MAX_SIZE = 3 * 1024 * 1024; // 3 MB

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file ke Cloudinary dengan kompresi + fallback Base64.
 * @param {Buffer} fileBuffer - Buffer file (dari multer.memoryStorage)
 * @param {string} folder - Nama folder di Cloudinary
 * @param {string} fileName - Nama file (tanpa ekstensi)
 */

async function compressToMaxSize(buffer) {
  let quality = 80;
  let output = buffer;

  while (quality >= 40) {
    output = await sharp(buffer)
      .resize({ width: 2000, withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    if (output.length <= MAX_SIZE) {
      return output;
    }

    quality -= 10;
  }

  // fallback terakhir
  return await sharp(buffer)
    .resize({ width: 1500 })
    .jpeg({ quality: 60 })
    .toBuffer();
}

export const uploadToCloudinary = async (
  fileBuffer,
  folder,
  fileName = "file"
) => {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error("File kosong");
  }

  const type = await fileTypeFromBuffer(fileBuffer);
  const mime = type?.mime || "application/octet-stream";
  const isImage = mime.startsWith("image/");

  try {
    if (isImage) {
      // 🔥 COMPRESS KE ≤ 3MB
      const compressedBuffer = await compressToMaxSize(fileBuffer);

      return await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: `${fileName}_${Date.now()}`,
            resource_type: "image",
            timeout: 120000,
          },
          (error, result) => {
            if (error) return reject(error);
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
              size: compressedBuffer.length,
            });
          }
        );

        uploadStream.end(compressedBuffer);
      });
    }

    // === FILE NON IMAGE (PDF, ZIP, dll) ===
    return await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: `${fileName}_${Date.now()}`,
          resource_type: "raw",
          timeout: 120000,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        }
      );

      uploadStream.end(fileBuffer);
    });
  } catch (err) {
    console.error("Upload gagal:", err);
    throw err;
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === "ok") {
      console.log(`File ${publicId} berhasil dihapus.`);
      return true;
    }
    console.log(`Gagal menghapus file ${publicId}.`);
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
  }
};
