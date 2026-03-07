// src/routesmemberRoutes.js
import { Router } from "express";
import {
  getAllMembersHandler,
  getMembersWithFilterHandler,
  getMemberByIdHandler,
  createMemberHandler,
  updateMemberHandler,
  deleteMemberHandler,
  getTrxMemberByIdHandler,
} from "../controller/memberController.js";
import { AuthMiddleware } from "../utils/authMiddleware.js";

const router = Router();

// ─── GET Semua Member (tanpa filter) ─────────────────────────────────
router.get("/member", AuthMiddleware, getAllMembersHandler);
router.get("/member/trx/:id", AuthMiddleware, getTrxMemberByIdHandler);

// ─── GET Member dengan Filter + Pagination ───────────────────────────
router.get("/member/filter", AuthMiddleware, getMembersWithFilterHandler);

// ─── GET Member by ID ────────────────────────────────────────────────
router.get("/member/:id", AuthMiddleware, getMemberByIdHandler);

// ─── POST Tambah Member Baru ─────────────────────────────────────────
router.post("/member/", AuthMiddleware, createMemberHandler);

// ─── PUT Update Member ───────────────────────────────────────────────
router.put("/member/:id", AuthMiddleware, updateMemberHandler);

// ─── DELETE Hapus Member ─────────────────────────────────────────────
router.delete("/member/:id", AuthMiddleware, deleteMemberHandler);

export default router;
