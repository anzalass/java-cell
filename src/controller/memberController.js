// src/controllers/memberController.js
import {
  getAllMembers,
  getMembersWithFilter,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
} from "../service/memberService.js";

// ─── 1. GET /api/v1/members ───────────────────────────────────────────
export const getAllMembersHandler = async (req, res) => {
  try {
    const members = await getAllMembers();
    res.status(200).json({
      success: true,
      data: members,
      message: "Berhasil mengambil semua member",
    });
  } catch (error) {
    console.error("Error di getAllMembersHandler:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Terjadi kesalahan saat mengambil data",
    });
  }
};

// ─── 2. GET /api/v1/members/filter ────────────────────────────────────
export const getMembersWithFilterHandler = async (req, res) => {
  try {
    const {
      page,
      pageSize,
      search,
      sortBy,
      sortOrder,
      minTotalTransaksi,
      maxTotalTransaksi,
    } = req.query;

    const result = await getMembersWithFilter({
      page,
      pageSize,
      search,
      sortBy,
      sortOrder,
      minTotalTransaksi,
      maxTotalTransaksi,
    });

    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
      totalMember: result.totalMember,
      totalTrx: result.totalTransaksi._sum,
      message: "Berhasil mengambil member dengan filter",
    });
  } catch (error) {
    console.error("Error di getMembersWithFilterHandler:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Terjadi kesalahan saat mengambil data",
    });
  }
};

// ─── 3. GET /api/v1/members/:id ───────────────────────────────────────
export const getMemberByIdHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await getMemberById(id);
    res.status(200).json({
      success: true,
      data: member,
      message: "Berhasil mengambil member",
    });
  } catch (error) {
    console.error("Error di getMemberByIdHandler:", error);
    if (error.message === "Member tidak ditemukan") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Terjadi kesalahan",
    });
  }
};

// ─── 4. POST /api/v1/members ──────────────────────────────────────────
export const createMemberHandler = async (req, res) => {
  try {
    const { nama, noTelp, totalTransaksi } = req.body;

    if (!nama) {
      return res.status(400).json({
        success: false,
        message: "Nama wajib diisi",
      });
    }

    const newMember = await createMember({
      nama,
      noTelp,
      totalTransaksi: parseInt(totalTransaksi) || 0,
    });

    res.status(201).json({
      success: true,
      data: newMember,
      message: "Member berhasil ditambahkan",
    });
  } catch (error) {
    console.error("Error di createMemberHandler:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Gagal membuat member",
    });
  }
};

// ─── 5. PUT /api/v1/members/:id ───────────────────────────────────────
export const updateMemberHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, noTelp, totalTransaksi } = req.body;

    const updatedMember = await updateMember(id, {
      nama,
      noTelp,
      totalTransaksi:
        totalTransaksi !== undefined ? parseInt(totalTransaksi) : undefined,
    });

    res.status(200).json({
      success: true,
      data: updatedMember,
      message: "Member berhasil diperbarui",
    });
  } catch (error) {
    console.error("Error di updateMemberHandler:", error);
    if (error.message === "Member tidak ditemukan") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(400).json({
      success: false,
      message: error.message || "Gagal memperbarui member",
    });
  }
};

// ─── 6. DELETE /api/v1/members/:id ────────────────────────────────────
export const deleteMemberHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteMember(id);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error di deleteMemberHandler:", error);
    if (error.message === "Member tidak ditemukan") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(400).json({
      success: false,
      message: error.message || "Gagal menghapus member",
    });
  }
};
