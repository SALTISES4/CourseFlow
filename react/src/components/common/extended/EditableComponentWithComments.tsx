import * as React from 'react'
import * as Constants from '@cfConstants'
// @components
import ActionButton from '@cfUIComponents/ActionButton'
import EditableComponent, {
  EditableComponentProps, EditableComponentStateType
} from '@cfParentComponents/EditableComponent'
import ActionCreator from '@cfRedux/ActionCreator'
import CommentBox from '@cfViews/GridView/components/CommentBox'
import { getCommentsForObjectQuery } from '@cfModule/XMLHTTP/APIFunctions'

type StateType = {
  show_comments: boolean

} & EditableComponentStateType

type OwnProps = {
  dispatch?: any
} & EditableComponentProps

export type EditableComponentWithCommentsType = OwnProps
export type EditableComponentWithCommentsStateType = StateType

class EditableComponentWithComments<
  P extends OwnProps,
  S extends StateType
> extends EditableComponent<P, S> {
  //Adds a button that opens/closes the comments dialogue
  // @todo sometimes dota is not used
  // addCommenting(data) {
  // addCommenting(_data: any) {

  addCommenting() {
    return (
      <>
        <ActionButton
          buttonIcon="comment_new.svg"
          buttonClass="comment-button"
          titleText={window.gettext('Comments')}
          handleClick={this.commentClick.bind(this)}
        />
        <CommentBox
          show={this.state.show_comments}
          comments={this.props.data.comments}
          parent={this}
          renderer={this.props.renderer}
          workflowID={this.props.renderer.workflowID}
          unread_comments={this.props.renderer.unread_comments}
          read_only={this.props.renderer.read_only}
          add_comments={this.props.renderer.add_comments}
        />
      </>
    )
  }

  commentClick(evt) {
    evt.stopPropagation()
    if (!this.state.show_comments) {
      this.reloadComments(true)
    } else this.setState({ show_comments: false })
  }

  reloadComments(show_comments: boolean) {
    const data = this.props.data
    COURSEFLOW_APP.tinyLoader.startLoad()
    getCommentsForObjectQuery(
      data.id,
      Constants.object_dictionary[this.objectType],
      (response_data) => {
        this.props.dispatch(
          ActionCreator.reloadCommentsAction(
            this.props.data.id,
            Constants.object_dictionary[this.objectType],
            response_data.data_package
          )
        )
        if (show_comments) {
          this.setState({ show_comments: true })
        }
        //this.setState({show_comments:true,comment_data:response_data.data_package});
        COURSEFLOW_APP.tinyLoader.endLoad()
      }
    )
  }
}

export default EditableComponentWithComments
