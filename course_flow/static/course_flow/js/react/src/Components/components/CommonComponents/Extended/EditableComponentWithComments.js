import * as React from 'react'
import * as reactDom from 'react-dom'
import {
  addComment,
  getCommentsForObject,
  getUsersForObject,
  removeAllComments,
  removeComment
} from '../../../../XMLHTTP/PostFunctions.js'
import * as Constants from '../../../../Constants.js'
import * as Utility from '../../../../UtilityFunctions.js'
import { reloadCommentsAction } from '../../../../redux/Reducers.js'
// @components
import Component from './Component.js'
import ActionButton from '../ActionButton.js'
import EditableComponent from './EditableComponent.js'

/*******************************************************
 * @CommentBox
 *
 * @todo description
 *******************************************************/
class CommentBox extends Component {
  constructor(props) {
    super(props)
    this.input = React.createRef()
    this.submit = React.createRef()
    this.state = {}
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.setState({ has_rendered: true })
  }

  componentDidUpdate(prevProps) {
    if (prevProps.show && !this.props.show) {
      this.commentsSeen()
      if (this.state.tagging) this.setState({ tagging: false })
    }
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/

  addUserTag(user) {
    let cursor_pos = this.tag_position
    let current_value = this.input.current.value
    let to_add = ''
    if (cursor_pos > 0 && current_value[cursor_pos - 1] != ' ') to_add += ' '
    to_add += '@' + user.username + ' '
    let new_value =
      current_value.slice(0, cursor_pos) +
      to_add +
      current_value.slice(cursor_pos + 1)
    this.input.current.value = new_value
    this.input.current.selectionStart = this.input.current.value.length
    this.setState({ tagging: false })
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
    if (evt.nativeEvent && evt.nativeEvent.data == '@') {
      this.tag_position = this.input.current.selectionStart - 1
      let renderer = this.props.renderer
      renderer.tiny_loader.startLoad()
      getUsersForObject(
        this.props.renderer.workflowID,
        'workflow',
        (response) => {
          renderer.tiny_loader.endLoad()
          this.setState({
            tagging: true,
            user_list: response.editors.concat(response.commentors)
          })
        }
      )
    } else if (this.state.tagging) {
      this.setState({ tagging: false })
    }
  }

  removeComment(id) {
    let parent = this.props.parent
    let props = parent.props
    if (
      window.confirm(
        gettext('Are you sure you want to permanently clear this comment?')
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
    let parent = this.props.parent
    let props = parent.props
    if (
      window.confirm(
        gettext(
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
    let text = $(this.input.current)[0].value
    if (!text) return
    let parent = this.props.parent
    let props = parent.props
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
    let unread_comments = this.props.renderer.unread_comments.slice()
    let comments = this.props.comments.map((comment) => comment.id)
    this.props.renderer.unread_comments = unread_comments.filter(
      (comment) => comments.indexOf(comment) < 0
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let has_comments = false

    let has_unread =
      this.props.comments.filter((value) => {
        // @todo unread_comments is undefined
        return this.props?.renderer?.unread_comments?.includes(value)
      }).length > 0

    if (this.state.has_rendered) {
      has_comments = this.props.comments.length > 0
    }

    let render_div
    let side_actions = $(this.props.parent.maindiv.current)
      .children('.side-actions')
      .children('.comment-indicator-container')
    if (side_actions.length > 0) render_div = side_actions[0]
    else render_div = this.props.parent.maindiv.current
    let comment_indicator = null
    if (has_comments) {
      let indicator_class = 'comment-indicator hover-shade'
      if (has_unread) indicator_class += ' unread'
      comment_indicator = reactDom.createPortal(
        <div
          className={indicator_class}
          onClick={this.props.parent.commentClick.bind(this.props.parent)}
        >
          <img src={window.config.icon_path + 'comment_new.svg'} />
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
        let is_unread =
          this.props.renderer.unread_comments.indexOf(comment.id) >= 0
        let comment_class = 'comment'
        if (is_unread) comment_class += ' unread'
        let text = comment.text.replace(
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
            {!this.props.renderer.read_only && (
              <div className="mouseover-actions">
                <div
                  className="action-button"
                  title={gettext('Delete Comment')}
                  onClick={this.removeComment.bind(this, comment.id)}
                >
                  <img src={window.config.icon_path + 'rubbish.svg'} />
                </div>
              </div>
            )}
          </div>
        )
      })

    let top_contents = []
    top_contents.push(
      <div
        className="hover-shade"
        title={gettext('Close')}
        onClick={this.props.parent.commentClick.bind(this.props.parent)}
      >
        <img src={window.config.icon_path + 'close.svg'} />
      </div>
    )
    if (!this.props.renderer.read_only && comments.length > 1)
      top_contents.push(
        <div
          className="hover-shade"
          title={gettext('Clear All Comments')}
          onClick={this.removeAllComments.bind(this)}
        >
          <img src={window.config.icon_path + 'rubbish.svg'} />
        </div>
      )

    let input_default = gettext('Add a comment')
    if (this.props.comments && this.props.comments.length > 0)
      input_default = gettext('Reply')

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
          {this.props.renderer.add_comments && (
            <div className="comment-input-line">
              <textarea
                className="comment-input"
                placeholder={input_default}
                contentEditable="true"
                onInput={this.textChange.bind(this)}
                ref={this.input}
              />
              <img
                ref={this.submit}
                src={window.config.icon_path + 'add_new.svg'}
                className="add-comment-button hidden hover-shade"
                onClick={this.appendComment.bind(this)}
                title={gettext('Submit')}
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

//Extends the react component to add a few features that are used in a large number of components
class EditableComponentWithComments extends EditableComponent {
  //Adds a button that opens/closes the comments dialogue
  addCommenting(data) {
    return [
      <ActionButton
        button_icon="comment_new.svg"
        button_class="comment-button"
        titletext={gettext('Comments')}
        handleClick={this.commentClick.bind(this)}
      />,
      <CommentBox
        show={this.state.show_comments}
        comments={this.props.data.comments}
        parent={this}
        renderer={this.props.renderer}
      />
    ]
  }

  commentClick(evt) {
    evt.stopPropagation()
    if (!this.state.show_comments) {
      this.reloadComments(true)
    } else this.setState({ show_comments: false })
  }

  reloadComments(show_comments) {
    let props = this.props
    let data = props.data
    props.renderer.tiny_loader.startLoad()
    getCommentsForObject(
      data.id,
      Constants.object_dictionary[this.objectType],
      (response_data) => {
        this.props.dispatch(
          reloadCommentsAction(
            this.props.data.id,
            Constants.object_dictionary[this.objectType],
            response_data.data_package
          )
        )
        if (show_comments) {
          this.setState({ show_comments: true })
        }
        //this.setState({show_comments:true,comment_data:response_data.data_package});
        props.renderer.tiny_loader.endLoad()
      }
    )
  }
}

export default EditableComponentWithComments
