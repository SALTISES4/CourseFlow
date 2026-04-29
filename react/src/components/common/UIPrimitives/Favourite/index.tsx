import { LibrarySearchOut } from '@cf/api/gen'
import { libraryItemFavoriteToggleMutation } from '@cf/api/gen/@tanstack/react-query.gen'
import { LibraryObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import StarIcon from '@mui/icons-material/Star'
import IconButton from '@mui/material/IconButton'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { produce } from 'immer'
import { enqueueSnackbar } from 'notistack'
import { MouseEvent, useCallback, useState } from 'react'

type PropsType = {
  id: string
  isFavourite: boolean
  type: LibraryObjectType
}

const Favourite = ({ id, isFavourite, type }: PropsType) => {
  const [isFavouriteState, setFavouriteState] = useState<boolean>(isFavourite)
  const queryClient = useQueryClient()
  const toggleFavorite = useMutation({
    ...libraryItemFavoriteToggleMutation(),
    onSuccess: async (resp) => {
      // patch the cache instead of invalidating all library-search queries
      // and triggering multiple fetches
      queryClient
        .getQueriesData<LibrarySearchOut>({ queryKey: ['library-search'] })
        .forEach(([queryKey, oldData]) => {
          if (!oldData) {
            return
          }
          queryClient.setQueryData(
            queryKey,
            produce(oldData, (draft) => {
              const workflow = draft.items.find((w) => w.uuid === id)
              if (workflow) {
                workflow.isFavorite = !workflow.isFavorite
              }
            })
          )
        })
    }
  })

  const onSuccess = useCallback(() => {
    const msg = isFavouriteState
      ? _t('Removed from favorites')
      : _t('Saved to favorites')
    setFavouriteState(!isFavouriteState)
    enqueueSnackbar(msg, {
      variant: 'success'
    })
  }, [isFavouriteState])

  const onError = useCallback((error) => {
    console.error('Error updating toggle:', error)
    enqueueSnackbar('Error toggling favourites', {
      variant: 'error'
    })
  }, [])

  const onStarClick = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      e.preventDefault()
      try {
        await toggleFavorite.mutateAsync({
          body: { uuid: id }
        })
        onSuccess()
      } catch (err) {
        onError(err)
      }
    },
    [id, onSuccess, onError, toggleFavorite]
  )

  return (
    <IconButton
      aria-label={_t('Favourite')}
      sx={{
        color: isFavouriteState
          ? 'courseflow.favouriteActive'
          : 'courseflow.favouriteInactive'
      }}
      onClick={onStarClick}
    >
      <StarIcon />
    </IconButton>
  )
}

export default Favourite
