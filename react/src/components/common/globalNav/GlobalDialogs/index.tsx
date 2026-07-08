import ProjectCreateDialog from '@cfComponents/dialog/Project/ProjectCreateDialog'
import CreateWizardDialog from '@cfComponents/dialog/Workflow/CreateWizardDialog'

const GlobalDialogs = () => {
  return (
    <>
      {/*
        @todo put these menus into the unified menu helper in
        react/src/components/common/menu
        ?
        */}

      <ProjectCreateDialog />
      <CreateWizardDialog />
    </>
  )
}

export default GlobalDialogs
