import SkipNextIcon from '@mui/icons-material/SkipNext'
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious'
import Box from '@mui/material/Box'
import Pagination from '@mui/material/Pagination'
import PaginationItem from '@mui/material/PaginationItem'
import { ChangeEvent, useCallback, useState } from 'react'

type PropsType = {
  current: number
  pages: number
  onChange?: (page: number) => void
}

const CFPagination = ({ current, pages, onChange }: PropsType) => {
  const [page, setPage] = useState(current)

  const onPageChange = useCallback(
    (_: ChangeEvent<unknown>, value: number) => {
      setPage(value)
      onChange && onChange(value - 1)
    },
    [onChange]
  )

  return (
    <Box
      sx={{
        mt: 3,
        mb: 3,
        p: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Pagination
        color="primary"
        count={pages}
        showFirstButton={pages > 7}
        showLastButton={pages > 7}
        page={page}
        onChange={onPageChange}
        renderItem={(item) => (
          <PaginationItem
            slots={{ first: SkipPreviousIcon, last: SkipNextIcon }}
            {...item}
          />
        )}
      />
    </Box>
  )
}

export default CFPagination
