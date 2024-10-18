import { apiPaths } from '@cf/router/apiRoutes'
import { _t } from '@cf/utility/utilityFunctions'
import * as Constants from '@cfConstants'
import ComponentWithToggleDrop, {
  ComponentWithToggleProps
} from '@cfEditableComponents/ComponentWithToggleDrop'
import { TUser } from '@cfRedux/types/type'
import * as Utility from '@cfUtility'
import {
  addComment,
  removeAllComments,
  removeComment
} from '@XMLHTTP/API/comment'
import { getUsersForObjectQueryLegacy } from '@XMLHTTP/API/sharing'
import * as React from 'react'
import * as reactDom from 'react-dom'

// @components
// import $ from 'jquery'

/*******************************************************
 * @CommentBox
 *
 * @todo description
 *******************************************************/
type OwnProps = {
  show: any
  comments: any
  parent: any
  // renderer: any /  not used
  workflowId: any
  unreadComments: any
  readOnly: boolean
  add_comments: any
} & ComponentWithToggleProps

type StateType = {
  tagging?: boolean
  userList?: any[]
  has_rendered?: boolean
}

type PropsType = OwnProps
class CommentBox extends ComponentWithToggleDrop<PropsType, StateType> {
  private input: React.RefObject<HTMLTextAreaElement>
  private submit: React.RefObject<HTMLImageElement>
  private tagPosition: number // @todo this was previously not defined
  private unreadComments: any
  constructor(props: PropsType) {
    super(props)
    this.input = React.createRef()
    this.submit = React.createRef()
    this.state = {}
    this.tagPosition = 0 // @todo this was previously not set
    this.unreadComments = this.props.unreadComments
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.setState({
      has_rendered: true
    })
  }

