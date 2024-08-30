import * as React from 'react'
import { WorkflowTitle } from '@cfCommonComponents/UIComponents/Titles'
import CollapsibleText from '@cfCommonComponents/UIComponents/CollapsibleText'
import * as Utility from '@cfModule/utility/utilityFunctions'
import { useContext } from 'react'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'
import PublicIcon from '@mui/icons-material/Public'
import { _t } from '@cf/utility/utilityFunctions'

const Users = ({
  users,
  openShareDialog
}: {
  users: any
  readonly: boolean
  openShareDialog: any
}) => {
  const context = useContext(WorkFlowConfigContext)

  if (!users) return null
  let users_group = []

  const author = users.author
  const editors = users.editors
  const commenters = users.commentors
  const viewers = users.viewers

  if (users.published) {
    users_group.push(
      <div className="user-name">
        {Utility.getUserTag('view')}
        <PublicIcon />
        {_t('All CourseFlow')}
      </div>
    )
  }
  if (author)
    users_group.push(
      <div className="user-name">
        {Utility.getUserTag('author')}
        {Utility.getUserDisplay(author)}
      </div>
    )

  users_group.push([
    editors
      .filter((user) => user.id !== author.id)
      .map((user) => (
        <div className="user-name">
          {Utility.getUserTag('edit')}
          {Utility.getUserDisplay(user)}
        </div>
      )),
    commenters.map((user) => (
      <div className="user-name">
        {Utility.getUserTag('comment')}
        {Utility.getUserDisplay(user)}
      </div>
    )),
    viewers.map((user) => (
      <div className="user-name">
        {Utility.getUserTag('view')}
        {Utility.getUserDisplay(user)}
      </div>
    ))
  ])
  users_group = users_group.flat(2)

  const usersFormatted = [<div className="users-group">{users_group}</div>]
  if (users_group.length > 4) {
    users.push(
      <div className="workflow-created">
        +{users_group.length - 4} {_t('more')}
      </div>
    )
  }

  if (!context.permissions.workflowPermission.readOnly)
    usersFormatted.push(
      <div
        className="user-name collapsed-text-show-more"
        onClick={openShareDialog}
      >
        {_t('Modify')}
      </div>
    )
  return <></>
}

const TypeIndicator = ({ data }: { data: any }) => {
  let type_text = window.gettext(data.type)
  if (data.is_strategy) type_text += _t(' strategy')
  return (
    <div className={'workflow-type-indicator ' + data.type}>{type_text}</div>
  )
}

const Header = ({
  users,
  data,
  openShareDialog
}: {
  users: any
  data: any
  openShareDialog: any
}) => {
  const style: React.CSSProperties = {
    border: data.lock ? '2px solid ' + data.lock.user_colour : 'inherit'
  }
  const context = useContext(WorkFlowConfigContext)

  return (
    <div
      className="project-header"
      style={style}
      onClick={(evt) => context.selectionManager.changeSelection(evt)}
    >
      <div className="project-header-top-line">
        <WorkflowTitle
          data={data}
          no_hyperlink={true}
          class_name="project-title"
        />
        <TypeIndicator data={data} />
      </div>
      <div className="project-header-info">
        <div className="project-info-section project-members">
          <h4>{_t('Permissions')}</h4>
          <Users
            users={users}
            readonly={context.permissions.workflowPermission.readOnly}
            openShareDialog={openShareDialog}
          />
        </div>
        <div className="project-other">
          <div className="project-info-section project-description">
            <h4>{_t('Description')}</h4>
            <CollapsibleText
              text={data.description}
              defaultText={_t('No description')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
