class AppError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code || 'APP_ERROR';
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
