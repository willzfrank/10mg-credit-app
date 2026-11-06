class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not found') {
    super(404, message)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message)
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Conflict') {
    super(409, message)
    this.name = 'ConflictError'
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation failed') {
    super(422, message)
    this.name = 'ValidationError'
  }
}
