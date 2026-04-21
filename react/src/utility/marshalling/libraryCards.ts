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

function getTypeChip(workflow: LibraryItemOut): WorkflowCardChipType {
  const { objectType } = workflow
  let typeText = _t(objectType)

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
    type: mapChipType(mapObjectTypeToLibraryObjectType(objectType)),
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
  return data.map((item) => formatLibraryObject(item))
}

// TODO: should this whole thing be a selector instead?
export function formatLibraryObject(
  libraryObject: LibraryItemOut
): Pick<
  WorkflowCardWrapperPropsType,
  'id' | 'title' | 'description' | 'isFavourite' | 'chips' | 'isLinked' | 'type'
> {
  const typeChip = getTypeChip(libraryObject)
  const templateChip = getTemplateChip(libraryObject)
  const countChip = getWorkflowCountChip(libraryObject)
  // TODO: figure out where this comes from
  // const descriptionFromEntity =
  //   libraryObject.description?.trim() ||
  //   (libraryObject.author?.name &&
  //     `${_t('Owned by')} ${libraryObject.author.name}`)

  return {
    id: libraryObject.uuid,
    title: libraryObject.title,
    description: libraryObject.description,
    isFavourite: libraryObject.isFavorite,
    // TODO: figure out where this comes from
    // isLinked: libraryObject.isLinked,
    isLinked: false,
    type: mapObjectTypeToLibraryObjectType(libraryObject.objectType),
    chips: [typeChip, templateChip, countChip].filter((entry) => entry != null)
  }
}
