import { getAllLogs } from "../service/logService.js";

export const getAllLogsHandler = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      search,
      kategori,
      nama,
      startDate,
      endDate,
      minNominal,
      maxNominal,
    } = req.query;

    const result = await getAllLogs({
      page,
      pageSize,
      search,
      kategori,
      nama,
      startDate,
      endDate,
      minNominal,
      maxNominal,
      idToko: req.user.toko_id, // 🔥 ambil dari user login
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("GET_LOGS_ERROR:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
