import type { TFunction } from 'i18next'

const channelLabelKeys = {
  activity_out_of_class_instructor:
    'systemLabels.channel.activity_out_of_class_instructor',
  activity_out_of_class_students:
    'systemLabels.channel.activity_out_of_class_students',
  activity_in_class_instructor:
    'systemLabels.channel.activity_in_class_instructor',
  activity_in_class_students:
    'systemLabels.channel.activity_in_class_students',
  course_preparation: 'systemLabels.channel.course_preparation',
  course_lesson: 'systemLabels.channel.course_lesson',
  course_artifact: 'systemLabels.channel.course_artifact',
  course_assessment: 'systemLabels.channel.course_assessment',
  custom_node_category: 'systemLabels.channel.custom_node_category'
} as const

type SystemTitle = {
  title: string
  titleCopyCount?: number | null
  systemLabelCode?: string | null
}

export function displaySystemTitle(
  t: TFunction<'workflow'>,
  entity: SystemTitle,
  fallback: string
): string {
  let title = entity.title.trim() ? entity.title : fallback
  const code = entity.systemLabelCode

  if (code && code in channelLabelKeys) {
    title = t(channelLabelKeys[code as keyof typeof channelLabelKeys])
  } else if (code && import.meta.env.DEV) {
    console.error(`Missing system channel label translation for code: ${code}`)
  }

  const copyCount = Math.max(0, entity.titleCopyCount ?? 0)
  if (copyCount === 1) {
    return t('systemLabels.copy', { title })
  }
  if (copyCount > 1) {
    return t('systemLabels.copyNumbered', { title, count: copyCount })
  }
  return title
}
