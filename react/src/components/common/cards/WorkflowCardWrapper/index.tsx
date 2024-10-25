import useNavigateToLibraryItem from '@cf/hooks/useNavigateToLibraryItem'
import { LibraryObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import Favourite from '@cfComponents/UIPrimitives/Favourite'
import { workflowTitle } from '@cfComponents/UIPrimitives/Titles.ts'
import ErrorIcon from '@mui/icons-material/Error'
import * as React from 'react'

import WorkflowCardDumb, {
  PropsType as WorkflowCardDumbPropsType
} from '../WorkflowCardDumb'

/*******************************************************
 * A workflow card for a menu
 *
 *******************************************************/

export type WorkflowCardWrapperPropsType = Pick<
  WorkflowCardDumbPropsType,
  'id' | 'description' | 'chips'
> & {
  title: string
  isFavourite: boolean
  isLinked: boolean
  type: LibraryObjectType
  isSelected?: boolean
}
const WorkflowCardWrapper = ({
  id,
  title,
  description,
  chips,
  isFavourite,
  type,
  isLinked,
  isSelected = false
}: WorkflowCardWrapperPropsType) => {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  const navigateToItem = useNavigateToLibraryItem()

  const Extras = () => {
    return (
      <>
        {isLinked && (
          <div
            key="workflow-created-warning"
            className="workflow-created linked-workflow-warning"
            title={_t(
              'Warning: linking the same workflow to multiple nodes can result in loss of readability if you are associating parent workflow outcomes with child workflow outcomes.'
            )}
          >
            <ErrorIcon sx={{ color: 'red' }} />
            {` ${_t('Already in use')}`}
          </div>
        )}
      </>
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  // @todo
  // const isDisabledLink = noHyperlink
  const isDisabledLink = false

  // @todo
  const code = ''
  const deleted = false

  const favourite = <Favourite id={id} isFavourite={isFavourite} type={type} />

  return (
    <WorkflowCardDumb
      id={id}
      title={workflowTitle({ title, code, deleted })}
      favourite={favourite}
      isDisabledLink={isDisabledLink}
      description={description}
      isSelected={isSelected}
      onClick={() => navigateToItem(id, type)}
      chips={chips}
      footer={<Extras />}
    />
  )
}

export default WorkflowCardWrapper
