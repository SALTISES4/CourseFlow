// @ts-nocheck
import { DIALOG_TYPE } from '@cf/hooks/useDialog'
import ActivityCreateDialog from '@cfPages/Styleguide/dialog/ActivityCreate'
import createActivityData from '@cfPages/Styleguide/dialog/ActivityCreate/data'
import ActivityEditDialog from '@cfPages/Styleguide/dialog/ActivityEdit'
import editActivityData from '@cfPages/Styleguide/dialog/ActivityEdit/data'
import AddContributorDialog from '@cfPages/Styleguide/dialog/AddContributor'
import addContributorData from '@cfPages/Styleguide/dialog/AddContributor/data'
import ArchiveDialog from '@cfPages/Styleguide/dialog/Archive'
import CourseCreateDialog from '@cfPages/Styleguide/dialog/CourseCreate'
import createCourseData from '@cfPages/Styleguide/dialog/CourseCreate/data'
import CourseEditDialog from '@cfPages/Styleguide/dialog/CourseEdit'
import editCourseData from '@cfPages/Styleguide/dialog/CourseEdit/data'
import ImportDialog from '@cfPages/Styleguide/dialog/Import'
import ProgramCreateDialog from '@cfPages/Styleguide/dialog/ProgramCreate'
import createProgramData from '@cfPages/Styleguide/dialog/ProgramCreate/data'
import ProgramEditDialog from '@cfPages/Styleguide/dialog/ProgramEdit'
import editProgramData from '@cfPages/Styleguide/dialog/ProgramEdit/data'
import ProjectCreateEditDialog from '@cfPages/Styleguide/dialog/Project'
import createProjectData from '@cfPages/Styleguide/dialog/Project/CreateProject/data'
import editProjectData from '@cfPages/Styleguide/dialog/Project/EditProject/data'
import ProjectExportDialog from '@cfPages/Styleguide/dialog/ProjectExport'
import exportProjectData from '@cfPages/Styleguide/dialog/ProjectExport/data'
import WorkflowLinkDialog from '@cfPages/Styleguide/dialog/WorkflowLink'

const AllDialogs = () => (
  <>
    {/*<ProjectCreateEditDialog*/}
    {/*  {...createProjectData}*/}
    {/*  type={DIALOG_TYPE.PROJECT_CREATE}*/}
    {/*/>*/}

    {/*<ProjectCreateEditDialog*/}
    {/*  {...editProjectData}*/}
    {/*  type={DIALOG_TYPE.PROJECT_EDIT}*/}
    {/*/>*/}

    <ProjectExportDialog project={exportProjectData} />

    <ArchiveDialog />

    <ActivityCreateDialog
      {...createActivityData}
      units={editActivityData.units}
    />

    <ActivityEditDialog {...editActivityData} />

    <ProgramCreateDialog {...createProgramData} units={editProgramData.units} />

    <ProgramEditDialog {...editProgramData} />

    <CourseCreateDialog {...createCourseData} units={editCourseData.units} />

    <CourseEditDialog {...editCourseData} />

    <ImportDialog />

    <WorkflowLinkDialog
      projects={createActivityData.projects}
      onSubmit={(id) => {
        console.log('linking workflow to id', id)
      }}
    />

    <AddContributorDialog {...addContributorData} />
  </>
)

export default AllDialogs
