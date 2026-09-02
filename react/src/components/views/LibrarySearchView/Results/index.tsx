import { LibrarySearchOut } from '@cf/api/gen'
import { formatLibraryObjects } from '@cf/utility/marshalling/libraryCards'
import WorkflowCardWrapper from '@cfComponents/cards/WorkflowCardWrapper'
import ErrorView from '@cfPages/MsgViews/ErrorView'
import { Alert, Link, Skeleton, Typography } from '@mui/material'
import { Link as LinkRouter } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export type ResultsProps = {
  data?: LibrarySearchOut
  error: Error | null
  isError: boolean
  isLoading: boolean
  errorMessage?: string
  override?: {
    uuid?: string
    onCardSelect: (uuid: string) => void
  }
}

const Results = ({
  data,
  isLoading,
  isError,
  errorMessage,
  override
}: ResultsProps) => {
  const { t } = useTranslation('library')
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

  if (isError) {
    return errorMessage ? (
      <Alert severity="warning" sx={{ gridColumn: '1 / -1' }}>
        {errorMessage}
      </Alert>
    ) : (
      <ErrorView message={t('results.loadFailed')} />
    )
  }

  if (!data) {
    return (
      <ErrorView
        message={t('results.notFound')}
      />
    )
  }
  const cards = formatLibraryObjects(data.items, t)

  return (
    <>
      {!cards.length && <Typography>{t('results.none')}</Typography>}

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
          <Typography>{t('results.seeAll')}</Typography>
        </Link>
      )}
    </>
  )
}

export default Results
