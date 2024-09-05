import ActivityEditDialog from '@cfComponents/dialog/Workspace/ActivityEditDialog'
import ArchiveDialog from '@cfComponents/dialog/Workspace/ArchiveDialog'
import ContributorAddDialog from '@cfComponents/dialog/Workspace/ContributorAddDialog'
import CourseArchiveDialog from '@cfComponents/dialog/Workspace/CourseArchiveDialog'
import CourseEditDialog from '@cfComponents/dialog/Workspace/CourseEditDialog'
import ProgramEditDialog from '@cfComponents/dialog/Workspace/ProgramEditDialog'
import ProjectArchiveDialog from '@cfComponents/dialog/Workspace/ProjectArchiveDialog'
import ProjectExportDialog from '@cfComponents/dialog/Workspace/ProjectExportDialog'
import ProjectTargetDialog from '@cfComponents/dialog/Workspace/ProjectTargetDialog'
import UserRemoveFromProjectDialog from '@cfComponents/dialog/Workspace/UserRemoveFromProjectDialog'
import WorkflowLinkDialog from '@cfComponents/dialog/Workspace/WorkflowLinkDialog'
import dummyActivityData from '@cfPages/Styleguide/dialog/ActivityEdit/data'
import contributorAddData from '@cfPages/Styleguide/dialog/AddContributor/data'
import dummyCourseData from '@cfPages/Styleguide/dialog/CourseEdit/data'
import ImportDialog from '@cfPages/Styleguide/dialog/Import'
import dummyProgramData from '@cfPages/Styleguide/dialog/ProgramEdit/data'
import dummyProjectExportData from '@cfPages/Styleguide/dialog/ProjectExport/data'
import { PROJECT_PERMISSION_ROLE } from '@cfPages/Styleguide/views/Project/types'

const userData = {
  id: 12313,
  name: 'Xin Yue',
  email: 'xin@xueeee.com',
  role: PROJECT_PERMISSION_ROLE.OWNER
}

const WorkflowDialogs = () => {
  return (
    <>
      <ArchiveDialog />
      <ProjectTargetDialog />
      <WorkflowLinkDialog />

      <ActivityEditDialog {...dummyActivityData} />
      <CourseEditDialog {...dummyCourseData} />
      <ProgramEditDialog {...dummyProgramData} />
      <ImportDialog />
      <ContributorAddDialog {...contributorAddData} />
      <ProjectExportDialog {...dummyProjectExportData} />
      <CourseArchiveDialog
        onSubmit={() => {
          'onSubmit'
        }}
      />
      <ProjectArchiveDialog
        onSubmit={() => {
          'onSubmit'
        }}
      />
      <UserRemoveFromProjectDialog user={userData} />
    </>
  )
}
export default WorkflowDialogs
