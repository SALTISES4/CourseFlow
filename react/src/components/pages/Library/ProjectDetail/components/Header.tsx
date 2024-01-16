import * as React from 'react'
import { CollapsibleText, WorkflowTitle } from '@cfUIComponents/index.js'
import { Discipline } from '@cfModule/types/common'
import Users from '@cfPages/Library/ProjectDetail/components/Users'
import { UsersForObjectQueryResp } from '@XMLHTTP/types'

type PropsTypes = {
  allDisciplines: Discipline[]
  description: string
  disciplines: Discipline[]
  data: any
  users: UsersForObjectQueryResp
  readOnly: boolean
  openShareDialog: () => void
}

const Header = ({
  allDisciplines,
  description,
  disciplines,
  data,
  users,
  readOnly,
  openShareDialog
}: PropsTypes) => {
  console.log('discipline')
  // @todo see error below, verify data type of data.disciplines
  console.log(allDisciplines)
  console.log(data.disciplines)
  console.log('disciplines')
  console.log(disciplines)

  return (
    <div className="project-header">
      <WorkflowTitle
        data={data}
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
              .filter(
                // @ts-ignore
                (discipline) => disciplines.indexOf(discipline.id) >= 0 // @todo what is shape of 'disiplines' ?
              )
              .map((discipline) => discipline.title)
              .join(', ') || window.gettext('None')}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
