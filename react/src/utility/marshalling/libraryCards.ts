import { LibraryContentTypeOut, LibraryItemOut } from '@cf/api/gen'
import { LibraryObjectType } from '@cf/types/enum'
import Utility from '@cf/utility/Utility.class'
import {
  ChipOptions,
  WorkflowCardChipType
} from '@cfComponents/cards/WorkflowCardDumb'
import { WorkflowCardWrapperPropsType } from '@cfComponents/cards/WorkflowCardWrapper'
import type { TFunction } from 'i18next'

/**
 * this thin wrapper is for when we move CHIP_TYPE away from the domain
 */
function mapChipType(type: LibraryContentTypeOut): ChipOptions {
  return Utility.convertEnum<ChipOptions>(
    type,
    ChipOptions,
    ChipOptions.DEFAULT
  )
}

function getTypeChip(
  workflow: LibraryItemOut,
  t: TFunction<'library'>
): WorkflowCardChipType {
  const itemType = getLibraryItemType(workflow)
  const typeKey = {
    [LibraryObjectType.PROJECT]: 'cards.type.project',
    [LibraryObjectType.PROGRAM]: 'cards.type.program',
    [LibraryObjectType.COURSE]: 'cards.type.course',
    [LibraryObjectType.ACTIVITY]: 'cards.type.activity',
    [LibraryObjectType.TASK]: 'cards.type.task'
  }[itemType] as
    | 'cards.type.project'
    | 'cards.type.program'
    | 'cards.type.course'
    | 'cards.type.activity'
    | 'cards.type.task'
    | undefined
  let typeText = t(typeKey ?? 'cards.type.workflow')

  // TODO: figure out wheee this is coming from with the new v2 data
  const isStrategy = false

  if (isStrategy) {
    typeText += ` ${t('cards.strategy')}`
  }

  return {
    type: mapChipType(getLibraryItemType(workflow)),
    label: typeText
  }
}

function getTemplateChip(
  workflow: LibraryItemOut,
  t: TFunction<'library'>
): WorkflowCardChipType | null {
  const isTemplate = workflow.isTemplate
  if (isTemplate) {
    return {
      type: ChipOptions.TEMPLATE,
      label: t('cards.template')
    }
  }
  return null
}

function getWorkflowCountChip(
  workflow: LibraryItemOut,
  t: TFunction<'library'>
): WorkflowCardChipType | null {
  if (
    workflow.contentType === LibraryContentTypeOut.PROJECT &&
    workflow.workflowCount != null &&
    workflow.workflowCount > 0
  ) {
    return {
      type: ChipOptions.DEFAULT,
      label: t('cards.workflowCount', { count: workflow.workflowCount })
    }
  }
  return null
}

function getLibraryItemType(item: LibraryItemOut): LibraryContentTypeOut {
  const { contentType, label } = item

  if (contentType === LibraryContentTypeOut.PROJECT) {
    return LibraryContentTypeOut.PROJECT
  }

  const validTypes = {
    program: LibraryObjectType.PROGRAM,
    course: LibraryObjectType.COURSE,
    activity: LibraryObjectType.ACTIVITY,
    task: LibraryObjectType.TASK
  }

  return validTypes[label] ?? LibraryObjectType.COURSE
}

export function formatLibraryObjects(
  data: LibraryItemOut[],
  t: TFunction<'library'>
) {
  return data ? data.map((item) => formatLibraryObject(item, t)) : []
}

export function formatLibraryObject(
  libraryObject: LibraryItemOut,
  t: TFunction<'library'>
): Pick<
  WorkflowCardWrapperPropsType,
  | 'uuid'
  | 'title'
  | 'ownerName'
  | 'chips'
  | 'type'
  | 'isFavorite'
  | 'isLinked'
  | 'isArchived'
  | 'permissions'
  | 'projectUuid'
  | 'projectIsArchived'
> {
  const {
    uuid,
    title,
    ownerName,
    isFavorite,
    isArchived,
    permissions,
    projectUuid,
    projectIsArchived
  } = libraryObject

  const typeChip = getTypeChip(libraryObject, t)
  const templateChip = getTemplateChip(libraryObject, t)
  const countChip = getWorkflowCountChip(libraryObject, t)

  return {
    uuid,
    title,
    ownerName,
    isFavorite,
    isArchived,
    permissions,
    projectUuid,
    projectIsArchived,
    // TODO: figure out where this comes from
    // isLinked: libraryObject.isLinked,
    isLinked: false,
    type: getLibraryItemType(libraryObject),
    chips: [typeChip, templateChip, countChip].filter((entry) => entry != null)
  }
}
