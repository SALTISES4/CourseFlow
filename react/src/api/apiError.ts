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

export type ApiErrorDescriptor = {
  code: string
  params?: Record<string, unknown>
}

export type ExpectedApiErrorBody = ApiErrorDescriptor & {
  fieldErrors?: Record<string, ApiErrorDescriptor>
}

export function getApiErrorBody(error: unknown): ExpectedApiErrorBody | null {
  const body = error instanceof CourseFlowApiError ? error.body : error
  if (
    typeof body !== 'object' ||
    body === null ||
    !('code' in body) ||
    typeof body.code !== 'string'
  ) {
    return null
  }
  return body as ExpectedApiErrorBody
}

export function getApiErrorCode(error: unknown): string | undefined {
  return getApiErrorBody(error)?.code
}

export function getApiFieldError(
  error: unknown,
  field: string
): ApiErrorDescriptor | undefined {
  return getApiErrorBody(error)?.fieldErrors?.[field]
}

export function getApiErrorStatus(error: unknown): number | undefined {
  return error instanceof CourseFlowApiError ? error.status : undefined
}

export function isArchivedApiError(error: unknown): boolean {
  return ['project_archived', 'workflow_archived'].includes(
    getApiErrorCode(error) ?? ''
  )
}
