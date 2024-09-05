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

const WorkflowDialogs = () => {
  return (
    <>
      <ActivityEditDialog />
      <ArchiveDialog />
      <ContributorAddDialog />
      <CourseArchiveDialog />
      <CourseEditDialog />
      <ProgramEditDialog />
      <ProjectArchiveDialog />
      <ProjectExportDialog />
      <ProjectTargetDialog />
      <UserRemoveFromProjectDialog />
      <WorkflowLinkDialog />
    </>
  )
}
export default WorkflowDialogs
