import * as React from 'react'
import { WorkflowTitle } from '@cfCommonComponents/UIComponents/Titles'

// import $ from 'jquery'
import UserLabel from '@cfCommonComponents/dialog/components/UserLabel'
import UserAdd from '@cfCommonComponents/dialog/components/UserAdd'
import { getUsersForObjectQuery, setUserPermission } from '@XMLHTTP/API/sharing'
import { updateValueInstantQuery } from '@XMLHTTP/API/update'
import { EUser } from '@XMLHTTP/types/entity'

type PropsType = {
  data: any
  actionFunction: any
}
type StateType = {
  owner: EUser
  edit: EUser[]
  view: EUser[]
  comment: EUser[]
  student: EUser[]
  userlist: EUser[]
  cannot_change: number[]
  published?: boolean
  public_view?: boolean
  saltise_user: boolean
  is_template: boolean
}

/*******************************************************
 *
 *******************************************************/
export class ShareMenu extends React.Component<PropsType, StateType> {
  constructor(props: PropsType) {
    super(props)
    this.state = {
      owner: props.data.author,
      edit: [],
      view: [],
      comment: [],
      student: [],
      userlist: [],
      cannot_change: [],
      saltise_user: false,
      is_template: false
    }
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    getUsersForObjectQuery(
      this.props.data.id,
      this.props.data.type,
      (response) => {
        this.setState({
          owner: response.author,
          view: response.viewers,
          comment: response.commentors,
          edit: response.editors,
          student: response.students,
          published: response.published,
          public_view: response.public_view,
          cannot_change: response.cannot_change,
          saltise_user: response.saltise_user,
          is_template: response.is_template
        })
      }
    )
  }

  togglePublicView(public_view) {
    if (public_view) {
      if (
        window.confirm(
          window.gettext(
            'Please note: this will make a publicly accessible link to your workflow, which can be accessed even by those without an account. They will still not be able to edit your workflow.'
          )
        )
      ) {
        updateValueInstantQuery(
          this.props.data.id,
          'workflow',
          { public_view: public_view },
          () => {
            this.setState({ public_view: public_view })
          }
        )
      }
    } else {
      updateValueInstantQuery(
        this.props.data.id,
        'workflow',
        { public_view: public_view },
        () => {
          this.setState({ public_view: public_view })
        }
      )
    }
  }

  setPublication(published) {
    if (published === this.state.published) return
    const component = this
    if (
      !published ||
      window.confirm(
        window.gettext(
          'Are you sure you want to publish this project, making it fully visible to anyone with an account?'
        )
      )
    ) {
      updateValueInstantQuery(
        component.props.data.id,
        component.props.data.type,
        { published: published },
        () => component.setState({ published: published })
      )
    }
  }

  toggleTemplate() {
    const component = this
    const is_template = !this.state.is_template
    updateValueInstantQuery(
      component.props.data.id,
      component.props.data.type,
      { is_template: is_template },
      () => component.setState({ is_template: is_template })
    )
  }

