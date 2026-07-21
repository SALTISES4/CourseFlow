import { CourseFlowApiError } from '@cf/api/apiError'

export function getErrorMessage(error: unknown): string {
  if (error instanceof CourseFlowApiError) {
    return `Server error: ${error.status}`
  }

  if (error instanceof Error) {
    return `Error: ${error.message}`
  }
  return 'An unknown error occurred'
}
