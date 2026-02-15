import express from "express";
const router = express.Router();
import { AuthMiddleware } from "../utils/authMiddleware.js";
import {
  cariAksesorisController,
  cariSparepartController,
  cariVoucherController,
  dashboardAdminPageController,
  getDashboardData,
  grosirVoucherPageController,
  serviceHPAdminPageController,
  transaksiAksesorisPageController,
  transaksiSparepartAdminPageController,
} from "../controller/pageController.js";

router.get("/dashboard", AuthMiddleware, dashboardAdminPageController);
router.get("/grosir-voucher", AuthMiddleware, grosirVoucherPageController);
router.get(
  "/penjualan-aksesoris",
  AuthMiddleware,
  transaksiAksesorisPageController
);
router.get(
  "/penjualan-sparepart",
  AuthMiddleware,
  transaksiSparepartAdminPageController
);
router.get("/service-hp", AuthMiddleware, serviceHPAdminPageController);

router.get("/cari-sparepart", AuthMiddleware, cariSparepartController);
router.get("/cari-voucher", AuthMiddleware, cariVoucherController);
router.get("/cari-acc", AuthMiddleware, cariAksesorisController);

router.get("/dashboard2", AuthMiddleware, getDashboardData);

export default router;
