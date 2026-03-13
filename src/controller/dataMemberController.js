import {
  getAllDataMember,
  getDataMemberById,
  createDataMember,
  updateDataMember,
  deleteDataMember,
} from "../service/dataMemberService.js";

/* =========================
   GET ALL DATA MEMBER
========================= */
export const getAllDataMemberController = async (req, res) => {
  try {
    const { page, pageSize, search } = req.query;

    const result = await getAllDataMember({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
      search: search || "",
      idToko: req.user.toko_id,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error getAllDataMemberController:", error);

    res.status(500).json({
      message: error.message || "Gagal mengambil data member",
    });
  }
};

/* =========================
   GET DATA MEMBER BY ID
========================= */
export const getDataMemberByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getDataMemberById(id);

    if (!result) {
      return res.status(404).json({
        message: "Data member tidak ditemukan",
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error getDataMemberByIdController:", error);

    res.status(500).json({
      message: error.message || "Gagal mengambil data member",
    });
  }
};

/* =========================
   CREATE DATA MEMBER
========================= */
export const createDataMemberController = async (req, res) => {
  try {
    const result = await createDataMember(req.body, req.user);

    res.status(201).json({
      message: "Data member berhasil dibuat",
      data: result,
    });
  } catch (error) {
    console.error("Error createDataMemberController:", error);

    res.status(500).json({
      message: error.message || "Gagal membuat data member",
    });
  }
};

/* =========================
   UPDATE DATA MEMBER
========================= */
export const updateDataMemberController = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await updateDataMember(id, req.body, req.user);

    res.status(200).json({
      message: "Data member berhasil diupdate",
      data: result,
    });
  } catch (error) {
    console.error("Error updateDataMemberController:", error);

    res.status(500).json({
      message: error.message || "Gagal mengupdate data member",
    });
  }
};

/* =========================
   DELETE DATA MEMBER
========================= */
export const deleteDataMemberController = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteDataMember(id, req.user);

    res.status(200).json({
      message: "Data member berhasil dihapus",
      data: result,
    });
  } catch (error) {
    console.error("Error deleteDataMemberController:", error);

    res.status(500).json({
      message: error.message || "Gagal menghapus data member",
    });
  }
};
