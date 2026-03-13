import express from "express";
import {
  getTokoHandler,
  updateFotoTokoHandler,
  updateTokoHandler,
} from "../controller/tokoController.js";
import { AuthMiddleware, hasRole } from "../utils/authMiddleware.js";
import { updatePasswordUser } from "../controller/superAdminController.js";

const router = express.Router();

router.get(
  "/toko-user",
  AuthMiddleware,
  hasRole("Super Admin", "Owner", "Crew"),
  getTokoHandler
);
router.put(
  "/update-toko",
  AuthMiddleware,
  hasRole("Super Admin", "Owner"),
  updateTokoHandler
);
router.put(
  "/update-foto-toko",
  AuthMiddleware,
  hasRole("Super Admin", "Owner"),
  updateFotoTokoHandler
);

router.put(
  "/owner/users/:id/password",
  AuthMiddleware,
  hasRole("Super Admin", "Owner"),
  updatePasswordUser
);

export default router;