  setUserPermission(permission_type, user) {
    COURSEFLOW_APP.tinyLoader.startLoad()
    setUserPermission(
      user.id,
      this.props.data.id,
      this.props.data.type,
      permission_type,
      () => {
        getUsersForObjectQuery(
          this.props.data.id,
          this.props.data.type,
          (response) => {
            this.setState({
              view: response.viewers,
              comment: response.commentors,
              edit: response.editors,
              student: response.students
            })
            COURSEFLOW_APP.tinyLoader.endLoad()
          }
        )
      }
    )
  }
  /*******************************************************
   * COMPONENTS
   *******************************************************/
  PublicLink = () => {
    const data = this.props.data
    const public_link =
      'https://' +
      window.location.host +
      COURSEFLOW_APP.path.html.public_update_path_temp.replace(
        '0',
        String(data.id)
      )

    if (data.type !== 'project') {
      const public_view = this.state.public_view
      if (!public_view)
        return (
          <div
            className="public-link-button  hover-shade"
            onClick={this.togglePublicView.bind(this, !public_view)}
          >
            <div className="public-link-icon">
              <span className="material-symbols-rounded">add_link</span>
            </div>
            <div>
              <div className="public-link-text">
                {window.gettext('Generate a public link')}
              </div>
              <div className="public-link-description">
                {window.gettext(
                  'Anyone with the link will be able to view the workflow'
                )}
              </div>
            </div>
          </div>
        )
      else
        return [
          <div className="flex-middle">
            <div
              id="public-page-link"
              className="public-link-button  hover-shade"
              onClick={() => {
                navigator.clipboard.writeText(public_link)
                const copy_icon_text = $(
                  '#public-page-link .copy-link-icon .material-symbols-rounded'
                ).text()
                const copy_description_text = $(
                  '#public-page-link .copy-link-text'
                ).text()
                $(
                  '#public-page-link .copy-link-icon .material-symbols-rounded'
                ).text('done')
                $('#public-page-link .copy-link-text').text(
                  'Copied to Clipboard'
                )
                setTimeout(() => {
                  $(
                    '#public-page-link .copy-link-icon .material-symbols-rounded'
                  ).text(copy_icon_text)
                  $('#public-page-link .copy-link-text').text(
                    copy_description_text
                  )
                }, 1000)
              }}
            >
              <div className="copy-link-icon">
                <span className="material-symbols-rounded">link</span>
              </div>
              <div>
                <div className="copy-link-text">
                  {window.gettext('Copy public link')}
                </div>
                <div className="public-link-description">
                  {window.gettext('Anyone with the link can view the workflow')}
                </div>
              </div>
            </div>
            <div
              id="public-page-code"
              className="public-link-button  hover-shade"
              onClick={() => {
                const iframe =
                  '<iframe style="margin:0px;width:100%;height:1200px;border:0px;" src="' +
                  public_link +
                  '"></iframe>'
                navigator.clipboard.writeText(iframe)
                const copy_icon_text = $(
                  '#public-page-code .copy-link-icon .material-symbols-rounded'
                ).text()
                const copy_description_text = $(
                  '#public-page-code .copy-link-text'
                ).text()
                $(
                  '#public-page-code .copy-link-icon .material-symbols-rounded'
                ).text('done')
                $('#public-page-code .copy-link-text').text(
                  'Copied to Clipboard'
                )
                setTimeout(() => {
                  $(
                    '#public-page-code .copy-link-icon .material-symbols-rounded'
                  ).text(copy_icon_text)
                  $('#public-page-code .copy-link-text').text(
                    copy_description_text
                  )
                }, 1000)
              }}
            >
              <div className="copy-link-icon">
                <span className="material-symbols-rounded">frame_source</span>
              </div>
              <div>
                <div className="copy-link-text">
                  {window.gettext('Copy embed code')}
                </div>
                <div className="public-link-description">
                  {window.gettext(
                    'HTML code to embed the workflow in a site or page'
                  )}
                </div>
              </div>
            </div>
          </div>,
          <div
            className="public-link-button public-link-remove  hover-shade"
            onClick={this.togglePublicView.bind(this, !public_view)}
          >
            <div className="public-link-icon">
              <span className="material-symbols-rounded">link_off</span>
            </div>
            <div>
              <div className="public-link-text">
                {window.gettext('Remove public link')}
              </div>
            </div>
          </div>
        ]
    }
  }

  Publication = () => {
    const published = this.state.published
    const data = this.props.data
    if (data.type === 'project' || data.is_strategy) {
      let public_class = 'big-button make-public'
      let private_class = 'big-button hover-shade make-private'

      if (published) {
        public_class += ' active'
      } else {
        private_class += ' active'
      }

      let public_disabled = !(data.title && data.title.length > 0)

      if (data.type == 'project') {
        // @ts-ignore
        public_disabled |= data.disciplines.length == 0 // @todo not allowed
      }

      if (!public_disabled && !published) public_class += ' hover-shade'
      if (public_disabled) public_class += ' disabled'
      const public_text = window.gettext('Any CourseFlow teacher can view')
      let disabled_indicator

      if (public_disabled) {
        const disabled_text =
          data.type == 'project'
            ? window.gettext('Title and disciplines are required to publish.')
            : window.gettext('Title is required to publish.')

        disabled_indicator = (
          <div className="warning flex-middle">
            <span className="material-symbols-rounded red">block</span>
            <div>{disabled_text}</div>
          </div>
        )
      }

      return [
        <div className="big-buttons-wrapper">
          <div
            className={public_class}
            // @ts-ignore @todo disabled is not allowed on a div
            disabled={public_disabled}
            onClick={this.setPublication.bind(this, true && !public_disabled)}
          >
            <span className="material-symbols-rounded">public</span>
            <div className="big-button-title">
              {window.gettext('Public to CourseFlow')}
            </div>
            <div className="big-button-description">{public_text}</div>
          </div>

          <div
            className={private_class}
            onClick={this.setPublication.bind(this, false)}
          >
            <span className="material-symbols-rounded filled">
              visibility_off
            </span>
            <div className="big-button-title">{window.gettext('Private')}</div>
            <div className="big-button-description">
              {window.gettext('Only added collaborators can view')}
            </div>
          </div>
        </div>,
        disabled_indicator
      ]
    } else {
      let published_icon
      if (published)
        published_icon = (
          <div className="big-buttons-wrapper">
            <div className="big-button active">
              <span className="material-symbols-rounded">public</span>
              <div className="big-button-title">
                {window.gettext('Project public to CourseFlow')}
              </div>
              <div className="big-button-description">
                {window.gettext('Any CourseFlow teacher can view')}
              </div>
            </div>
          </div>
        )
      else
        published_icon = (
          <div className="big-buttons-wrapper">
            <div className="big-button active">
              <span className="material-symbols-rounded filled">
                visibility_off
              </span>
              <div className="big-button-title">
                {window.gettext('Project is private')}
              </div>
              <div className="big-button-description">
                {window.gettext('Only added collaborators can view')}
              </div>
            </div>
          </div>
        )
      return [published_icon, <this.PublicLink />]
    }
  }

