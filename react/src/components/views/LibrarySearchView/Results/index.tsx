import { LibrarySearchOut } from '@cf/api/gen'
import { getErrorMessage } from '@cf/utility/errorWrapper'
import { formatLibraryObjects } from '@cf/utility/marshalling/libraryCards'
import { _t } from '@cf/utility/Utility.class'
import WorkflowCardWrapper from '@cfComponents/cards/WorkflowCardWrapper'
import ErrorView from '@cfPages/MsgViews/ErrorView'
import { Link, Skeleton, Typography } from '@mui/material'
import { Link as LinkRouter } from 'react-router-dom'

export type ResultsProps = {
  data?: LibrarySearchOut
  error: Error | null
  isError: boolean
  isLoading: boolean
  override?: {
    uuid?: string
    onCardSelect: (uuid: string) => void
  }
}

const Results = ({
  data,
  error,
  isLoading,
  isError,
  override
}: ResultsProps) => {
  if (isLoading) {
    return Array.from({ length: 10 }, (_, index) => (
      <Skeleton
        key={index}
        variant="rectangular"
        data-test-id="library-loading-skeleton"
        style={{ height: '150px' }}
      />
    ))
  }

  if (!data) {
    return (
      <ErrorView
        message={_t('The content you were looking for is not found.')}
      />
    )
  }
  if (isError) {
    return (
      <ErrorView message={`An error occurred: ${getErrorMessage(error)}`} />
    )
  }

  const cards = formatLibraryObjects(data.items)

  return (
    <>
      {!cards.length && <Typography>{_t('No results found')}</Typography>}

      {cards.map((item) => (
        <WorkflowCardWrapper
          key={`workflow_${item.uuid}`}
          {...item}
          isSelected={item.uuid === override?.uuid}
          onClick={
            override?.onCardSelect
              ? () => override?.onCardSelect(item.uuid)
              : undefined
          }
        />
      ))}

      {/* TODO: ALL VIEW NOT IMPLEMENTED YET */}
      {cards.length > 10 && (
        <Link component={LinkRouter} to="#">
          <Typography>{_t('+ See all')}</Typography>
        </Link>
      )}
    </>
  )
}

export default Results
