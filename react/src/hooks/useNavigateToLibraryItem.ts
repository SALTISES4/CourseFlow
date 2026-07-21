import { LibraryContentTypeOut } from '@cf/api/gen'
import { CFRoutes } from '@cf/router/appRoutes'
import { useNavigate } from 'react-router-dom'
import { generatePath } from 'react-router-dom'

const useNavigateToLibraryItem = () => {
  const navigate = useNavigate()

  return (uuid: string, type: LibraryContentTypeOut) => {
    const basePath =
      type === LibraryContentTypeOut.PROJECT
        ? CFRoutes.PROJECT_WORKFLOW
        : CFRoutes.WORKFLOW_GRAPH

    const path = generatePath(basePath, {
      uuid
    })

    navigate(path)
  }
}

export default useNavigateToLibraryItem
