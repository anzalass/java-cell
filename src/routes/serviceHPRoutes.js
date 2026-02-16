import express from "express";
import {
  createServiceHPHandler,
  deleteServiceHPHandler,
  getAllServiceHPHandler,
  getDetailService,
  updateServiceHPStatusHandler,
} from "../controller/serviceHPController.js";
import { AuthMiddleware } from "../utils/authMiddleware.js";

const router = express.Router();

// POST   /api/service-hp          → Buat service
router.post("/service-hp", AuthMiddleware, createServiceHPHandler);

// PATCH  /api/service-hp/:id      → Update status
router.patch(
  "/service-hp/:id/status",
  AuthMiddleware,
  updateServiceHPStatusHandler
);

router.get("/service-hp", AuthMiddleware, getAllServiceHPHandler);
router.get("/service-hp-print/:id", getDetailService);

// DELETE /api/service-hp/:id      → Hapus service
router.delete("/service-hp/:id", AuthMiddleware, deleteServiceHPHandler);

export default router;
