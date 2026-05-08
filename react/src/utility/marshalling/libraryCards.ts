import { LibraryItemOut } from '@cf/api/gen'
import { LibraryObjectType } from '@cf/types/enum'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import Utility, { _t } from '@cf/utility/Utility.class'
import {
  ChipOptions,
  WorkflowCardChipType
} from '@cfComponents/cards/WorkflowCardDumb'
import { WorkflowCardWrapperPropsType } from '@cfComponents/cards/WorkflowCardWrapper'

import { mapObjectTypeToLibraryObjectType } from './libraryV2Search'

type LibraryItemOutTyped = LibraryItemOut & {
  uuid: string
  contentType: 'project' | 'workflow'
  label: string
}

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

function getTypeChip(workflow: LibraryItemOutTyped): WorkflowCardChipType {
  const typeLabel = workflow.label
  let typeText = _t(typeLabel)

  // TODO: figure out wheee this is coming from with the new v2 data
  const isStrategy = false

  // no
  // if (type === LibraryObjectType.LIVE_PROJECT) {
  //   typeText = _t('classroom')
  // }

  if (isStrategy) {
    typeText += ` ${_t('strategy')}`
  }

  return {
    type: mapChipType(
      mapObjectTypeToLibraryObjectType(workflow.contentType, workflow.label)
    ),
    label: ThemeHelper.capWords(typeText)
  }
}

function getTemplateChip(workflow: LibraryItemOutTyped): WorkflowCardChipType {
  const isTemplate = workflow.isTemplate
  if (isTemplate) {
    return {
      type: ChipOptions.TEMPLATE,
      label: _t('Template')
    }
  }
  return null
}

function getWorkflowCountChip(
  workflow: LibraryItemOutTyped
): WorkflowCardChipType {
  // TODO:
  // if (
  //   workflow.objectType === LibraryObjectType.PROJECT &&
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

export function formatLibraryObjects(data: LibraryItemOut[]) {
  return data.map((item) => formatLibraryObject(item as LibraryItemOutTyped))
}

// TODO: should this whole thing be a selector instead?
export function formatLibraryObject(
  libraryObject: LibraryItemOutTyped
): Pick<
  WorkflowCardWrapperPropsType,
  | 'uuid'
  | 'title'
  | 'description'
  | 'isFavourite'
  | 'chips'
  | 'isLinked'
  | 'type'
> {
  const typeChip = getTypeChip(libraryObject)
  const templateChip = getTemplateChip(libraryObject)
  const countChip = getWorkflowCountChip(libraryObject)

  const type = mapObjectTypeToLibraryObjectType(
    libraryObject.contentType,
    libraryObject.label
  )

  return {
    uuid: libraryObject.uuid,
    title: libraryObject.title,
    description: libraryObject.description,
    isFavourite: libraryObject.isFavorite,
    // TODO: figure out where this comes from
    // isLinked: libraryObject.isLinked,
    isLinked: false,
    type,
    chips: [typeChip, templateChip, countChip].filter((entry) => entry != null)
  }
}
