export interface PaginatedResponse<T> {
  statusCode?: number
  data: T
  meta?: {
    total: number
    page: number
    perPage: number
    totalPages: number
  }
}
export interface SuccessResponse<T> {
  data: T
  statusCode?: number
  message?: string
}

export interface ErrorResponse {
  error: string | object
  statusCode?: number
}

/**
 * Standard success response for paginated results
 */
export function sendPaginatedResponse<T>(
  res: any, // Express Response type
  data: T,
  total: number,
  page: number,
  perPage: number,
  statusCode = 200,
  additionalData: { [key: string]: any } = {} // To allow counts,
) {
  const totalPages = Math.ceil(total / perPage)
  const responseBody: PaginatedResponse<T> = {
    statusCode,
    data,
    meta: {
      total,
      page,
      perPage,
      totalPages,
      ...additionalData, // Include any additional data like counts
    },
  }
  return res.status(statusCode).json(responseBody)
}

/**
 * Standard success response for non-paginated results
 */
export function sendSuccessResponse<T>(
  res: any, // Express Response type
  data: T,
  message = "Success",
  statusCode = 200
) {
  const responseBody: SuccessResponse<T> = {
    statusCode,
    data,
    message,
  }
  return res.status(statusCode).json(responseBody)
}
/**
 * Standard error response
 */
export function sendErrorResponse(
  res: any,
  errorMsg: string | object,
  statusCode = 500
) {
  const responseBody: ErrorResponse = {
    error: errorMsg,
    statusCode,
  }
  return res.status(statusCode).json(responseBody)
}
