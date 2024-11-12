import { LibraryObjectType } from '@cf/types/enum'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import Utility, { _t } from '@cf/utility/Utility.class'
import {
  ChipOptions,
  WorkflowCardChipType
} from '@cfComponents/cards/WorkflowCardDumb'
import { WorkflowCardWrapperPropsType } from '@cfComponents/cards/WorkflowCardWrapper'
import { ELibraryObject } from '@XMLHTTP/types/entity'

/**
 * this thin wrapper is for when we move CHIP_TYPE away from the domain
 * @param type
 */
function mapChipType(type: LibraryObjectType): ChipOptions {
  return Utility.convertEnum<ChipOptions>(
    type,
    ChipOptions,
    ChipOptions.DEFAULT
  )
}

function getTypeChip(workflow: ELibraryObject): WorkflowCardChipType {
  const { type, isStrategy } = workflow
  let typeText = _t(type)

  // no
  // if (type === LibraryObjectType.LIVE_PROJECT) {
  //   typeText = _t('classroom')
  // }

  if (isStrategy) {
    typeText += ` ${_t('strategy')}`
  }

  const chipType = mapChipType(type)

  return {
    type: chipType,
    label: ThemeHelper.capWords(typeText)
  }
}

function getTemplateChip(workflow: ELibraryObject): WorkflowCardChipType {
  const isTemplate = workflow.isTemplate
  if (isTemplate) {
    return {
      type: ChipOptions.TEMPLATE,
      label: _t('Template')
    }
  }
  return null
}

function getWorkflowCountChip(workflow: ELibraryObject): WorkflowCardChipType {
  if (
    workflow.type === LibraryObjectType.PROJECT &&
    workflow.workflowCount !== null &&
    workflow.workflowCount > 0
  ) {
    return {
      type: ChipOptions.DEFAULT,
      label: `${workflow.workflowCount} ${_t(
        `workflow` + (workflow.workflowCount > 1 ? 's' : '')
      )}`
    }
  }
  return null
}

export function formatLibraryObjects(data: ELibraryObject[]) {
  return data.map((item: ELibraryObject) => {
    return formatLibraryObject(item)
  })
}

export function formatLibraryObject(
  libraryObject: ELibraryObject
): Pick<
  WorkflowCardWrapperPropsType,
  'id' | 'title' | 'description' | 'isFavourite' | 'chips' | 'isLinked' | 'type'
> {
  const typeChip = getTypeChip(libraryObject)
  const templateChip = getTemplateChip(libraryObject)
  const countChip = getWorkflowCountChip(libraryObject)
  return {
    id: libraryObject.id,
    title: libraryObject.title,
    description:
      libraryObject.author && `${_t('Owned by')} ${libraryObject.author.name}`,
    isFavourite: libraryObject.favourite,
    isLinked: libraryObject.isLinked,
    type: libraryObject.type,
    chips: [typeChip, templateChip, countChip].filter((entry) => entry != null)
  }
}
