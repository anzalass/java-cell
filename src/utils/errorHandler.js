// src/middleware/errorHandler.js
export function errorHandler(err, req, res, next) {
  console.error(err); // optional: log error di console

  const statusCode =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    status: "error",
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
}
