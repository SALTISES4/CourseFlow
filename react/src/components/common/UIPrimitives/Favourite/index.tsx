import { LibrarySearchOut } from '@cf/api/gen'
import { libraryItemFavoriteToggleMutation } from '@cf/api/gen/@tanstack/react-query.gen'
import { usePatchQueryCache } from '@cf/api/wrappedHooks'
import { LibraryObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import StarIcon from '@mui/icons-material/Star'
import IconButton from '@mui/material/IconButton'
import { useMutation } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { MouseEvent, useCallback, useState } from 'react'

type PropsType = {
  id: string
  isFavourite: boolean
  type: LibraryObjectType
}

const Favourite = ({ id, isFavourite, type }: PropsType) => {
  const [isFavouriteState, setFavouriteState] = useState<boolean>(isFavourite)
  const patchQueryCache = usePatchQueryCache()
  const toggleFavorite = useMutation({
    ...libraryItemFavoriteToggleMutation(),
    onSuccess: async (response) => {
      patchQueryCache<LibrarySearchOut>({
        queryKey: ['library-search'],
        callback: (draft) => {
          const workflow = draft.items.find((w) => w.uuid === id)
          if (workflow) {
            // TODO: actually replace the workflow with the response
            // once it returns a real workflow/LibraryItemOut
            workflow.isFavorite = !workflow.isFavorite
          }
        }
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
          body: {
            uuid: id,
            targetType:
              type === LibraryObjectType.PROJECT ? 'project' : 'workflow'
          }
        })
        onSuccess()
      } catch (err) {
        onError(err)
      }
    },
    [id, type, onSuccess, onError, toggleFavorite]
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
