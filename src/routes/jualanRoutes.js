// src/routes/sparepart.route.js
import { Router } from "express";
import {
  createJualanHarianHandler,
  createKejadianTakTerdugaHandler,
  deleteJualanHarianHandler,
  deleteKejadianTakTerdugaHandler,
  getAllTransaksiTodayHandler,
  getLaporanKeuanganHandler,
} from "../controller/jualanController.js";
import { AuthMiddleware } from "../utils/authMiddleware.js";

const router = Router();

// src/routes/transaksiHarian.route.js
router.get("/today", AuthMiddleware, getAllTransaksiTodayHandler);
router.post("/jualan-harian", AuthMiddleware, createJualanHarianHandler);
router.post(
  "/kejadian-tak-terduga",
  AuthMiddleware,
  createKejadianTakTerdugaHandler
);
router.delete("/jualan-harian/:id", AuthMiddleware, deleteJualanHarianHandler);
router.delete(
  "/kejadian-tak-terduga/:id",
  AuthMiddleware,
  deleteKejadianTakTerdugaHandler
);
router.get("/laporan", AuthMiddleware, getLaporanKeuanganHandler);

export default router;
