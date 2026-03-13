import express from "express";
import {
  getAllDataMemberController,
  getDataMemberByIdController,
  createDataMemberController,
  updateDataMemberController,
  deleteDataMemberController,
} from "../controller/dataMemberController.js";
import { AuthMiddleware } from "../utils/authMiddleware.js";

const router = express.Router();

/* =========================
   DATA MEMBER ROUTES
========================= */

router.get("/data-member", AuthMiddleware, getAllDataMemberController);

router.get("/data-member/:id", AuthMiddleware, getDataMemberByIdController);

router.post("/data-member", AuthMiddleware, createDataMemberController);

router.put("/data-member/:id", AuthMiddleware, updateDataMemberController);

router.delete("/data-member/:id", AuthMiddleware, deleteDataMemberController);

export default router;
