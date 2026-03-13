import { Router } from "express";

import { AuthMiddleware } from "../utils/authMiddleware.js";
import {
  getKeuntunganChart,
  getKeuntunganChart2,
  getKeuntunganController,
} from "../controller/keuntunganController.js";

const router = Router();

router.get("/chart", AuthMiddleware, getKeuntunganChart); // ✅ GET all + filter
router.get("/chart2", AuthMiddleware, getKeuntunganChart2); // ✅ CREATE
router.get("/keuntungan", AuthMiddleware, getKeuntunganController); // ✅ CREATE

export default router;
