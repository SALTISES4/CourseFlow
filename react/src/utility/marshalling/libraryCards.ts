import { LibraryObjectType, WorkflowType } from '@cf/types/enum'
import * as Utility from '@cf/utility/utilityFunctions'
import { ELibraryObject } from '@XMLHTTP/types/entity'
import {
  CHIP_TYPE,
  WorkflowCardChipType
} from '@cfCommonComponents/cards/WorkflowCardDumb'
import { WorkflowCardWrapperPropsType } from '@cfCommonComponents/cards/WorkflowCardWrapper'
import { _t, convertEnum } from '@cf/utility/utilityFunctions'

/**
 * this thin wrapper is for when we move CHIP_TYPE away from the domain
 * @param type
 */
function mapChipType(type: LibraryObjectType): CHIP_TYPE {
  return convertEnum<CHIP_TYPE>(type, CHIP_TYPE, CHIP_TYPE.DEFAULT)
}

function getTypeChip(workflow: ELibraryObject): WorkflowCardChipType {
  const { type, is_strategy } = workflow
  let typeText = _t(type)

  if (type === LibraryObjectType.LIVE_PROJECT) {
    typeText = _t('classroom')
  }

  if (is_strategy) {
    typeText += ` ${_t('strategy')}`
  }

  const chipType = mapChipType(type)

  return {
    type: chipType,
    label: Utility.capWords(typeText)
  }
}

function getTemplateChip(workflow: ELibraryObject): WorkflowCardChipType {
  const is_template = workflow.is_template
  if (is_template)
    return {
      type: CHIP_TYPE.TEMPLATE,
      label: _t('Template')
    }
  return null
}

function getWorkflowCountChip(workflow: ELibraryObject): WorkflowCardChipType {
  if (
    workflow.type === LibraryObjectType.PROJECT &&
    workflow.workflow_count !== null &&
    workflow.workflow_count > 0
  ) {
    return {
      type: CHIP_TYPE.DEFAULT,
      label: `${workflow.workflow_count} ${_t(
        `workflow` + (workflow.workflow_count > 1 ? 's' : '')
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
  const type_chip = getTypeChip(libraryObject)
  const template_chip = getTemplateChip(libraryObject)
  const count_chip = getWorkflowCountChip(libraryObject)
  return {
    id: libraryObject.id,
    title: libraryObject.title,
    description:
      libraryObject.author && `${_t('Owned by')} ${libraryObject.author}`,
    isFavourite: libraryObject.favourite,
    isLinked: libraryObject.is_linked,
    type: libraryObject.type,
    chips: [type_chip, template_chip, count_chip].filter(
      (entry) => entry != null
    )
  }
}
