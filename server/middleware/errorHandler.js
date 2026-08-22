import { AppError } from "../utils/errors.js";

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    return res.status(422).json({
      error: { code: "VALIDATION_ERROR", message: err.message },
    });
  }

  // Duplicate key (e.g. room code collision, unique index violations)
  if (err.code === 11000) {
    return res.status(409).json({
      error: { code: "DUPLICATE", message: "Resource already exists" },
    });
  }

  // Never leak internal error details to the client.
  console.error("Unhandled error:", err);
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Endpoint not found" },
  });
}
