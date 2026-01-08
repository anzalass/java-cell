import express from "express";
import morgan from "morgan";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { errorHandler } from "./utils/errorHandler.js";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
app.use(express.json());
const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("JAVA CELL");
});
app.use(cookieParser()); // ✅ WAJIB!

// setelah semua app.use(route)
app.use(morgan("dev"));
app.use(
  cors({
    origin: "http://localhost:5173", // Sesuaikan dengan frontend kamu
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(bodyParser.json());

import authRoutes from "./routes/authRoutes.js";
import aksesorisRoutes from "./routes/aksesorisRoutes.js";
import sparepartRoutes from "./routes/sparepartRoutes.js";
import voucherRoutes from "./routes/voucherRoutes.js";
import downlineRoutes from "./routes/downlineRoutes.js";
import serviceRoutes from "./routes/serviceHPRoutes.js";
import uangModalRoutes from "./routes/uangModalRoutes.js";
import pageRoutes from "./routes/pageRoutes.js";
import transaksiSparepart from "./routes/transaksiSparepartRoutes .js";

import transaksiAksesoris from "./routes/transaksiAksesorisRoutes.js";
import transaksiVoucher from "./routes/transaksiVoucherRoutes.js";
import jualanHarian from "./routes/jualanRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";

app.use("/api/v1", authRoutes);
app.use("/api/v1", aksesorisRoutes);
app.use("/api/v1", voucherRoutes);
app.use("/api/v1", downlineRoutes);
app.use("/api/v1", serviceRoutes);
app.use("/api/v1", sparepartRoutes);
app.use("/api/v1", uangModalRoutes);
app.use("/api/v1", pageRoutes);

app.use("/api/v1", transaksiVoucher);
app.use("/api/v1", transaksiAksesoris);
app.use("/api/v1", transaksiSparepart);
app.use("/api/v1", jualanHarian);
app.use("/api/v1", memberRoutes);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
