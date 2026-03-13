import {
  createTransaksiSparepart,
  deleteTransaksiSparepart,
  getAllTransaksiSparepart,
  getDetailTransaksiSparepart,
  getLaporanBarangKeluar,
} from "../service/transaksiSparepart.js";

export const createTransaksiSparepartHandler = async (req, res) => {
  try {
    const { items, nama, keuntungan, status, idMember } = req.body;
    const penempatan = req.user.penempatan;
    const idUser = req.user.id;
    const result = await createTransaksiSparepart(
      {
        items,
        nama,
        keuntungan,
        status,
        penempatan,
        idUser,
        idMember,
      },
      req.user
    );
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const detailTransaksiSparepartController = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await getDetailTransaksiSparepart(id, req.user);

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

export const getAllTransaksiSparepartHandler = async (req, res) => {
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
    const result = await getAllTransaksiSparepart({
      page,
      pageSize,
      search,
      startDate,
      endDate,
      status,
      idToko: req.user.toko_id,
      deletedFilter,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteTransaksiSparepartHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteTransaksiSparepart(id, req.user);
    res.json({ success: true });
  } catch (error) {
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
    } = req.query;

    const result = await getLaporanBarangKeluar({
      page,
      pageSize,
      filterPeriod,
      startDate,
      endDate,
      searchNama,
      sortQty,
      idToko: req.user.toko_id,
    });

    res.json(result);
  } catch (error) {
    console.error("Laporan Barang Keluar Error:", error);
    res.status(400).json({ error: error.message });
  }
};
