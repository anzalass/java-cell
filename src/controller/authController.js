import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  login,
} from "../service/authService.js";

// GET /api/users
export const getAllUsersHandler = async (req, res) => {
  try {
    const { page, pageSize, search, role, penempatan } = req.query;
    const result = await getAllUsers({
      page,
      pageSize,
      search,
      role,
      penempatan,
    });
    res.json(result);
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(400).json({ error: error.message });
  }
};

// GET /api/users/:id
export const getUserByIdHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

// POST /api/users
export const createUserHandler = async (req, res) => {
  try {
    const { nama, email, password, role, penempatan } = req.body;
    const user = await createUser({ nama, email, password, role, penempatan });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// PUT /api/users/:id
export const updateUserHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, email, password, role, penempatan } = req.body;
    const user = await updateUser(id, {
      nama,
      email,
      password,
      role,
      penempatan,
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE /api/users/:id
export const deleteUserHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteUser(id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const loginController2 = async (req, res) => {
  try {
    const result = await login(req.body);

    // Simpan token di cookie (HTTP-only)
    // res.cookie("auth_token", result.token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // ✅
    //   maxAge: 3 * 24 * 60 * 60 * 1000,
    // });

    res.cookie("auth_token", result.token, {
      httpOnly: true,
      secure: true, // WAJIB karena HTTPS
      sameSite: "none", // ✅ WAJIB cross-site
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login berhasil",
      success: true,
      user: {
        id: result.id,
        nama: result.nama,
        token: result.token,
        exp: result.expiresIn,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

// handlers/auth.handler.js
export const logoutHandler = async (req, res) => {
  try {
    // Hapus cookie di client
    // res.clearCookie("auth_token", {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    // });

    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none", // 🔥 HARUS SAMA
    });

    return res.status(200).json({
      message: "Logout berhasil",
      success: true,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Gagal logout",
      success: false,
    });
  }
};
