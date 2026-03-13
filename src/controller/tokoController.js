import {
  getTokoById,
  updateFoto,
  updateTokoById,
} from "../service/tokoService.js";
import memoryUpload from "../utils/multer.js";

export const getTokoHandler = async (req, res) => {
  try {
    const toko = await getTokoById(req.user);

    res.status(200).json({
      success: true,
      data: toko,
    });
  } catch (error) {
    console.error("Get toko error:", error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil data toko",
    });
  }
};

export const updateTokoHandler = async (req, res) => {
  try {
    const updated = await updateTokoById(req.body, req.user);

    res.status(200).json({
      success: true,
      message: "Data toko berhasil diperbarui",
      data: updated,
    });
  } catch (error) {
    console.error("Update toko controller error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Gagal update toko",
    });
  }
};

export const updateFotoTokoHandler = async (req, res) => {
  memoryUpload.single("logoToko")(req, res, async (err) => {
    try {
      const updated = await updateFoto(req.file, req.user);

      res.status(200).json({
        success: true,
        message: "Data toko berhasil diperbarui",
        data: updated,
      });
    } catch (error) {
      console.error("Update toko controller error:", error);

      res.status(500).json({
        success: false,
        message: error.message || "Gagal update toko",
      });
    }
  });
};
