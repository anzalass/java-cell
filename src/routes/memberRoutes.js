// src/routesmemberRoutes.js
import { Router } from "express";
import {
  getAllMembersHandler,
  getMembersWithFilterHandler,
  getMemberByIdHandler,
  createMemberHandler,
  updateMemberHandler,
  deleteMemberHandler,
} from "../controller/memberController.js";

const router = Router();

// ─── GET Semua Member (tanpa filter) ─────────────────────────────────
router.get("/member", getAllMembersHandler);

// ─── GET Member dengan Filter + Pagination ───────────────────────────
router.get("/member/filter", getMembersWithFilterHandler);

// ─── GET Member by ID ────────────────────────────────────────────────
router.get("/member/:id", getMemberByIdHandler);

// ─── POST Tambah Member Baru ─────────────────────────────────────────
router.post("/member/", createMemberHandler);

// ─── PUT Update Member ───────────────────────────────────────────────
router.put("/member/:id", updateMemberHandler);

// ─── DELETE Hapus Member ─────────────────────────────────────────────
router.delete("/member/:id", deleteMemberHandler);

export default router;
