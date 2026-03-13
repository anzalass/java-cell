// src/routes/transaksiVoucherRoutes.js
import { Router } from "express";
import {
  createTransaksi,
  deleteTransaksi,
  getTransaksiHarian,
  getAllTransaksi,
  getVoucherTerlaris,
} from "../controller/jualanVoucherController.js";
import { AuthMiddleware } from "../utils/authMiddleware.js";

const router = Router();

// CREATE transaksi
router.post("/voucher-harian", AuthMiddleware, createTransaksi);

// DELETE transaksi
router.delete("/voucher-harian/:id", AuthMiddleware, deleteTransaksi);

// GET transaksi hari ini
router.get("/voucher-harian", AuthMiddleware, getTransaksiHarian);

// GET semua transaksi (dengan filter & pagination)
router.get("/voucher-harian-all", AuthMiddleware, getAllTransaksi);

// GET laporan voucher terlaris
router.get("/voucher-harian-terlaris", AuthMiddleware, getVoucherTerlaris);

export default router;
