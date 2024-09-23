import { LibraryObjectType } from '@cf/types/enum'
import StarIcon from '@mui/icons-material/Star'
import IconButton from '@mui/material/IconButton'
import { useToggleFavouriteMutation } from '@XMLHTTP/API/library.rtk'
import { enqueueSnackbar } from 'notistack'
import { useEffect, useState } from 'react'
import * as React from 'react'

type PropsType = {
  id: number
  isFavorite: boolean
  type: LibraryObjectType
}

const Favourite = ({ id, isFavorite, type }: PropsType) => {
  const [isFavouriteState, setFavouriteState] = useState<boolean>(isFavorite)

  const [toggleMutate, { isError, error, isSuccess }] =
    useToggleFavouriteMutation()

  function onSuccess() {
    setFavouriteState(!isFavouriteState)
    enqueueSnackbar('Success toggling favourites', {
      variant: 'success'
    })
  }

  function onError(error) {
    console.error('Error updating toggle:', error)
    enqueueSnackbar('Error toggling favourites', {
      variant: 'error'
    })
  }

  useEffect(() => {
    if (isError) {
      onError(error)
    }
    if (isSuccess) {
      onSuccess()
    }
  }, [isError, error, isSuccess])

  return (
    <IconButton
      aria-label="Favourite"
      sx={{
        color: isFavouriteState
          ? 'courseflow.favouriteActive'
          : 'courseflow.favouriteInactive'
      }}
      onClick={() =>
        toggleMutate({
          id,
          type: type,
          favourite: !isFavouriteState
        })
      }
    >
      <StarIcon />
    </IconButton>
  )
}

export default Favourite
