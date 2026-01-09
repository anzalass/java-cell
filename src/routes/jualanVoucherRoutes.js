// src/routes/transaksiVoucherRoutes.js
import { Router } from "express";
import {
  createTransaksi,
  deleteTransaksi,
  getTransaksiHarian,
  getAllTransaksi,
  getVoucherTerlaris,
} from "../controller/jualanVoucherController.js";

const router = Router();

// CREATE transaksi
router.post("/voucher-harian/:idVoucher", createTransaksi);

// DELETE transaksi
router.delete("/voucher-harian/:id", deleteTransaksi);

// GET transaksi hari ini
router.get("/voucher-harian", getTransaksiHarian);

// GET semua transaksi (dengan filter & pagination)
router.get("/voucher-harian-all", getAllTransaksi);

// GET laporan voucher terlaris
router.get("/voucher-harian-terlaris", getVoucherTerlaris);

export default router;
