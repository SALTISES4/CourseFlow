import { UserContext } from '@cf/context/userContext'
import ProjectCreateDialog from '@cfComponents/dialog/Project/ProjectCreateDialog'
import CreateWizardDialog from '@cfComponents/dialog/Workflow/CreateWizardDialog'
import { useContext } from 'react'

const GlobalDialogs = () => {
  const user = useContext(UserContext)
  const ownsAnyProject = user.meta?.ownsAnyProject

  // TODO: put these menus into the unified menu helper in
  // react/src/components/common/menu
  return (
    <>
      <ProjectCreateDialog showNoProjectsAlert={!ownsAnyProject} />
      <CreateWizardDialog />
    </>
  )
}

export default GlobalDialogs
