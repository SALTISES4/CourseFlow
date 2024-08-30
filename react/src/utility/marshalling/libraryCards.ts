import { LibraryObjectType, WorkflowType } from '@cf/types/enum'
import * as Utility from '@cf/utility/utilityFunctions'
import { ELibraryObject } from '@XMLHTTP/types/entity'
import {
  CHIP_TYPE,
  PropsType,
  WorkflowCardChipType
} from '@cfCommonComponents/cards/WorkflowCardDumb'
import { _t } from '@cf/utility/utilityFunctions'

function getTypeChip(workflow: ELibraryObject): WorkflowCardChipType {
  const { type, is_strategy } = workflow
  let typeText = _t(type)

  if (type === LibraryObjectType.LIVE_PROJECT) {
    typeText = _t('classroom')
  }

  if (is_strategy) {
    typeText += ` ${_t('strategy')}`
  }

  const chipType =
    type === LibraryObjectType.LIVE_PROJECT ? CHIP_TYPE.DEFAULT : type

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

export function formatLibraryObject(workflow: ELibraryObject): PropsType {
  const type_chip = getTypeChip(workflow)
  const template_chip = getTemplateChip(workflow)
  const count_chip = getWorkflowCountChip(workflow)
  return {
    id: workflow.id,
    title: workflow.title,
    description: `Owned by ${workflow.author}`,
    isFavourite: workflow.favourite,
    chips: [type_chip, template_chip, count_chip].filter(
      (entry) => entry != null
    )
  }
}
