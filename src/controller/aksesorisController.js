// GET /api/spareparts

import {
  getAllAcc,
  createAcc,
  deleteAcc,
  updateAcc,
  updateAccStok,
  getAccById,
  aksesorisMaster,
} from "../service/aksesorisService.js";

export const getAllAccHandler = async (req, res) => {
  try {
    const result = await getAllAcc(req.query);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// POST /api/spareparts
export const createAccHandler = async (req, res) => {
  try {
    const acc = await createAcc(req.body, req.user);
    res.status(201).json(acc);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// GET /api/spareparts/:id
export const getAccHandler = async (req, res) => {
  try {
    const sparePart = await getAccById(req.params.id);
    res.json(sparePart);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

// PUT /api/spareparts/:id
export const updateAccHandler = async (req, res) => {
  try {
    const sparePart = await updateAcc(req.params.id, req.body, req.user);
    res.json(sparePart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE /api/spareparts/:id
export const deleteAccHandler = async (req, res) => {
  try {
    await deleteAcc(req.params.id, req.user);
    res.status(204).end(); // No Content
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateStokAccHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipe, stok } = req.body;
    console.log("tp", tipe);

    // Validasi dasar
    if (!id) {
      return res.status(400).json({ error: "ID tidak ditemukan di URL" });
    }
    if (!tipe || stok === undefined) {
      return res
        .status(400)
        .json({ error: "Body harus berisi 'tipe' dan 'stok'" });
    }

    const stokNum = Number(stok);
    if (isNaN(stokNum)) {
      return res.status(400).json({ error: "Stok harus berupa angka" });
    }

    const updated = await updateAccStok(
      id,
      {
        tipe,
        stok: stokNum,
      },
      req.user
    );

    res.json(updated);
  } catch (error) {
    console.error("Update stok error:", error);
    res.status(400).json({ error: error.message });
  }
};

export const getAccMaster = async (req, res) => {
  try {
    const data = await aksesorisMaster();
    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
