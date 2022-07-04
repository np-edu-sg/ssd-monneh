import { STATUS_CODES } from 'node:http'
import type { CompatibilityEvent } from 'h3'

export interface ApplicationError {
  statusCode: number
  message: string
}

export const ERROR_BAD_REQUEST: ApplicationError = {
  statusCode: 400,
  message: 'Please ensure your input fields are correct.',
}
export const ERROR_UNAUTHORIZED: ApplicationError = {
  statusCode: 403,
  message: 'Unauthorized',
}

export const ERROR_LOGIN_FAILED: ApplicationError = {
  statusCode: 403,
  message: 'We could not log you in. Please check your credentials.',
}

export const ERROR_EMAIL_CONFLICT: ApplicationError = {
  statusCode: 409,
  message: 'The email is already being used.',
}

export function createErrorResponse(event: CompatibilityEvent, error: ApplicationError, data?: unknown) {
  event.res.statusCode = error.statusCode
  event.res.statusMessage = STATUS_CODES[error.statusCode] ?? 'Internal server error'
  console.error(error)
  return {
    ...error,
    data,
  }
}
