// src/routes/user.route.js
import { Router } from "express";
import {
  getAllUsersHandler,
  getUserByIdHandler,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
  loginController2,
  logoutHandler,
} from "../controller/authController.js";
import {
  AuthMiddleware2,
  AuthMiddleware,
  hasRole,
} from "../utils/authMiddleware.js";

const router = Router();

// GET all users (dengan filter & pagination)
router.get("/auth", AuthMiddleware, getAllUsersHandler);

// GET user by ID
router.get("/auth/:id", AuthMiddleware, getUserByIdHandler);

// CREATE user
router.post(
  "/auth",
  AuthMiddleware,
  hasRole("Super Admin", "Owner"),
  createUserHandler
);

// UPDATE user
router.put(
  "/auth/:id",
  AuthMiddleware,
  hasRole("Super Admin", "Owner"),
  updateUserHandler
);

// DELETE user
router.delete(
  "/auth/:id",
  AuthMiddleware,
  hasRole("Super Admin", "Owner"),
  deleteUserHandler
);
router.get("/me", AuthMiddleware2);
router.post("/auth/logout", logoutHandler);

router.post("/auth/login", loginController2);

export default router;
