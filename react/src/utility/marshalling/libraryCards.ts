import { LibraryContentTypeOut, LibraryItemOut } from '@cf/api/gen'
import { LibraryObjectType } from '@cf/types/enum'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import Utility, { _t } from '@cf/utility/Utility.class'
import {
  ChipOptions,
  WorkflowCardChipType
} from '@cfComponents/cards/WorkflowCardDumb'
import { WorkflowCardWrapperPropsType } from '@cfComponents/cards/WorkflowCardWrapper'

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

function getTypeChip(workflow: LibraryItemOut): WorkflowCardChipType {
  const typeLabel = workflow.label
  let typeText = _t(typeLabel)

  // TODO: figure out wheee this is coming from with the new v2 data
  const isStrategy = false

  if (isStrategy) {
    typeText += ` ${_t('strategy')}`
  }

  return {
    type: mapChipType(getLibraryItemType(workflow)),
    label: ThemeHelper.capWords(typeText)
  }
}

function getTemplateChip(workflow: LibraryItemOut): WorkflowCardChipType {
  const isTemplate = workflow.isTemplate
  if (isTemplate) {
    return {
      type: ChipOptions.TEMPLATE,
      label: _t('Template')
    }
  }
  return null
}

function getWorkflowCountChip(workflow: LibraryItemOut): WorkflowCardChipType {
  // if (
  //   workflow.contentType === LibraryContentTypeOut.PROJECT &&
  //   workflow.workflowCount !== null &&
  //   workflow.workflowCount > 0
  // ) {
  //   return {
  //     type: ChipOptions.DEFAULT,
  //     label: `${workflow.workflowCount} ${_t(
  //       `workflow` + (workflow.workflowCount > 1 ? 's' : '')
  //     )}`
  //   }
  // }
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

export function formatLibraryObjects(data: LibraryItemOut[]) {
  return data ? data.map((item) => formatLibraryObject(item)) : []
}

export function formatLibraryObject(
  libraryObject: LibraryItemOut
): Pick<
  WorkflowCardWrapperPropsType,
  | 'uuid'
  | 'title'
  | 'description'
  | 'chips'
  | 'type'
  | 'isFavorite'
  | 'isLinked'
> {
  const { uuid, title, description, isFavorite } = libraryObject

  const typeChip = getTypeChip(libraryObject)
  const templateChip = getTemplateChip(libraryObject)
  const countChip = getWorkflowCountChip(libraryObject)

  return {
    uuid,
    title,
    description,
    isFavorite,
    // TODO: figure out where this comes from
    // isLinked: libraryObject.isLinked,
    isLinked: false,
    type: getLibraryItemType(libraryObject),
    chips: [typeChip, templateChip, countChip].filter((entry) => entry != null)
  }
}
