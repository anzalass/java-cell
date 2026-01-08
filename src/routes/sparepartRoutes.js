// src/routes/sparepart.route.js
import { Router } from "express";
import {
  getAllSparePartsHandler,
  createSparePartHandler,
  getSparePartHandler,
  updateSparePartHandler,
  deleteSparePartHandler,
  updateSparePartStokHandler,
  getSparepartMaster,
} from "../controller/sparepartController.js";
import { AuthMiddleware } from "../utils/authMiddleware.js";

const router = Router();

router.get("/sparepart", AuthMiddleware, getAllSparePartsHandler); // ✅ GET all + filter
router.post("/sparepart", AuthMiddleware, createSparePartHandler); // ✅ CREATE
router.get("/sparepart/:id", AuthMiddleware, getSparePartHandler); // ✅ GET one
router.get("/sparepart-master", getSparepartMaster);

router.put("/sparepart/:id", AuthMiddleware, updateSparePartHandler); // ✅ UPDATE
router.delete("/sparepart/:id", AuthMiddleware, deleteSparePartHandler); // ✅ DELETE
router.patch("/sparepart/:id/stok", AuthMiddleware, updateSparePartStokHandler); // ✅ DELETE

export default router;
