import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cf/utility/constants'
import { _t } from '@cf/utility/Utility.class'
import Utility from '@cf/utility/Utility.class'
import { TGetWeekByIDType, getWeekById } from '@cfFindState'
import ActionCreator from '@cfRedux/ActionCreator'
import { AppState, TComment, TUser, TWorkflow } from '@cfRedux/types/type'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  addCommentQuery,
  getCommentsForObjectQuery,
  removeAllComments,
  removeCommentQuery
} from '@XMLHTTP/API/comment'
import { getUsersForObjectQueryLegacy } from '@XMLHTTP/API/sharing'
import * as React from 'react'
import { DispatchProp, connect } from 'react-redux'

// @components
// import $ from 'jquery'
interface MapStateProps {
  workflow: TWorkflow
  unreadComments: TComment[]
  comments: TComment[]
}
type ConnectedProps = MapStateProps & DispatchProp

/*******************************************************
 * @CommentBox
 *
 * @todo description
 *******************************************************/
type OwnProps = {
  id: number
  show: boolean
  setShow: (show: boolean) => void
  objectType: CfObjectType
  // comments: any
  //   parent: any
  // renderer: any /  not used
  // workflowId: any
  // unreadComments: any
  // readOnly: boolean
  // addComments: any
}

type StateType = {
  tagging?: boolean
  userList?: any[]
  hasRendered?: boolean
}

type PropsType = OwnProps & ConnectedProps

class CommentBoxUnconnected extends React.Component<PropsType, StateType> {
  private input: React.RefObject<HTMLTextAreaElement>
  private submit: React.RefObject<HTMLImageElement>
  private tagPosition: number // @todo this was previously not defined
  //  private unreadComments: any
  // prevoiusly this was this.context.permissions.workflowPermissions.readOnly
  private readOnly: boolean
  // this is also the user permission on the workflow
  private addComments: boolean

