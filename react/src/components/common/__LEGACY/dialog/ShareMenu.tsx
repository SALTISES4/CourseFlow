import { _t } from '@cf/utility/utilityFunctions'

// import $ from 'jquery'
import UserAdd from '@cfComponents/dialog/components/UserAdd'
import UserLabel from '@cfComponents/dialog/components/UserLabel'
import AddLinkIcon from '@mui/icons-material/AddLink'
import BlockIcon from '@mui/icons-material/Block'
import CloseIcon from '@mui/icons-material/Close'
import CodeIcon from '@mui/icons-material/Code'
import LinkIcon from '@mui/icons-material/Link'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import PublicIcon from '@mui/icons-material/Public'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import {
  getUsersForObjectQueryLegacy,
  setUserPermission
} from '@XMLHTTP/API/sharing'
import { updateValueInstantQuery } from '@XMLHTTP/API/update'
import { EUser } from '@XMLHTTP/types/entity'
import * as React from 'react'

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
  cannotChange: number[]
  published?: boolean
  publicView?: boolean
  saltiseUser: boolean
  isTemplate: boolean
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
      cannotChange: [],
      saltiseUser: false,
      isTemplate: false
    }
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    getUsersForObjectQueryLegacy(
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
          publicView: response.publicView,
          cannotChange: response.cannotChange,
          saltiseUser: response.saltiseUser,
          isTemplate: response.isTemplate
        })
      }
    )
  }

  togglePublicView(publicView) {
    if (publicView) {
      if (
        window.confirm(
          _t(
            'Please note: this will make a publicly accessible link to your workflow, which can be accessed even by those without an account. They will still not be able to edit your workflow.'
          )
        )
      ) {
        updateValueInstantQuery(
          this.props.data.id,
          'workflow',
          { publicView: publicView },
          () => {
            this.setState({ publicView: publicView })
          }
        )
      }
    } else {
      updateValueInstantQuery(
        this.props.data.id,
        'workflow',
        { publicView: publicView },
        () => {
          this.setState({ publicView: publicView })
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
        _t(
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
    const isTemplate = !this.state.isTemplate
    updateValueInstantQuery(
      component.props.data.id,
      component.props.data.type,
      { isTemplate: isTemplate },
      () => component.setState({ isTemplate: isTemplate })
    )
  }

  setUserPermission(permissionType, user) {
    COURSEFLOW_APP.tinyLoader.startLoad()
    setUserPermission(
      user.id,
      this.props.data.id,
      this.props.data.type,
      permissionType,
      () => {
        getUsersForObjectQueryLegacy(
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
      COURSEFLOW_APP.globalContextData.path.html.public_update_path_temp.replace(
        '0',
        String(data.id)
      )

    if (data.type !== 'project') {
      const publicView = this.state.publicView
      if (!publicView)
        return (
          <div
            className="public-link-button  hover-shade"
            onClick={this.togglePublicView.bind(this, !publicView)}
          >
            <div className="public-link-icon">
              <AddLinkIcon />
            </div>
            <div>
              <div className="public-link-text">
                {_t('Generate a public link')}
              </div>
              <div className="public-link-description">
                {_t('Anyone with the link will be able to view the workflow')}
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
                <LinkIcon />
              </div>
              <div>
                <div className="copy-link-text">{_t('Copy public link')}</div>
                <div className="public-link-description">
                  {_t('Anyone with the link can view the workflow')}
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
                console.log('copy_icon_text')
                console.log(copy_icon_text)

                const copy_description_text = $(
                  '#public-page-code .copy-link-text'
                ).text()

                /*       <DoneIcon /> */
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
                <CodeIcon />
              </div>
              <div>
                <div className="copy-link-text">{_t('Copy embed code')}</div>
                <div className="public-link-description">
                  {_t('HTML code to embed the workflow in a site or page')}
                </div>
              </div>
            </div>
          </div>,
          <div
            className="public-link-button public-link-remove  hover-shade"
            onClick={this.togglePublicView.bind(this, !publicView)}
          >
            <div className="public-link-icon">
              <LinkOffIcon />
            </div>
            <div>
              <div className="public-link-text">{_t('Remove public link')}</div>
            </div>
          </div>
        ]
    }
  }

  Publication = () => {
    const published = this.state.published
    const data = this.props.data
    if (data.type === 'project' || data.isStrategy) {
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
      const public_text = _t('Any CourseFlow teacher can view')
      let disabled_indicator

      if (public_disabled) {
        const disabled_text =
          data.type == 'project'
            ? _t('Title and disciplines are required to publish.')
            : _t('Title is required to publish.')

        disabled_indicator = (
          <div className="warning flex-middle">
            {/* red */}
            <BlockIcon />
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
            <PublicIcon />
            <div className="big-button-title">{_t('Public to CourseFlow')}</div>
            <div className="big-button-description">{public_text}</div>
          </div>

          <div
            className={private_class}
            onClick={this.setPublication.bind(this, false)}
          >
            <VisibilityOffIcon />
            <div className="big-button-title">{_t('Private')}</div>
            <div className="big-button-description">
              {_t('Only added collaborators can view')}
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
              <PublicIcon />
              <div className="big-button-title">
                {_t('Project public to CourseFlow')}
              </div>
              <div className="big-button-description">
                {_t('Any CourseFlow teacher can view')}
              </div>
            </div>
          </div>
        )
      else
        published_icon = (
          <div className="big-buttons-wrapper">
            <div className="big-button active">
              <VisibilityOffIcon />
              <div className="big-button-title">{_t('Project is private')}</div>
              <div className="big-button-description">
                {_t('Only added collaborators can view')}
              </div>
            </div>
          </div>
        )
      return [published_icon, <this.PublicLink />]
    }
  }

  IsTemplate = () => {
    if (this.state.published && this.state.saltiseUser) {
      return [
        <input
          id="toggle-is-template"
          type="checkbox"
          checked={this.state.isTemplate}
          onClick={this.toggleTemplate.bind(this)}
        />,
        <label htmlFor="toggle-is-template">
          {_t('Make Available As Template')}
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
          cannotChange={this.state.cannotChange}
          permissionChange={this.setUserPermission.bind(this)}
        />
      ))
    const viewers = this.state.view.map((user) => (
      <UserLabel
        user={user}
        type={'view'}
        cannotChange={this.state.cannotChange}
        permissionChange={this.setUserPermission.bind(this)}
      />
    ))
    const commentors = this.state.comment.map((user) => (
      <UserLabel
        user={user}
        type={'comment'}
        cannotChange={this.state.cannotChange}
        permissionChange={this.setUserPermission.bind(this)}
      />
    ))
    const students = this.state.student.map((user) => (
      <UserLabel
        user={user}
        type={'student'}
        cannotChange={this.state.cannotChange}
        permissionChange={this.setUserPermission.bind(this)}
      />
    ))

    let shareInfo
    if (data.type === 'project') {
      shareInfo = _t('Invite collaborators to project and its workflows')
    } else {
      shareInfo = _t(
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
          <p>{_t('Shared With')}:</p>
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
          {_t('Share') + ' ' + _t(data.type) + ' '}
          {/*<WorkflowTitle*/}
          {/*  noHyperlink={true}*/}
          {/*  data={this.props.data}*/}
          {/*  class_name={'inline'}*/}
          {/*/>*/}
          title placeholder
        </h2>
        <this.Publication />
        <this.IsTemplate />
        <hr />
        <p>{_t('Owned By')}:</p>
        <div>{owner}</div>
        <hr />
        <UserAdd
          permissionChange={this.setUserPermission.bind(this)}
          shareInfo={shareInfo}
        />
        {shared_with}
        <div
          className="window-close-button"
          onClick={this.props.actionFunction}
        >
          {/* green */}
          <CloseIcon />
        </div>
        <div className="action-bar">
          <button
            className="secondary-button"
            onClick={this.props.actionFunction}
          >
            {_t('Close')}
          </button>
        </div>
      </div>
    )
  }
}

export default ShareMenu
