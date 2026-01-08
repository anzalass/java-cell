// routes/voucherRoutes.js
import express from "express";
import {
  createVoucherHandler,
  deleteVoucherHandler,
  getVoucherByIdHandler,
  getVouchersHandler,
  updateStokVoucherHandler,
  updateVoucherHandler,
  getVoucherMaster,
} from "../controller/voucherController.js";
import { AuthMiddleware } from "../utils/authMiddleware.js";

const router = express.Router();

router.post("/vouchers", AuthMiddleware, createVoucherHandler);
router.get("/vouchers", AuthMiddleware, getVouchersHandler);
router.get("/vouchers-master", getVoucherMaster);

router.get("/vouchers/:id", AuthMiddleware, getVoucherByIdHandler);
router.put("/vouchers/:id", AuthMiddleware, updateVoucherHandler);
router.patch("/vouchers/:id/stok", AuthMiddleware, updateStokVoucherHandler); // ← endpoint baru
router.delete("/vouchers/:id", AuthMiddleware, deleteVoucherHandler);

export default router;
