import express from "express";
// src/routes/transaksiAksesoris.route.js

import {
  createTransaksiSparepartHandler,
  deleteTransaksiSparepartHandler,
  getAllTransaksiSparepartHandler,
  getLaporanBarangKeluarHandler,
} from "../controller/transaksiSparepartController.js";
import { AuthMiddleware } from "../utils/authMiddleware.js";

const router = express.Router();

router.post(
  "/transaksi-sparepart",
  AuthMiddleware,
  createTransaksiSparepartHandler
); // POST transaksi

router.get(
  "/transaksi-sparepart",
  AuthMiddleware,
  getAllTransaksiSparepartHandler
); // src/routes/transaksiAksesoris.route.js

// DELETE /api/transaksi/acc/:id  → Hapus transaksi
router.delete(
  "/transaksi-sparepart/:id",
  AuthMiddleware,
  deleteTransaksiSparepartHandler
);
router.get(
  "/barang-keluar-sparepart",
  AuthMiddleware,
  getLaporanBarangKeluarHandler
);

export default router;
