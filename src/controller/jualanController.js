// src/handlers/transaksiHarian.handler.js
import {
  createJualanHarian,
  createKejadianTakTerduga,
  deleteJualanHarian,
  deleteKejadianTakTerduga,
  getJualanHarianToday,
  getKejadianTakTerdugaToday,
  getLaporanKeuangan,
} from "../service/jualanService.js";

// ✅ CREATE Jualan Harian
export const createJualanHarianHandler = async (req, res) => {
  try {
    const { kategori, nominal, tanggal, idMember } = req.body;
    const penempatan = req.user.penempatan;
    const idUser = req.user.id;
    const result = await createJualanHarian({
      kategori,
      nominal,
      tanggal,
      penempatan,
      idMember,
      idUser,
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ✅ CREATE Kejadian Tak Terduga
export const createKejadianTakTerdugaHandler = async (req, res) => {
  try {
    const { keterangan, nominal, no_transaksi } = req.body;
    const penempatan = req.user.penempatan;
    const idUser = req.user.id;
    const result = await createKejadianTakTerduga({
      keterangan,
      nominal,
      no_transaksi,
      tanggal: new Date().toISOString(), // ambil tanggal sekarang
      penempatan,
      idUser,
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ✅ DELETE Jualan Harian
export const deleteJualanHarianHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteJualanHarian(id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ✅ DELETE Kejadian Tak Terduga
export const deleteKejadianTakTerdugaHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteKejadianTakTerduga(id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllTransaksiTodayHandler = async (req, res) => {
  try {
    const [jualan, kejadian] = await Promise.all([
      getJualanHarianToday(),
      getKejadianTakTerdugaToday(),
    ]);

    // Hitung total keuntungan
    const totalKeuntungan = jualan.reduce(
      (sum, item) => sum + Number(item.nominal),
      0
    );

    res.json({
      jualanHarian: jualan,
      kejadianTakTerduga: kejadian,
      totalKeuntungan,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getLaporanKeuanganHandler = async (req, res) => {
  try {
    const {
      page,
      page2,
      pageSize2,
      pageSize,
      filterPeriod,
      startDate,
      endDate,
      filterJenis,
      filterKategori,
    } = req.query;

    const result = await getLaporanKeuangan({
      page,
      page2,
      pageSize2,
      pageSize,
      filterPeriod,
      startDate,
      endDate,
      filterJenis,
      filterKategori,
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
