import {
  createSparePart,
  deleteSparePart,
  getSparePartById,
  getAllSpareParts,
  updateSparePart,
  updateSparePartStok,
  sparePartMaster,
} from "../service/sparepartService.js";
// GET /api/spareparts
export const getAllSparePartsHandler = async (req, res) => {
  try {
    const result = await getAllSpareParts(req.query);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// POST /api/spareparts
export const createSparePartHandler = async (req, res) => {
  try {
    const sparePart = await createSparePart(req.body, req.user);
    res.status(201).json(sparePart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// GET /api/spareparts/:id
export const getSparePartHandler = async (req, res) => {
  try {
    const sparePart = await getSparePartById(req.params.id);
    res.json(sparePart);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

// PUT /api/spareparts/:id
export const updateSparePartHandler = async (req, res) => {
  try {
    const sparePart = await updateSparePart(req.params.id, req.body);
    res.json(sparePart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE /api/spareparts/:id
export const deleteSparePartHandler = async (req, res) => {
  try {
    await deleteSparePart(req.params.id);
    res.status(204).end(); // No Content
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateSparePartStokHandler = async (req, res) => {
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

    const updated = await updateSparePartStok(id, {
      tipe,
      stok: stokNum,
    });

    res.json(updated);
  } catch (error) {
    console.error("Update stok error:", error);
    res.status(400).json({ error: error.message });
  }
};

export const getSparepartMaster = async (req, res) => {
  try {
    const data = await sparePartMaster();
    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
