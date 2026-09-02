import type { TFunction } from 'i18next'

/** FR-WF-EN-008 / FR-WF-EN-010 / FR-WF-EN-011 action button when a link exists or not. */
export function linkWorkflowActionLabel(
  parentWorkflowType: string | null | undefined,
  hasLinkedWorkflow: boolean,
  t: TFunction<'workflow'>
): string {
  const keys = {
    program: hasLinkedWorkflow
      ? 'linkAction.removeCourse'
      : 'linkAction.linkCourse',
    course: hasLinkedWorkflow
      ? 'linkAction.removeActivity'
      : 'linkAction.linkActivity',
    workflow: hasLinkedWorkflow
      ? 'linkAction.removeWorkflow'
      : 'linkAction.linkWorkflow'
  } as const
  const type = parentWorkflowType === 'program' || parentWorkflowType === 'course'
    ? parentWorkflowType
    : 'workflow'
  return t(keys[type])
}

export function canLinkWorkflow(
  parentWorkflowType: string | null | undefined
): boolean {
  return parentWorkflowType === 'course' || parentWorkflowType === 'program'
}

/** Canvas / form title when persisted title is empty (FR-WF-EN-007). */
export const nodeTitleFallback = (fallback: string): string => fallback
