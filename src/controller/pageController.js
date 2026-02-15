import {
  cariAksesoris,
  cariSparepart,
  cariVoucher,
  dashboardPageService,
  dashboardPageService2,
  grosirVoucherPageService,
  serviceHPPageService,
  transaksiAksesorisPageService,
  transaksiSparepartPageService,
} from "../service/pageService.js";

export const dashboardAdminPageController = async (req, res, next) => {
  try {
    const result = await dashboardPageService();
    return res
      .status(201)
      .json({ message: "Berhasil Mendapatkan Data", result });
  } catch (error) {
    next(
      error instanceof Error ? error : new AppError("Gagal membuat downline")
    );
  }
};

export const grosirVoucherPageController = async (req, res, next) => {
  try {
    const result = await grosirVoucherPageService();
    return res
      .status(201)
      .json({ message: "Berhasil Mendapatkan Data", result });
  } catch (error) {
    next(
      error instanceof Error ? error : new AppError("Gagal membuat downline")
    );
  }
};

export const transaksiAksesorisPageController = async (req, res, next) => {
  try {
    const result = await transaksiAksesorisPageService();
    return res
      .status(201)
      .json({ message: "Berhasil Mendapatkan Data", result });
  } catch (error) {
    next(
      error instanceof Error ? error : new AppError("Gagal membuat downline")
    );
  }
};

export const transaksiSparepartAdminPageController = async (req, res, next) => {
  try {
    const result = await transaksiSparepartPageService();
    return res
      .status(201)
      .json({ message: "Berhasil Mendapatkan Data", result });
  } catch (error) {
    next(
      error instanceof Error ? error : new AppError("Gagal membuat downline")
    );
  }
};

export const serviceHPAdminPageController = async (req, res, next) => {
  try {
    const result = await serviceHPPageService();
    return res
      .status(201)
      .json({ message: "Berhasil Mendapatkan Data", result });
  } catch (error) {
    next(
      error instanceof Error ? error : new AppError("Gagal membuat downline")
    );
  }
};

/**
 * Controller: Ambil data dashboard dengan pagination & search
 */
export const getDashboardData = async (req, res) => {
  try {
    // ✅ Pastikan user sudah terotentikasi (dari middleware)
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ✅ Ambil semua query params dari request
    const {
      // Transaksi Voucher
      pageVoucher,
      limitVoucher,

      // Transaksi Aksesoris
      pageAccTrx,
      limitAccTrx,

      // Transaksi Service HP
      pageService,
      limitService,

      // Transaksi Sparepart (jual beli)
      pageSparepartTrx,
      limitSparepartTrx,

      // Stok
      pageAccStok,
      limitAccStok,

      pageSparepartStok,
      limitSparepartStok,

      pageVdStok,
      limitVdStok,

      // Search stok
      searchAccStok,
      searchSparepartStok,
      searchVdStok,
    } = req.query;

    // ✅ Parse ke number & beri nilai default
    const options = {
      // Transaksi
      pageVoucher: pageVoucher ? parseInt(pageVoucher, 10) : 1,
      limitVoucher: limitVoucher ? Math.min(parseInt(limitVoucher, 10), 50) : 5,

      pageAccTrx: pageAccTrx ? parseInt(pageAccTrx, 10) : 1,
      limitAccTrx: limitAccTrx ? Math.min(parseInt(limitAccTrx, 10), 50) : 5,

      pageService: pageService ? parseInt(pageService, 10) : 1,
      limitService: limitService ? Math.min(parseInt(limitService, 10), 50) : 5,

      pageSparepartTrx: pageSparepartTrx ? parseInt(pageSparepartTrx, 10) : 1,
      limitSparepartTrx: limitSparepartTrx
        ? Math.min(parseInt(limitSparepartTrx, 10), 50)
        : 5,

      // Stok
      pageAccStok: pageAccStok ? parseInt(pageAccStok, 10) : 1,
      limitAccStok: limitAccStok ? Math.min(parseInt(limitAccStok, 10), 50) : 5,

      pageSparepartStok: pageSparepartStok
        ? parseInt(pageSparepartStok, 10)
        : 1,
      limitSparepartStok: limitSparepartStok
        ? Math.min(parseInt(limitSparepartStok, 10), 50)
        : 5,

      pageVdStok: pageVdStok ? parseInt(pageVdStok, 10) : 1,
      limitVdStok: limitVdStok ? Math.min(parseInt(limitVdStok, 10), 50) : 5,

      // Search
      searchAccStok: searchAccStok || "",
      searchSparepartStok: searchSparepartStok || "",
      searchVdStok: searchVdStok || "",
    };

    // ✅ Panggil service
    const data = await dashboardPageService2(user, options);

    // ✅ Kirim respons sukses
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Dashboard controller error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Gagal memuat data dashboard",
    });
  }
};

export const cariSparepartController = async (req, res) => {
  try {
    const { q = "" } = req.query;

    const data = await cariSparepart(q);

    return res.status(200).json({
      success: true,
      message: "Berhasil mencari sparepart",
      data,
    });
  } catch (error) {
    console.error("cariSparepartController:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mencari sparepart",
    });
  }
};

/**
 * 🔍 Cari Voucher
 * GET /api/v1/search/voucher?q=xl
 */
export const cariVoucherController = async (req, res) => {
  try {
    const { q = "" } = req.query;

    const data = await cariVoucher(q);

    return res.status(200).json({
      success: true,
      message: "Berhasil mencari voucher",
      data,
    });
  } catch (error) {
    console.error("cariVoucherController:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mencari voucher",
    });
  }
};

/**
 * 🔍 Cari Aksesoris
 * GET /api/v1/search/aksesoris?q=charger
 */
export const cariAksesorisController = async (req, res) => {
  try {
    const { q = "" } = req.query;

    const data = await cariAksesoris(q);

    return res.status(200).json({
      success: true,
      message: "Berhasil mencari aksesoris",
      data,
    });
  } catch (error) {
    console.error("cariAksesorisController:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mencari aksesoris",
    });
  }
};
