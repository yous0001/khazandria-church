export class HttpError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = "HttpError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export const createHttpError = (
  statusCode: number,
  message: string,
  details?: any
): HttpError => {
  return new HttpError(statusCode, message, details);
};
