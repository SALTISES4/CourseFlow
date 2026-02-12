import { LibraryObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import StarIcon from '@mui/icons-material/Star'
import IconButton from '@mui/material/IconButton'
import { useToggleFavouriteMutation } from '@XMLHTTP/API/library.rtk'
import { enqueueSnackbar } from 'notistack'
import { MouseEvent, useCallback, useEffect, useState } from 'react'

type PropsType = {
  id: number
  isFavourite: boolean
  type: LibraryObjectType
}

const Favourite = ({ id, isFavourite, type }: PropsType) => {
  const [isFavouriteState, setFavouriteState] = useState<boolean>(isFavourite)

  const [toggleMutate] = useToggleFavouriteMutation()

  const onSuccess = useCallback(() => {
    setFavouriteState(!isFavouriteState)
    enqueueSnackbar('Success toggling favourites', {
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
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      e.preventDefault()

      toggleMutate({
        id,
        objectType: type,
        favourite: !isFavouriteState
      })
        .unwrap()
        .then(() => onSuccess())
        .catch((err) => onError(err))
    },
    [id, type, isFavouriteState, onError, onSuccess, toggleMutate]
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
