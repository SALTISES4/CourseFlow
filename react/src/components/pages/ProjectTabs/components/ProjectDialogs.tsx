import { ProjectPermissionRole } from '@cf/types/common'
import { WorkSpaceType } from '@cf/types/enum'
import ProjectEditDialog from '@cfComponents/dialog/Project/ProjectEditDialog'
import ArchiveDialog from '@cfComponents/dialog/Workspace/ArchiveDialog'
import ContributorRemoveDialog from '@cfComponents/dialog/Workspace/ContributorRemoveDialog'
import RestoreDialog from '@cfComponents/dialog/Workspace/RestoreDialog'
import { useGetProjectByIdQuery } from '@XMLHTTP/API/project.rtk'
import { useParams } from 'react-router-dom'

import ContributorAddDialog from 'components/common/dialog/Workspace/ContributorManageDialog'

const userData = {
  id: 12313,
  name: 'Xin Yue',
  email: 'xin@xueeee.com',
  role: ProjectPermissionRole.OWNER
}

const ProjectDialogs = () => {
  const { id } = useParams()
  const projectId = Number(id)
  const { refetch } = useGetProjectByIdQuery({ id: Number(id) })

  return (
    <>
      <ProjectEditDialog />
      <RestoreDialog
        id={projectId}
        objectType={WorkSpaceType.PROJECT}
        callback={refetch}
      />
      <ArchiveDialog
        id={projectId}
        objectType={WorkSpaceType.PROJECT}
        callback={refetch}
      />
      {/*<ImportDialog />*/}
      {/*<ContributorAddDialog {...contributorAddData} />*/}
      {/*<ProjectExportDialog {...dummyProjectExportData} />*/}
      <ContributorRemoveDialog user={userData} />
    </>
  )
}
export default ProjectDialogs
