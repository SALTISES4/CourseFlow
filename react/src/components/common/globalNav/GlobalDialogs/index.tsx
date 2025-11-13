import ProjectCreateDialog from '@cfComponents/dialog/Project/ProjectCreateDialog'
import PasswordResetDialog from '@cfComponents/dialog/User/PasswordResetDialog'
import CreateWizardDialog from '@cfComponents/dialog/Workflow/CreateWizardDialog'

const GlobalDialogs = () => {
  return (
    <>
      {/*
        @todo put these menus into the unified menu helper in
        react/src/components/common/menu
        ?
        */}

      <PasswordResetDialog />
      <ProjectCreateDialog />
      <CreateWizardDialog />
    </>
  )
}

export default GlobalDialogs
