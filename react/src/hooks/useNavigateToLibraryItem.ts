import { CFRoutes } from '@cf/router/appRoutes'
import { LibraryObjectType } from '@cf/types/enum'
import { useNavigate } from 'react-router-dom'
import { generatePath } from 'react-router-dom'

const useNavigateToLibraryItem = () => {
  const navigate = useNavigate()

  return (id: number, type: LibraryObjectType) => {
    const basePath =
      type === LibraryObjectType.PROJECT ? CFRoutes.PROJECT : CFRoutes.WORKFLOW

    const path = generatePath(basePath, {
      id: String(id)
    })

    navigate(path)
  }
}

export default useNavigateToLibraryItem
