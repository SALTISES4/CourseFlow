import { ProjectDetailOutResp } from '@cf/api/gen'
import { libraryItemFavoriteToggleMutation } from '@cf/api/gen/@tanstack/react-query.gen'
import { usePatchQueryCache } from '@cf/api/wrappedHooks'
import { _t } from '@cf/utility/Utility.class'
import StarIcon from '@mui/icons-material/Star'
import IconButton from '@mui/material/IconButton'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { MouseEvent, useCallback, useState } from 'react'

type PropsType = {
  id?: string
  uuid?: string
  isFavorite: boolean
}

const Favorite = ({ id, uuid, isFavorite }: PropsType) => {
  const targetUuid = uuid ?? id
  const [isFavoriteState, setFavoriteState] = useState<boolean>(isFavorite)
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
            draft.item.isFavorite = !isFavoriteState
          }
        }
      })

      const msg = isFavoriteState
        ? _t('Removed from your favourites')
        : _t('Added to your favourites')
      setFavoriteState(!isFavoriteState)
      enqueueSnackbar(msg, { variant: 'success' })
    },
    onError: (error) => {
      console.error('Error updating toggle:', error)
      enqueueSnackbar(_t('We were not able to update favourite status'), {
        variant: 'error'
      })
    }
  })

  const onStarClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      e.preventDefault()
      if (!targetUuid) {
        return
      }
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
        color: isFavoriteState
          ? 'courseflow.favouriteActive'
          : 'courseflow.favouriteInactive'
      }}
      onClick={onStarClick}
    >
      <StarIcon />
    </IconButton>
  )
}

export default Favorite
