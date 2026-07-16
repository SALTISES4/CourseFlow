import { ProjectDetailOut } from '@cf/api/gen'
import { getProjectOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { ProjectDetailsType } from '@cf/types/common'
import { getErrorMessage } from '@cf/utility/errorWrapper'
import { _t } from '@cf/utility/Utility.class'
import MenuBar from '@cfComponents/globalNav/MenuBar'
import Loader from '@cfComponents/UIPrimitives/Loader'
import ErrorView from '@cfPages/MsgViews/ErrorView'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import ProjectActionMenu from './components/ActionMenu'
import ProjectDialogs from './components/Dialogs'
import ProjectHeader from './components/Header'
import ProjectTabs from './components/Tabs'

const ProjectDetails = () => {
  const { uuid } = useParams()
  const [project, setProject] = useState<ProjectDetailsType>()

  const { data, error, isLoading, isError } = useQuery({
    ...getProjectOptions({ path: { uuid } }),
    enabled: Boolean(uuid)
  })

  useEffect(() => {
    if (!data) {
      return
    }

    setProject(mapProjectV2ToProjectDetails(data.item))
  }, [data])

  if (isLoading) {
    return <Loader />
  }

  if (isError) {
    return (
      <ErrorView message={`An error occurred: ${getErrorMessage(error)}`} />
    )
  }

  if (!project) {
    return <ErrorView message={`Project does not exist`} />
  }

  return (
    <>
      <MenuBar leftSection={<ProjectActionMenu />} />
      <ProjectHeader project={project} />
      <ProjectTabs project={project} />
      <ProjectDialogs />
    </>
  )
}

export default ProjectDetails

function mapProjectV2ToProjectDetails(p: ProjectDetailOut): ProjectDetailsType {
  return {
    ...p,
    author: {
      uuid: '',
      username: '',
      firstName: '',
      lastName: '',
      name: ''
    }
  }
}