  IsTemplate = () => {
    if (this.state.published && this.state.saltise_user) {
      return [
        <input
          id="toggle-is-template"
          type="checkbox"
          checked={this.state.is_template}
          onClick={this.toggleTemplate.bind(this)}
        />,
        <label htmlFor="toggle-is-template">
          {window.gettext('Make Available As Template')}
        </label>
      ]
    }
    return null
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    const owner = <UserLabel user={this.state.owner} type={'owner'} />
    const editors = this.state.edit
      .filter((user) => user.id !== this.state.owner.id)
      .map((user) => (
        <UserLabel
          user={user}
          type={'edit'}
          cannot_change={this.state.cannot_change}
          permissionChange={this.setUserPermission.bind(this)}
        />
      ))
    const viewers = this.state.view.map((user) => (
      <UserLabel
        user={user}
        type={'view'}
        cannot_change={this.state.cannot_change}
        permissionChange={this.setUserPermission.bind(this)}
      />
    ))
    const commentors = this.state.comment.map((user) => (
      <UserLabel
        user={user}
        type={'comment'}
        cannot_change={this.state.cannot_change}
        permissionChange={this.setUserPermission.bind(this)}
      />
    ))
    const students = this.state.student.map((user) => (
      <UserLabel
        user={user}
        type={'student'}
        cannot_change={this.state.cannot_change}
        permissionChange={this.setUserPermission.bind(this)}
      />
    ))

    let share_info
    if (data.type === 'project') {
      share_info = window.gettext(
        'Invite collaborators to project and its workflows'
      )
    } else {
      share_info = window.gettext(
        'Invite collaborators to workflow and grant view permissions to the project'
      )
    }
    let shared_with
    if (
      editors.length ||
      commentors.length ||
      viewers.length ||
      students.length
    ) {
      shared_with = [
        <hr />,
        <div className="user-panel">
          <p>{window.gettext('Shared With')}:</p>
          <ul className="user-list">
            {editors}
            {commentors}
            {viewers}
            {students}
          </ul>
        </div>
      ]
    }

    return (
      <div className="message-wrap user-text">
        <h2>
          {window.gettext('Share') + ' ' + window.gettext(data.type) + ' '}
          <WorkflowTitle
            no_hyperlink={true}
            data={this.props.data}
            class_name={'inline'}
          />
        </h2>
        <this.Publication />
        <this.IsTemplate />
        <hr />
        <p>{window.gettext('Owned By')}:</p>
        <div>{owner}</div>
        <hr />
        <UserAdd
          permissionChange={this.setUserPermission.bind(this)}
          share_info={share_info}
        />
        {shared_with}
        <div
          className="window-close-button"
          onClick={this.props.actionFunction}
        >
          <span className="green material-symbols-rounded">close</span>
        </div>
        <div className="action-bar">
          <button
            className="secondary-button"
            onClick={this.props.actionFunction}
          >
            {window.gettext('Close')}
          </button>
        </div>
      </div>
    )
  }
}

export default ShareMenu
