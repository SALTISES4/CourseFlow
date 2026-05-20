import { ProjectDetailOutResp } from '@cf/api/gen'
import { libraryItemFavoriteToggleMutation } from '@cf/api/gen/@tanstack/react-query.gen'
import { usePatchQueryCache } from '@cf/api/wrappedHooks'
import { LibraryObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import StarIcon from '@mui/icons-material/Star'
import IconButton from '@mui/material/IconButton'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { MouseEvent, useCallback, useState } from 'react'

type PropsType = {
  id?: string
  uuid?: string
  isFavourite: boolean
  type: LibraryObjectType
}

const Favourite = ({ id, uuid, isFavourite, type }: PropsType) => {
  const targetUuid = uuid ?? id
  const [isFavouriteState, setFavouriteState] = useState<boolean>(isFavourite)
  const queryClient = useQueryClient()
  const patchQueryCache = usePatchQueryCache()
  const toggleFavorite = useMutation({
    ...libraryItemFavoriteToggleMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['library-search']
      })

      // patch the getProject query
      patchQueryCache<ProjectDetailOutResp>({
        queryKey: [{ _id: 'getProject' }],
        callback: (draft) => {
          if (uuid === draft.item.uuid) {
            draft.item.isFavourite = !isFavouriteState
          }
        }
      })

      const msg = isFavouriteState
        ? _t('Removed from favorites')
        : _t('Saved to favorites')
      setFavouriteState(!isFavouriteState)
      enqueueSnackbar(msg, { variant: 'success' })
    },
    onError: (error) => {
      console.error('Error updating toggle:', error)
      enqueueSnackbar('Error toggling favourites', { variant: 'error' })
    }
  })

  const onStarClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      e.preventDefault()
      toggleFavorite.mutateAsync({
        body: { uuid: targetUuid }
      })
    },
    [targetUuid, toggleFavorite]
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
