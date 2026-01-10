import {
  createVoucher,
  deleteVoucher,
  getVoucherById,
  getVouchers,
  updateStokVoucher,
  updateVoucher,
  voucherMaster,
} from "../service/voucherService.js";

// POST /api/vouchers
export const createVoucherHandler = async (req, res) => {
  try {
    console.log("usrr", req.user);

    const result = await createVoucher(req.body, req.user);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// GET /api/vouchers
export const getVouchersHandler = async (req, res) => {
  try {
    const { page, pageSize, search, sortBy, sortOrder, createdAt, brand } =
      req.query;
    const result = await getVouchers({
      page,
      pageSize,
      search,
      sortBy,
      brand,
      sortOrder,
      createdAt,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// GET /api/vouchers/:id
export const getVoucherByIdHandler = async (req, res) => {
  try {
    const voucher = await getVoucherById(req.params.id);
    res.json(voucher);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

// PUT /api/vouchers/:id
export const updateVoucherHandler = async (req, res) => {
  try {
    const result = await updateVoucher(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE /api/vouchers/:id
export const deleteVoucherHandler = async (req, res) => {
  try {
    const result = await deleteVoucher(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// PATCH /api/vouchers/:id/stok
export const updateStokVoucherHandler = async (req, res) => {
  try {
    const { tipe, stok } = req.body;
    if (!tipe || stok === undefined) {
      return res
        .status(400)
        .json({ error: "Body harus berisi 'tipe' dan 'stok'" });
    }

    const result = await updateStokVoucher(
      req.params.id,
      { tipe, stok },
      req.user
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getVoucherMaster = async (req, res) => {
  try {
    const data = await voucherMaster();
    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
