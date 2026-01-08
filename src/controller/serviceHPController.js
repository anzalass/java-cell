// src/handlers/serviceHP.handler.js
import {
  createServiceHP,
  updateServiceHPStatus,
  deleteServiceHP,
  getAllServiceHP,
} from "../service/serviceHPService.js";

export const createServiceHPHandler = async (req, res) => {
  try {
    const {
      brandHP,
      keterangan,
      status,
      biayaJasa,
      sparePart,
      idMember,
      namaPelanggan,
    } = req.body;
    const penempatan = req.user.penempatan;
    const idUser = req.user.id;

    if (!brandHP || !keterangan || !status || biayaJasa == null) {
      return res.status(400).json({ error: "Field wajib tidak lengkap" });
    }

    const result = await createServiceHP({
      brandHP,
      keterangan,
      status,
      biayaJasa: Number(biayaJasa),
      sparePart,
      idMember,
      idUser,
      penempatan,
      namaPelanggan,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Create Service HP Error:", error);
    res.status(400).json({ error: error.message });
  }
};

// ✅ UPDATE STATUS
export const updateServiceHPStatusHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status wajib diisi" });
    }

    await updateServiceHPStatus(id, status);
    res.json({ success: true });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(400).json({ error: error.message });
  }
};

// ✅ DELETE
export const deleteServiceHPHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteServiceHP(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete Service Error:", error);
    res.status(400).json({ error: error.message });
  }
};

export const getAllServiceHPHandler = async (req, res) => {
  try {
    const { page, pageSize, search, status, startDate, endDate } = req.query;
    const result = await getAllServiceHP({
      page,
      pageSize,
      search,
      status,
      startDate,
      endDate,
    });
    res.json(result);
  } catch (error) {
    console.error("Get Service Error:", error);
    res.status(400).json({ error: error.message });
  }
};
