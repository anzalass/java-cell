// src/routes/sparepart.route.js
import { Router } from "express";
import {
  getAllAccHandler,
  createAccHandler,
  deleteAccHandler,
  getAccHandler,
  updateAccHandler,
  updateStokAccHandler,
  getAccMaster,
} from "../controller/aksesorisController.js";
import { AuthMiddleware } from "../utils/authMiddleware.js";

const router = Router();

router.get("/acc", AuthMiddleware, getAllAccHandler); // ✅ GET all + filter
router.post("/acc", AuthMiddleware, createAccHandler); // ✅ CREATE
router.get("/acc/:id", AuthMiddleware, getAccHandler); // ✅ GET one
router.put("/acc/:id", AuthMiddleware, updateAccHandler); // ✅ UPDATE
router.delete("/acc/:id", AuthMiddleware, deleteAccHandler); // ✅ DELETE
router.patch("/acc/:id/stok", AuthMiddleware, updateStokAccHandler); // ✅ DELETE
router.get("/acc-master", getAccMaster);

export default router;
