import * as React from 'react'
import * as reactDom from 'react-dom'
import {
  addComment,
  removeAllComments,
  removeComment
} from '@XMLHTTP/PostFunctions'
import * as Constants from '@cfConstants'
import * as Utility from '@cfUtility'
// @components
import { getUsersForObjectQuery } from '@XMLHTTP/APIFunctions'
// import $ from 'jquery'
import ComponentWithToggleDrop, {
  ComponentWithToggleProps
} from '@cfParentComponents/ComponentWithToggleDrop'
import { User } from '@XMLHTTP/types'

/*******************************************************
 * @CommentBox
 *
 * @todo description
 *******************************************************/
type OwnProps = {
  show: any
  comments: any
  parent: any
  renderer: any
  workflowID: any
  unread_comments: any
  read_only: boolean
  add_comments: any
} & ComponentWithToggleProps

type StateType = {
  tagging?: boolean
  user_list?: any[]
  has_rendered?: boolean
}

type PropsType = OwnProps
class CommentBox extends ComponentWithToggleDrop<PropsType, StateType> {
  private input: React.RefObject<HTMLTextAreaElement>
  private submit: React.RefObject<HTMLImageElement>
  private tagPosition: number // @todo this was previously not defined
  private unread_comments: any
  constructor(props: PropsType) {
    super(props)
    this.input = React.createRef()
    this.submit = React.createRef()
    this.state = {}
    this.tagPosition = 0 // @todo this was previously not set
    this.unread_comments = this.props.unread_comments
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

  addUserTag(user: User) {
    const cursor_pos = this.tagPosition

    const current_value = this.input.current.value
    let to_add = ''

    if (cursor_pos > 0 && current_value[cursor_pos - 1] != ' ') to_add += ' '

    to_add += '@' + user.username + ' '

    const new_value =
      current_value.slice(0, cursor_pos) +
      to_add +
      current_value.slice(cursor_pos + 1)

    this.input.current.value = new_value
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
      getUsersForObjectQuery(this.props.workflowID, 'workflow', (response) => {
        loader.endLoad()
        this.setState({
          tagging: true,
          user_list: response.editors.concat(response.commentors)
        })
      })
    } else if (this.state.tagging) {
      this.setState({ tagging: false })
    }
  }

  removeComment(id: number) {
    const parent = this.props.parent
    const props = parent.props
    if (
      window.confirm(
        window.gettext(
          'Are you sure you want to permanently clear this comment?'
        )
      )
    ) {
      removeComment(
        props.objectID,
        Constants.object_dictionary[parent.objectType],
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
        window.gettext(
          'Are you sure you want to permanently clear all comments from this object?'
        )
      )
    ) {
      removeAllComments(
        props.objectID,
        Constants.object_dictionary[parent.objectType],
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
      props.objectID,
      Constants.object_dictionary[parent.objectType],
      text,
      parent.reloadComments.bind(parent)
    )
  }

  commentsSeen() {
    const unread_comments = this.unread_comments.slice()

    const comments = this.props.comments.map((comment) => comment.id)

    this.unread_comments = unread_comments.filter(
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
        // @todo unread_comments is undefined
        return this.unread_comments?.includes(value)
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
          <img src={COURSEFLOW_APP.config.icon_path + 'comment_new.svg'} />
        </div>,
        render_div
      )
    }

    if (!this.props.show) {
      return comment_indicator
    }

    let comments
    if (this.props.comments)
      comments = this.props.comments.map((comment) => {
        const is_unread = this.unread_comments.indexOf(comment.id) >= 0
        let comment_class = 'comment'
        if (is_unread) comment_class += ' unread'
        const text = comment.text.replace(
          /@\w[@a-zA-Z0-9_.]{1,}/g,
          (val) => '<b>' + val + '</b>'
        )
        return (
          <div className={comment_class}>
            <div className="comment-by">
              <div className="comment-user">
                {Utility.getUserDisplay(comment.user)}
              </div>
              <div className="comment-on">{comment.created_on}</div>
            </div>
            <div
              className="comment-text"
              dangerouslySetInnerHTML={{ __html: text }}
            />
            {!this.props.read_only && (
              <div className="mouseover-actions">
                <div
                  className="action-button"
                  title={window.gettext('Delete Comment')}
                  onClick={this.removeComment.bind(this, comment.id)}
                >
                  <img src={COURSEFLOW_APP.config.icon_path + 'rubbish.svg'} />
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
        title={window.gettext('Close')}
        onClick={this.props.parent.commentClick.bind(this.props.parent)}
      >
        <img src={COURSEFLOW_APP.config.icon_path + 'close.svg'} />
      </div>
    )
    if (!this.props.read_only && comments.length > 1)
      top_contents.push(
        <div
          className="hover-shade"
          title={window.gettext('Clear All Comments')}
          onClick={this.removeAllComments.bind(this)}
        >
          <img src={COURSEFLOW_APP.config.icon_path + 'rubbish.svg'} />
        </div>
      )

    let input_default = window.gettext('Add a comment')
    if (this.props.comments && this.props.comments.length > 0)
      input_default = window.gettext('Reply')

    let tag_box
    if (this.state.tagging) {
      tag_box = (
        <div className="comment-tag-box">
          {this.state.user_list.map((user) => (
            <div
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
                src={COURSEFLOW_APP.config.icon_path + 'add_new.svg'}
                className="add-comment-button hidden hover-shade"
                onClick={this.appendComment.bind(this)}
                title={window.gettext('Submit')}
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
