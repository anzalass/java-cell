// src/controllers/transaksiVoucherController.js
import {
  createJualan,
  deleteTransaksiVoucher,
  getJualanVoucherHarian,
  getAllTransaksiVoucher,
  getLaporanVoucherTerlaris,
} from "../service/jualanVoucherService.js";

// POST /api/transaksi-voucher
export const createTransaksi = async (req, res) => {
  try {
    const { idVoucher } = req.params;
    if (!idVoucher) {
      return res.status(400).json({
        success: false,
        message: "idVoucher wajib diisi",
      });
    }
    await createJualan(idVoucher);
    res.status(201).json({
      success: true,
      message: "Transaksi berhasil dibuat",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE /api/transaksi-voucher/:id
export const deleteTransaksi = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteTransaksiVoucher(id);
    res.json({
      success: true,
      message: result.message,
      data: { restoredStok: result.restoredStok },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/transaksi-voucher/harian
export const getTransaksiHarian = async (req, res) => {
  try {
    const data = await getJualanVoucherHarian();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/transaksi-voucher
export const getAllTransaksi = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      periode = "semua",
      startDate,
      endDate,
      search,
      brand,
    } = req.query;

    const data = await getAllTransaksiVoucher({
      page: Number(page),
      pageSize: Number(pageSize),
      periode,
      startDate,
      endDate,
      search,
      brand,
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/laporan/voucher-terlaris
export const getVoucherTerlaris = async (req, res) => {
  try {
    const {
      periode = "semua",
      startDate,
      endDate,
      search,
      brand,
      page,
      pageSize,
    } = req.query;
    const data = await getLaporanVoucherTerlaris({
      periode,
      startDate,
      endDate,
      search,
      brand,
      page,
      pageSize,
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
