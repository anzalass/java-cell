// src/routes/sparepart.route.js
import { Router } from "express";
import { getAllLogsHandler } from "../controller/logController.js";
import { AuthMiddleware } from "../utils/authMiddleware.js";

const router = Router();

// src/routes/transaksiHarian.route.js
router.get("/log", AuthMiddleware, getAllLogsHandler);
export default router;
