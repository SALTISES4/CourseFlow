export class CourseFlowApiError extends Error {
  readonly status: number | undefined
  readonly body: unknown

  constructor(status: number | undefined, body: unknown) {
    super(`CourseFlow API request failed${status ? ` (${status})` : ''}`)
    this.name = 'CourseFlowApiError'
    this.status = status
    this.body = body
  }
}

export function getApiErrorStatus(error: unknown): number | undefined {
  return error instanceof CourseFlowApiError ? error.status : undefined
}

export function isArchivedApiError(error: unknown): boolean {
  if (!(error instanceof CourseFlowApiError)) {
    return false
  }
  const detail =
    typeof error.body === 'object' &&
    error.body !== null &&
    'detail' in error.body
      ? String(error.body.detail)
      : String(error.body ?? '')
  return detail.toLowerCase().includes('archived')
}
