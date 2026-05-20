import { _t } from '@cf/utility/Utility.class'

/** FR-WF-NODE-001 / FR-WF-EN-010 link indicator copy by parent workflow type. */
export function linkedWorkflowIndicatorLabel(
  parentWorkflowType: string | null | undefined
): string {
  if (parentWorkflowType === 'program') {
    return _t('Linked course')
  }
  if (parentWorkflowType === 'course') {
    return _t('Linked activity')
  }
  return _t('Linked workflow')
}

/** FR-WF-EN-008 / FR-WF-EN-010 / FR-WF-EN-011 action button when a link exists or not. */
export function linkWorkflowActionLabel(
  parentWorkflowType: string | null | undefined,
  hasLinkedWorkflow: boolean
): string {
  if (hasLinkedWorkflow) {
    if (parentWorkflowType === 'program') {
      return _t('Remove linked course')
    }
    if (parentWorkflowType === 'course') {
      return _t('Remove linked activity')
    }
    return _t('Remove linked workflow')
  }
  return _t('Link workflow')
}

export function canLinkWorkflow(
  parentWorkflowType: string | null | undefined
): boolean {
  return parentWorkflowType === 'course' || parentWorkflowType === 'program'
}

/** Canvas / form title when persisted title is empty (FR-WF-EN-007). */
export function nodeTitleFallback(): string {
  return _t('Untitled node')
}
