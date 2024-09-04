import { useNavigate } from 'react-router-dom'
import { generatePath } from 'react-router-dom'
import { ELibraryObject } from '@XMLHTTP/types/entity'
import { LibraryObjectType } from '@cf/types/enum'
import { CFRoutes as AppRoutes } from '@cf/router'

const useNavigateToLibraryItem = () => {
  const navigate = useNavigate()

  return (id: number, type: LibraryObjectType) => {
    const basePath =
      type === LibraryObjectType.PROJECT
        ? AppRoutes.PROJECT
        : AppRoutes.WORKFLOW_OVERVIEW

    const path = generatePath(basePath, {
      id: String(id)
    })

    navigate(path)
  }
}

export default useNavigateToLibraryItem
