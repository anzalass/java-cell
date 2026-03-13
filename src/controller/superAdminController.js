import {
  createToko,
  getAllToko,
  getDetailToko,
  updateToko,
  deleteToko,
  createUserServiceSuperAdmin,
  updateSubscribe,
  updateUserSuperAdmin,
  updatePassUserSuperAdmin,
} from "../service/superAdminService.js";
import memoryUpload from "../utils/multer.js";

/* CREATE */
export const create = async (req, res) => {
  memoryUpload.single("logoToko")(req, res, async (err) => {
    try {
      const data = await createToko(req.body, req.file);
      console.log(req.body);

      res.status(201).json({ success: true, data });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });
};

export const createUser = async (req, res) => {
  try {
    const data = await createUserServiceSuperAdmin(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/* GET ALL */
export const getAll = async (req, res) => {
  try {
    const data = await getAllToko(req.query);
    console.log(data);

    return res.json({ success: true, data: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET DETAIL */
export const getDetail = async (req, res) => {
  try {
    const data = await getDetailToko(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

/* UPDATE */
export const update = async (req, res) => {
  memoryUpload.single("logoToko")(req, res, async (err) => {
    try {
      const data = await updateToko(req.params.id, req.body, req.file);
      res.json({ success: true, data });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });
};

export const updateUser = async (req, res) => {
  try {
    const data = await updateUserSuperAdmin(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updatePasswordUser = async (req, res) => {
  try {
    const data = await updatePassUserSuperAdmin(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
/* DELETE (SOFT) */
export const remove = async (req, res) => {
  try {
    await deleteToko(req.params.id);
    res.json({ success: true, message: "Toko dinonaktifkan" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/* UPDATE SUBSCRIBE */
export const updateSub = async (req, res) => {
  try {
    const { type } = req.body;
    const data = await updateSubscribe(req.params.id, type);

    res.json({
      success: true,
      message: "Subscribe berhasil diperpanjang",
      data,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