  constructor(props: PropsType) {
    super(props)
    this.input = React.createRef()
    this.submit = React.createRef()
    this.state = {}
    this.tagPosition = 0 // @todo this was previously not set
    this.readOnly = false
    this.addComments = true
    //     this.unreadComments = this.props.unreadComments
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.setState({
      hasRendered: true
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
   * QUERIES
   *******************************************************/
  commentClick(evt) {
    evt.stopPropagation()
    if (!this.props.show) {
      this.reloadComments(true)
    } else {
      this.props.setShow(false)
    }
  }

  reloadComments(showComments?: boolean) {
    getCommentsForObjectQuery(
      this.props.id,
      Constants.objectDictionary[this.props.objectType],
      (responseData) => {
        this.props.dispatch(
          ActionCreator.reloadCommentsAction(
            this.props.id,
            Constants.objectDictionary[this.props.objectType],
            responseData.dataPackage
          )
        )

        if (showComments) {
          this.props.setShow(true)
        }
        // this.setState({
        //   showComments: true,
        //   commentData: responseData.dataPackage
        // })
      }
    )
  }

  removeComment(id: number) {
    if (
      window.confirm(
        _t('Are you sure you want to permanently clear this comment?')
      )
    ) {
      removeCommentQuery(
        this.props.id,
        Constants.objectDictionary[this.props.objectType],
        id,
        // no
        this.reloadComments
      )
    }
  }

  removeAllComments() {
    if (
      window.confirm(
        _t(
          'Are you sure you want to permanently clear all comments from this object?'
        )
      )
    ) {
      removeAllComments(
        this.props.id,
        Constants.objectDictionary[this.props.objectType],

        // no
        this.reloadComments
      )
    }
  }

  appendComment() {
    const text = $(this.input.current)[0].value
    if (!text) {
      return
    }

    $(this.input.current)[0].value = ''
    $(this.submit.current).addClass('hidden')

    addCommentQuery(
      this.props.id,
      Constants.objectDictionary[this.props.objectType],
      text,
      this.reloadComments
    )
  }
  /*******************************************************
   * FUNCTIONS
   *******************************************************/

  addUserTag(user: TUser) {
    const cursorPos = this.tagPosition

    const currentValue = this.input.current.value
    let toAdd = ''

    if (cursorPos > 0 && currentValue[cursorPos - 1] != ' ') {
      toAdd += ' '
    }

    toAdd += '@' + user.username + ' '

    const newValue =
      currentValue.slice(0, cursorPos) +
      toAdd +
      currentValue.slice(cursorPos + 1)

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
        this.props.workflow.id,
        'workflow',
        (response) => {
          loader.endLoad()
          this.setState({
            tagging: true,
            userList: response.dataPackage
          })
        }
      )
    } else if (this.state.tagging) {
      this.setState({ tagging: false })
    }
  }

  commentsSeen() {
    const unreadComments = this.props.unreadComments.slice()

    const comments = this.props.comments.map((comment) => comment.id)

    //  this won;t work, if we need this, it could be a state
    // this.props.unreadComments = unreadComments.filter(
    //   (comment) => comments.indexOf(comment) < 0
    // )
  }

  TagBox = () => {
    if (!this.state.tagging) {
      return <></>
    }
    return (
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

  Comments = () => {
    if (!this.props.comments) {
      return <></>
    }

    return this.props.comments.map((comment, index) => {
      const isUnread = this.props.unreadComments.indexOf(comment.id) >= 0

      let commentClass = 'comment'

      if (isUnread) {
        commentClass += ' unread'
      }

      const text = comment.text.replace(
        /@\w[@a-zA-Z0-9_.]{1,}/g,
        (val) => '<b>' + val + '</b>'
      )

      return (
        <div className={commentClass} key={index}>
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
          {!this.readOnly && (
            <div className="mouseover-actions">
              <div
                className="action-button"
                title={_t('Delete Comment')}
                onClick={this.removeComment.bind(this, comment.id)}
              >
                <DeleteIcon />
              </div>
            </div>
          )}
        </div>
      )
    })
  }

  TopComments = () => {
    const topContents = []

    topContents.push(
      <div
        className="hover-shade"
        title={_t('Close')}
        onClick={this.commentClick.bind(this)}
      >
        <CloseIcon />
      </div>
    )

    if (!this.readOnly && this.props.comments.length > 1) {
      topContents.push(
        <div
          className="hover-shade"
          title={_t('Clear All Comments')}
          onClick={this.removeAllComments.bind(this)}
        >
          <DeleteIcon />
        </div>
      )
    }

    return topContents
  }

  CommentIndicator = () => {
    const hasComments = false
    // show an icon if there are comments
    // how it even if the main comments dialog is closed

    //    return <MarkChatUnreadIcon />
    return <></>
  }

  CommentDialog = () => {
    let inputDefault = _t('Add a comment')

    if (this.props.comments && this.props.comments.length > 0) {
      inputDefault = _t('Reply')
    }
    return (
      <div
        key="comment-box"
        className="comment-box"
        onClick={(evt) => evt.stopPropagation()}
        onMouseDown={(evt) => evt.stopPropagation()}
      >
        <div className="comment-top-row">
          <this.TopComments />
        </div>
        <hr />
        <div className="comment-block">
          <this.Comments />
        </div>
        {this.addComments && (
          <div className="comment-input-line">
            <textarea
              ref={this.input}
              className="comment-input"
              placeholder={inputDefault}
              contentEditable="true"
              onInput={this.textChange.bind(this)}
            />
            <div
              ref={this.submit}
              className="add-comment-button hidden hover-shade"
              onClick={this.appendComment.bind(this)}
            >
              <AddIcon />
            </div>
          </div>
        )}
      </div>
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    return (
      <>
        {this.props.show && <this.CommentDialog />}
        <this.TagBox />
        <this.CommentIndicator />
      </>
    )
  }
}

const mapStateToProps = (state: AppState): MapStateProps => {
  return {
    workflow: state.workflow,
    unreadComments: [],
    comments: []
  }
}

const CommentBox = connect<MapStateProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(CommentBoxUnconnected)

export default CommentBox
