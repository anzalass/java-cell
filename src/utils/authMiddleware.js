import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { logoutHandler } from "../controller/authController.js";
dotenv.config();

export const AuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"]; // ✅ lowercase!
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header is missing" });
  }
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Format token salah" });
  }

  const token = authHeader.split(" ")[1];
  console.log("Token Diterima:", token);

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY || "ASTRIYANAAAAAA"
    ); // pakai env kalau bisa
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export const AuthMiddleware2 = async (req, res, next) => {
  // ✅ Ambil dari COOKIE, BUKAN header
  const token = req.cookies?.auth_token;
  console.log("tok", token);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized", success: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log("dcd", decoded);
    const data = {
      token: token,
      nama: decoded.nama,
      id: decoded.id,
      role: decoded.role,
      // toko_id: decoded.toko_id,
    };

    console.log(data);

    return res.status(200).json(data); // atau sesuaikan format
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired",
        success: false,
        code: "TOKEN_EXPIRED",
      });
    }
    return res.status(401).json({ message: "Invalid token", success: false });
  }
};

export const isSuperAdmin = (req, res, next) => {
  if (req.user?.role === "Super Admin") {
    return next();
  }
  return res
    .status(403)
    .json({ message: "Access denied. Only Guru TU allowed." });
};

export const isOwner = (req, res, next) => {
  if (req.user?.role === "Owner") {
    return next();
  }
  return res
    .status(403)
    .json({ message: "Access denied. Only Guru TU allowed." });
};

export const isCrew = (req, res, next) => {
  if (req.user?.role === "Crew") {
    return next();
  }
  return res
    .status(403)
    .json({ message: "Access denied. Only Guru TU allowed." });
};

export const hasRole =
  (...roles) =>
  (req, res, next) => {
    if (roles.includes(req.user?.role)) {
      return next();
    }
    return res
      .status(403)
      .json({ message: "Access denied. Unauthorized role." });
  };
