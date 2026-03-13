import {
  createTransaksiAksesoris,
  deleteTransaksiAksesoris,
  getAllTransaksiAksesoris,
  getDetailTransaksiAksesoris,
  getLaporanBarangKeluar,
} from "../service/transaksiAksesoris.js";

export const createTransaksiAksesorisHandler = async (req, res) => {
  try {
    const { items, nama, keuntungan, status, idMember } = req.body;
    const penempatan = req.user.penempatan;
    const idUser = req.user.id;
    const result = await createTransaksiAksesoris(
      {
        items,
        nama,
        keuntungan,
        status,
        idMember,
        penempatan,
        idUser,
      },
      req.user
    );
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const detailTransaksiAksesoris = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await getDetailTransaksiAksesoris(id, req.user);

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

export const getAllTransaksiAksesorisHandler = async (req, res) => {
  try {
    const {
      page,
      pageSize,
      search,
      startDate,
      endDate,
      status,
      deletedFilter,
    } = req.query;
    const idToko = req.user.toko_id;
    const result = await getAllTransaksiAksesoris({
      page,
      pageSize,
      search,
      startDate,
      endDate,
      status,
      idToko,
      deletedFilter,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteTransaksiAksesorisHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteTransaksiAksesoris(id, req.user);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// src/handlers/laporanBarangKeluar.handler.js

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
    } = req.query;

    const result = await getLaporanBarangKeluar(
      {
        page,
        pageSize,
        filterPeriod,
        startDate,
        endDate,
        searchNama,
        sortQty, // ✅ tambahkan ini
      },
      req.user
    );

    res.json(result);
  } catch (error) {
    console.error("Laporan Barang Keluar Error:", error);
    res.status(400).json({ error: error.message });
  }
};
