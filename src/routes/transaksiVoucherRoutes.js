// src/routes/transaksiGrosirRoutes.js
import { Router } from "express";
import {
  createGrosirOrderHandler,
  getAllTransaksiGrosirHandler,
  updateTransaksiStatusHandler,
  deletePendingTransaksiHandler,
  getLaporanBarangKeluarHandler,
  createGrosirOrderHandler2,
} from "../controller/transaksiVoucherController.js";
import { AuthMiddleware } from "../utils/authMiddleware.js";

const router = Router();

// POST   /api/transaksi/grosir          → Buat pesanan
router.post("/grosir", AuthMiddleware, createGrosirOrderHandler);
router.post("/grosir-downline", createGrosirOrderHandler2);

// GET    /api/transaksi/grosir          → List semua transaksi
router.get("/grosir", AuthMiddleware, getAllTransaksiGrosirHandler);

// PATCH  /api/transaksi/grosir/:id/status → Update status
router.patch(
  "/grosir/:id/status",
  AuthMiddleware,
  updateTransaksiStatusHandler
);

// DELETE /api/transaksi/grosir/:id       → Hapus transaksi (pending only)
router.delete("/grosir/:id", AuthMiddleware, deletePendingTransaksiHandler);
router.get(
  "/barang-keluar-voucher",
  AuthMiddleware,
  getLaporanBarangKeluarHandler
);

export default router;
