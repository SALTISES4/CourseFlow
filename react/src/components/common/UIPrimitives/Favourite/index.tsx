import {LibraryObjectType, WorkflowType} from '@cf/types/enum'
import StarIcon from '@mui/icons-material/Star'
import IconButton from '@mui/material/IconButton'
import { useMutation } from '@tanstack/react-query'
import { toggleFavouriteMutation } from '@XMLHTTP/API/library'
import { EmptyPostResp } from '@XMLHTTP/types/query'
import { enqueueSnackbar } from 'notistack'
import { useState } from 'react'
import * as React from 'react'

type PropsType = {
  id: number
  isFavorite: boolean
  type: LibraryObjectType
}

const Favourite = ({ id, isFavorite, type }: PropsType) => {
  const [isFavouriteState, setFavouriteState] = useState<boolean>(isFavorite)

  const { mutate: toggleMutate } = useMutation<EmptyPostResp>({
    mutationFn: () =>
      toggleFavouriteMutation({
        id,
        type: type,
        favourite: !isFavorite
      }),
    onSuccess: (newNotificationsValue) => {
      setFavouriteState(!isFavouriteState)
      enqueueSnackbar('Success toggling favourites', {
        variant: 'success'
      })
    },
    onError: (error) => {
      console.error('Error updating toggle:', error)
      enqueueSnackbar('Error toggling favourites', {
        variant: 'error'
      })
    }
  })

  return (
    <IconButton
      aria-label="Favourite"
      sx={{
        color: isFavouriteState
          ? 'courseflow.favouriteActive'
          : 'courseflow.favouriteInactive'
      }}
      onClick={() => toggleMutate()}
    >
      <StarIcon />
    </IconButton>
  )
}

export default Favourite
