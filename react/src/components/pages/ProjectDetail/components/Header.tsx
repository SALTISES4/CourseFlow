import { Discipline } from '@cf/types/common'
import { _t } from '@cf/utility/utilityFunctions'
import CollapsibleText from '@cfComponents/UIPrimitives/CollapsibleText'
import Users from '@cfPages/ProjectDetail/components/Users'
import { EProject } from '@XMLHTTP/types/entity'
import { UsersForObjectQueryResp } from '@XMLHTTP/types/query'

type PropsTypes = {
  allDisciplines: Discipline[]
  description: string
  disciplines: Discipline[]
  project: EProject
  users: UsersForObjectQueryResp
  readOnly: boolean
  openShareDialog: () => void
}

const Header = ({
  allDisciplines,
  description,
  disciplines,
  project,
  users,
  readOnly,
  openShareDialog
}: PropsTypes) => {
  disciplines.length && console.log(disciplines)
  disciplines.length && console.log('Header.tsx disciplines missing type')

  return (
    <div className="project-header">
      {/*<WorkflowTitle*/}
      {/*  data={project}*/}
      {/*  no_hyperlink={true}*/}
      {/*  class_name="project-title"*/}
      {/*/>*/}
      placeholder title
      <div className="project-header-info">
        <div className="project-info-section project-members">
          <h4>{_t('Permissions')}</h4>
          <Users
            users={users}
            readOnly={readOnly}
            openShareDialog={openShareDialog}
          />
        </div>

        <div className="project-other">
          <div className="project-info-section project-description">
            <h4>{_t('Description')}</h4>
            <CollapsibleText
              text={description}
              defaultText={_t('No description')}
            />
          </div>

          <div className="project-info-section project-disciplines">
            <h4>{_t('Disciplines')}</h4>
            {allDisciplines
              // @ts-ignore
              .filter((discipline) => disciplines.indexOf(discipline.id) >= 0)
              .map((discipline) => discipline.title)
              .join(', ') || _t('None')}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
