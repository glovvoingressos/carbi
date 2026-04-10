export interface ApiEnvelope<T = unknown> {
  success: boolean
  data: T | null
  error: string | null
  meta?: Record<string, unknown>
}

export function successResponse<T>(data: T, meta?: Record<string, unknown>): ApiEnvelope<T> {
  return { success: true, data, error: null, meta }
}

export function errorResponse(error: string, meta?: Record<string, unknown>): ApiEnvelope<null> {
  return { success: false, data: null, error, meta }
}
