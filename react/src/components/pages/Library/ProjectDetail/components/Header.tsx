import { WorkflowTitle } from '@cfCommonComponents/UIComponents/Titles'
import CollapsibleText from '@cfCommonComponents/UIComponents/CollapsibleText'
import { Discipline } from '@cfModule/types/common'
import Users from '@cfPages/Library/ProjectDetail/components/Users'
import { UsersForObjectQueryResp } from '@XMLHTTP/types/query'
import { EProject } from '@cfModule/XMLHTTP/types/entity'

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
      <WorkflowTitle
        data={project}
        no_hyperlink={true}
        class_name="project-title"
      />
      <div className="project-header-info">
        <div className="project-info-section project-members">
          <h4>{window.gettext('Permissions')}</h4>
          <Users
            users={users}
            readOnly={readOnly}
            openShareDialog={openShareDialog}
          />
        </div>

        <div className="project-other">
          <div className="project-info-section project-description">
            <h4>{window.gettext('Description')}</h4>
            <CollapsibleText
              text={description}
              defaultText={window.gettext('No description')}
            />
          </div>

          <div className="project-info-section project-disciplines">
            <h4>{window.gettext('Disciplines')}</h4>
            {allDisciplines
              // @ts-ignore
              .filter((discipline) => disciplines.indexOf(discipline.id) >= 0)
              .map((discipline) => discipline.title)
              .join(', ') || window.gettext('None')}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