  componentDidUpdate(prevProps) {
    if (prevProps.show && !this.props.show) {
      this.commentsSeen()
      if (this.state.tagging) {
        this.setState({
          tagging: false
        })
      }
    }
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/

  addUserTag(user: TUser) {
    const cursor_pos = this.tagPosition

    const current_value = this.input.current.value
    let to_add = ''

    if (cursor_pos > 0 && current_value[cursor_pos - 1] != ' ') to_add += ' '

    to_add += '@' + user.username + ' '

    const newValue =
      current_value.slice(0, cursor_pos) +
      to_add +
      current_value.slice(cursor_pos + 1)

    this.input.current.value = newValue
    this.input.current.selectionStart = this.input.current.value.length
    this.setState({
      tagging: false
    })
  }

  textChange(evt) {
    if (
      $(this.input.current)[0].value &&
      $(this.input.current)[0].value != ''
    ) {
      $(this.submit.current).removeClass('hidden')
    } else {
      $(this.submit.current).addClass('hidden')
    }
    if (evt.nativeEvent && evt.nativeEvent.data === '@') {
      this.tagPosition = this.input.current.selectionStart - 1
      const loader = COURSEFLOW_APP.tinyLoader
      loader.startLoad()
      getUsersForObjectQueryLegacy(
        this.props.workflowId,
        'workflow',
        (response) => {
          loader.endLoad()
          this.setState({
            tagging: true,
            userList: response.editors.concat(response.commentors)
          })
        }
      )
    } else if (this.state.tagging) {
      this.setState({ tagging: false })
    }
  }

  removeComment(id: number) {
    const parent = this.props.parent
    const props = parent.props
    if (
      window.confirm(
        _t('Are you sure you want to permanently clear this comment?')
      )
    ) {
      removeComment(
        props.objectId,
        Constants.objectDictionary[parent.objectType],
        id,
        parent.reloadComments.bind(parent)
      )
    }
  }

  removeAllComments() {
    const parent = this.props.parent
    const props = parent.props
    if (
      window.confirm(
        _t(
          'Are you sure you want to permanently clear all comments from this object?'
        )
      )
    ) {
      removeAllComments(
        props.objectId,
        Constants.objectDictionary[parent.objectType],
        parent.reloadComments.bind(parent)
      )
    }
  }

  appendComment() {
    const text = $(this.input.current)[0].value
    if (!text) return
    const parent = this.props.parent
    const props = parent.props
    $(this.input.current)[0].value = ''
    $(this.submit.current).addClass('hidden')
    addComment(
      props.objectId,
      Constants.objectDictionary[parent.objectType],
      text,
      parent.reloadComments.bind(parent)
    )
  }

  commentsSeen() {
    const unreadComments = this.unreadComments.slice()

    const comments = this.props.comments.map((comment) => comment.id)

    this.unreadComments = unreadComments.filter(
      (comment) => comments.indexOf(comment) < 0
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let has_comments = false

    const has_unread =
      this.props.comments.filter((value) => {
        // @todo unreadComments is undefined
        return this.unreadComments?.includes(value)
      }).length > 0

    if (this.state.has_rendered) {
      has_comments = this.props.comments.length > 0
    }

    let render_div
    const side_actions = $(this.props.parent?.mainDiv?.current)
      .children('.side-actions')
      .children('.comment-indicator-container')
    if (side_actions.length > 0) render_div = side_actions[0]
    else render_div = this.props.parent?.mainDiv?.current
    let comment_indicator = null
    if (has_comments) {
      let indicator_class = 'comment-indicator hover-shade'
      if (has_unread) indicator_class += ' unread'
      comment_indicator = reactDom.createPortal(
        <div
          className={indicator_class}
          onClick={this.props.parent.commentClick.bind(this.props.parent)}
        >
          <img src={apiPaths.external.static_assets.icon + 'comment_new.svg'} />
        </div>,
        render_div
      )
    }

    if (!this.props.show) {
      return comment_indicator
    }

    let comments
    if (this.props.comments)
      comments = this.props.comments.map((comment, index) => {
        const is_unread = this.unreadComments.indexOf(comment.id) >= 0
        let comment_class = 'comment'
        if (is_unread) comment_class += ' unread'
        const text = comment.text.replace(
          /@\w[@a-zA-Z0-9_.]{1,}/g,
          (val) => '<b>' + val + '</b>'
        )

        return (
          <div className={comment_class} key={index}>
            <div className="comment-by">
              <div className="comment-user">
                {Utility.getUserDisplay(comment.user)}
              </div>
              <div className="comment-on">{comment.createdOn}</div>
            </div>
            <div
              className="comment-text"
              dangerouslySetInnerHTML={{ __html: text }}
            />
            {!this.props.readOnly && (
              <div className="mouseover-actions">
                <div
                  className="action-button"
                  title={_t('Delete Comment')}
                  onClick={this.removeComment.bind(this, comment.id)}
                >
                  <img
                    src={apiPaths.external.static_assets.icon + 'rubbish.svg'}
                  />
                </div>
              </div>
            )}
          </div>
        )
      })

    const top_contents = []
    top_contents.push(
      <div
        className="hover-shade"
        title={_t('Close')}
        onClick={this.props.parent.commentClick.bind(this.props.parent)}
      >
        <img src={apiPaths.external.static_assets.icon + 'close.svg'} />
      </div>
    )
    if (!this.props.readOnly && comments.length > 1)
      top_contents.push(
        <div
          className="hover-shade"
          title={_t('Clear All Comments')}
          onClick={this.removeAllComments.bind(this)}
        >
          <img src={apiPaths.external.static_assets.icon + 'rubbish.svg'} />
        </div>
      )

    let input_default = _t('Add a comment')
    if (this.props.comments && this.props.comments.length > 0)
      input_default = _t('Reply')

    let tag_box
    if (this.state.tagging) {
      tag_box = (
        <div className="comment-tag-box">
          {this.state.userList.map((user, index) => (
            <div
              key={index}
              className="user-name hover-shade"
              onClick={this.addUserTag.bind(this, user)}
            >
              {Utility.getUserDisplay(user)}
            </div>
          ))}
        </div>
      )
    }

    return reactDom.createPortal(
      [
        <div
          key="comment-box"
          className="comment-box"
          onClick={(evt) => evt.stopPropagation()}
          onMouseDown={(evt) => evt.stopPropagation()}
        >
          <div className="comment-top-row">{top_contents}</div>
          <hr />
          <div className="comment-block">{comments}</div>
          {this.props.add_comments && (
            <div className="comment-input-line">
              <textarea
                ref={this.input}
                className="comment-input"
                placeholder={input_default}
                contentEditable="true"
                onInput={this.textChange.bind(this)}
              />
              <img
                ref={this.submit}
                src={apiPaths.external.static_assets.icon + 'add_new.svg'}
                className="add-comment-button hidden hover-shade"
                onClick={this.appendComment.bind(this)}
                title={_t('Submit')}
              />
            </div>
          )}
        </div>,
        tag_box,
        comment_indicator
      ],
      render_div
    )
  }
}

export default CommentBox
