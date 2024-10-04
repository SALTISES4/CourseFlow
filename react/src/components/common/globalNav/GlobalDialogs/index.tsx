import ProjectCreateDialog from '@cfComponents/dialog/Project/ProjectCreateDialog'
import PasswordResetDialog from '@cfComponents/dialog/User/PasswordResetDialog'
import CreateWizardDialog from '@cfComponents/dialog/Workflow/CreateWizardDialog'
import * as React from 'react'

const GlobalDialogs = () => {
  return (
    <>
      {/*
        @todo put these menus into the unified menu helper in
        react/src/components/common/menu
        they are already in MUI, so it's fine for now
        // cuts down on a bit of boilerplate
        */}

      <PasswordResetDialog />
      <ProjectCreateDialog />
      <CreateWizardDialog />

      {/*<ProgramCreateDialog*/}
      {/*  {...createProgramData}*/}
      {/*  units={editProgramData.units}*/}
      {/*/>*/}

      {/*<ActivityCreateDialog*/}
      {/*  {...createActivityData}*/}
      {/*  units={editActivityData.units}*/}
      {/*/>*/}
    </>
  )
}

export default GlobalDialogs
