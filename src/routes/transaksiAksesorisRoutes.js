import express from "express";
// src/routes/transaksiAksesoris.route.js

import {
  createTransaksiAksesorisHandler,
  deleteTransaksiAksesorisHandler,
  getAllTransaksiAksesorisHandler,
  getLaporanBarangKeluarHandler,
} from "../controller/transaksiAksesorisController.js";
import { AuthMiddleware } from "../utils/authMiddleware.js";

const router = express.Router();

router.post("/transaksi-acc", AuthMiddleware, createTransaksiAksesorisHandler); // POST transaksi

// POST   /api/transaksi/acc      → Buat transaksi

// GET    /api/transaksi/acc      → List semua transaksi
router.get(
  "/transaksi-accecoris",
  AuthMiddleware,
  getAllTransaksiAksesorisHandler
); // src/routes/transaksiAksesoris.route.js
router.get("/transaksi-acc", AuthMiddleware, getAllTransaksiAksesorisHandler); // ✅

// DELETE /api/transaksi/acc/:id  → Hapus transaksi
router.delete(
  "/transaksi-acc/:id",
  AuthMiddleware,
  deleteTransaksiAksesorisHandler
);
router.get("/barang-keluar-acc", AuthMiddleware, getLaporanBarangKeluarHandler);

export default router;
