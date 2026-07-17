import WorkflowDestinationProjectSearch from '@cfComponents/dialog/Workflow/WorkflowDestinationProjectSearch'

type PropsType = {
  selected?: string
  contextProjectUuid?: string | null
  onProjectSelect: (uuid?: string) => void
}

const ProjectSearch = ({
  selected,
  contextProjectUuid,
  onProjectSelect
}: PropsType) => {
  return (
    <WorkflowDestinationProjectSearch
      selected={selected}
      contextProjectUuid={contextProjectUuid}
      onProjectSelect={onProjectSelect}
    />
  )
}

export default ProjectSearch
