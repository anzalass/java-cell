// src/controllers/transaksiGrosirController.js
import {
  createGrosirOrder,
  deletePendingTransaksi,
  getAllTransaksiGrosir,
  getDetailTransaksiVoucherDownline,
  getLaporanBarangKeluar,
  updateTransaksiStatus,
} from "../service/transaksiVoucherService.js"; // Sesuaikan path

// POST /api/transaksi/grosir
export const createGrosirOrderHandler = async (req, res) => {
  try {
    const { kodeDownline, items, tanggal, keuntungan } = req.body;
    const penempatan = req.user.penempatan;
    const idUser = req.user.id;

    if (!kodeDownline) {
      return res.status(400).json({ error: "Kode downline wajib diisi" });
    }
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Items harus berupa array" });
    }

    const result = await createGrosirOrder({
      kodeDownline,
      items,
      tanggal,
      keuntungan,
      penempatan,
      idUser,
    });
    res.status(201).json(result);
  } catch (error) {
    console.error("Create grosir order error:", error);
    res.status(400).json({ error: error.message });
  }
};

export const createGrosirOrderHandler2 = async (req, res) => {
  try {
    const { kodeDownline, items, tanggal, keuntungan, penempatan } = req.body;

    if (!kodeDownline) {
      return res.status(400).json({ error: "Kode downline wajib diisi" });
    }
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Items harus berupa array" });
    }

    const result = await createGrosirOrder({
      kodeDownline,
      items,
      tanggal,
      keuntungan,
      penempatan,
      status: "Pending",
    });
    res.status(201).json(result);
  } catch (error) {
    console.error("Create grosir order error:", error);
    res.status(400).json({ error: error.message });
  }
};

// GET /api/transaksi/grosir
export const getAllTransaksiGrosirHandler = async (req, res) => {
  try {
    const { page, pageSize, search, startDate, endDate } = req.query;
    const result = await getAllTransaksiGrosir({
      page,
      pageSize,
      search,
      startDate,
      endDate,
    });
    res.json(result);
  } catch (error) {
    console.error("Get all transaksi error:", error);
    res.status(400).json({ error: error.message });
  }
};

export const detailTransaksiVoucherDownline = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await getDetailTransaksiVoucherDownline(id);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// PATCH /api/transaksi/grosir/:id/status
export const updateTransaksiStatusHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    console.log(status);

    if (!status) {
      return res.status(400).json({ error: "Status wajib diisi" });
    }

    await updateTransaksiStatus(id, status);
    res.json({ success: true });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(400).json({ error: error.message });
  }
};

// DELETE /api/transaksi/grosir/:id
export const deletePendingTransaksiHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await deletePendingTransaksi(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete transaksi error:", error);
    res.status(400).json({ error: error.message });
  }
};

export const getLaporanBarangKeluarHandler = async (req, res) => {
  try {
    const {
      page,
      pageSize,
      filterPeriod,
      startDate,
      endDate,
      searchNama,
      sortQty,
      brand,
    } = req.query;

    const result = await getLaporanBarangKeluar({
      page,
      pageSize,
      filterPeriod,
      startDate,
      endDate,
      searchNama,
      sortQty,
      brand,
    });

    res.json(result);
  } catch (error) {
    console.error("Laporan Barang Keluar Error:", error);
    res.status(400).json({ error: error.message });
  }
};
