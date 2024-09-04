import { useNavigate } from 'react-router-dom'
import { generatePath } from 'react-router-dom'
import { CFRoutes as AppRoutes } from '@cf/router'
import { LibraryObjectType } from '@cf/types/enum'

const useNavigateToLibraryItem = () => {
  const navigate = useNavigate()

  return (id: number, type: LibraryObjectType) => {
    const basePath =
      type === LibraryObjectType.PROJECT
        ? AppRoutes.PROJECT
        : AppRoutes.WORKFLOW

    const path = generatePath(basePath, {
      id: String(id)
    })

    navigate(path)
  }
}

export default useNavigateToLibraryItem
