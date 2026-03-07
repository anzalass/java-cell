import express from "express";
import {
  create,
  getAll,
  getDetail,
  update,
  remove,
  updateSub,
  createUser,
  updateUser,
  updatePasswordUser,
} from "../controller/superAdminController.js";

const router = express.Router();

router.post("/super-admin/toko", create);
router.post("/super-admin/create-user", createUser);
router.put("/super-admin/users/:id", updateUser);

router.get("/super-admin/toko", getAll);
router.get("/super-admin/toko/:id", getDetail);
router.put("/super-admin/toko/:id", update);
router.delete("/super-admin/toko/:id", remove);

/* Update Subscribe */
router.put("/super-admin/toko/:id/subscribe", updateSub);
router.put("/super-admin/users/:id/password", updatePasswordUser);

export default router;
