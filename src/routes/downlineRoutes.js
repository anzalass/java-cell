// src/routes/downline.route.js
import { Router } from "express";
import {
  getAllDownlinesHandler,
  createDownlineHandler,
  getDownlineHandler,
  updateDownlineHandler,
  deleteDownlineHandler,
  getDownlineMaster,
} from "../controller/downlineController.js";
import { AuthMiddleware } from "../utils/authMiddleware.js";

const router = Router();

router.get("/downline", AuthMiddleware, getAllDownlinesHandler);
router.get("/downline-master", getDownlineMaster);

router.post("/downline", AuthMiddleware, createDownlineHandler);
router.get("/downline/:id", AuthMiddleware, getDownlineHandler);
router.put("/downline/:id", AuthMiddleware, updateDownlineHandler);
router.delete("/downline/:id", AuthMiddleware, deleteDownlineHandler);

export default router;
