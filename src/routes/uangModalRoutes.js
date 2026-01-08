// src/routes/uangModal.route.js
import { Router } from "express";
import {
  getAllUangModalHandler,
  createUangModalHandler,
  updateUangModalHandler,
  deleteUangModalHandler,
} from "../controller/uangModalController.js";
import { AuthMiddleware } from "../utils/authMiddleware.js";

const router = Router();

// GET all with filter & pagination
router.get("/uang-modal", AuthMiddleware, getAllUangModalHandler);

// CREATE
router.post("/uang-modal", AuthMiddleware, createUangModalHandler);

// UPDATE
router.put("/uang-modal/:id", AuthMiddleware, updateUangModalHandler);

// DELETE
router.delete("/uang-modal/:id", AuthMiddleware, deleteUangModalHandler);

export default router;
