export class AppError extends Error {
  constructor(message, statusCode = 400, code = "BAD_REQUEST") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const NotFoundError = (message = "Not found") =>
  new AppError(message, 404, "NOT_FOUND");

export const UnauthorizedError = (message = "Unauthorized") =>
  new AppError(message, 401, "UNAUTHORIZED");

export const ForbiddenError = (message = "Forbidden") =>
  new AppError(message, 403, "FORBIDDEN");

export const ValidationError = (message = "Invalid input") =>
  new AppError(message, 422, "VALIDATION_ERROR");

export const GoneError = (message = "This room has expired or ended") =>
  new AppError(message, 410, "GONE");

// Wraps async route handlers so thrown errors reach the error middleware
// instead of crashing the process or hanging the request.
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
