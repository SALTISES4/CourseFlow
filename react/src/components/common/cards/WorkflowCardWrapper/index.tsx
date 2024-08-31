import { useState } from 'react'
import WorkflowCardDumb, {
  PropsType as WorkflowCardDumbPropsType
} from '../WorkflowCardDumb'
import { workflowTitle } from '@cfCommonComponents/UIComponents/Titles'
import { LibraryObjectType } from '@cfModule/types/enum'
import ErrorIcon from '@mui/icons-material/Error'
import { _t } from '@cf/utility/utilityFunctions'
import useNavigateToLibraryItem from '@cf/hooks/useNavigateToLibraryItem'
import { useMutation } from '@tanstack/react-query'
import { EmptyPostResp } from '@XMLHTTP/types/query'
import { toggleFavouriteMutation } from '@XMLHTTP/API/library'

/*******************************************************
 * A workflow card for a menu
 *
 *******************************************************/

export type WorkflowCardWrapperPropsType = Pick<
  WorkflowCardDumbPropsType,
  'id' | 'title' | 'description' | 'chips' | 'isFavourite'
> & {
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
  const [isFavouriteState, setFavouriteState] = useState<boolean>(isFavourite)

  const { mutate: toggleMutate } = useMutation<EmptyPostResp>({
    mutationFn: () =>
      toggleFavouriteMutation({ id, type, favourite: !isFavouriteState }),
    onSuccess: (newNotificationsValue) => {
      // update local state after the API call is successful
      setFavouriteState(!isFavouriteState)
    },
    onError: (error) => {
      console.error('Error updating toggle:', error)
    }
  })

  function onFavouriteHandler() {
    toggleMutate()
  }

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

  return (
    <WorkflowCardDumb
      id={id}
      title={workflowTitle(title, code, deleted)}
      isDisabledLink={isDisabledLink}
      description={description}
      isSelected={isSelected}
      isFavourite={isFavouriteState}
      onFavourite={onFavouriteHandler}
      onClick={() => navigateToItem(id, type)}
      chips={chips}
      footer={<Extras />}
    />
  )
}

export default WorkflowCardWrapper
