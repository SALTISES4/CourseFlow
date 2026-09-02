import type { TFunction } from 'i18next'

type WorkflowTypeKey = 'program' | 'course' | 'activity' | 'task' | 'workflow'

function normalizeWorkflowType(value: string | null | undefined): WorkflowTypeKey {
  switch (value) {
    case 'program':
    case 'course':
    case 'activity':
    case 'task':
      return value
    default:
      return 'workflow'
  }
}

export function workflowTypeLabel(
  t: TFunction<'workflow'>,
  value: string | null | undefined,
  lower = false
): string {
  const type = normalizeWorkflowType(value)
  const suffix = lower ? 'Lower' : ''
  return t(`type.${type}${suffix}` as `type.${WorkflowTypeKey}${'' | 'Lower'}`)
}
