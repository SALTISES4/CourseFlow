import * as React from 'react'
import * as Constants from '@cfConstants'
// @components
import ActionButton from '@cfCommonComponents/UIComponents/ActionButton'
import EditableComponent, {
  EditableComponentProps,
  EditableComponentStateType
} from '@cfEditableComponents/EditableComponent'
import ActionCreator from '@cfRedux/ActionCreator'
import CommentBox from '@cfViews/Workflow/GridView/components/CommentBox'
import { getCommentsForObjectQuery } from '@XMLHTTP/API/comment'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'

type StateType = {
  show_comments: boolean
} & EditableComponentStateType

type OwnProps = {
  dispatch?: any
  // legacyRenderer: LegacyRendererProps & {
  //   workflowID: any
  //   unread_comments: any
  //   add_comments: any
  // }
} & EditableComponentProps

export type EditableComponentWithCommentsType = OwnProps
export type EditableComponentWithCommentsStateType = StateType

class EditableComponentWithComments<
  P extends OwnProps,
  S extends StateType
> extends EditableComponent<P, S> {
  static contextType = WorkFlowConfigContext

  declare context: React.ContextType<typeof WorkFlowConfigContext>

  //Adds a button that opens/closes the comments dialogue
  // @todo sometimes dota is not used
  // addCommenting(data) {
  // addCommenting(_data: any) {

  /*******************************************************
   * FUNCTIONS
   *******************************************************/

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

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  AddCommenting = () => {
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
          // renderer={this.props.renderer} // not used
          workflowID={this.context.workflowID}
          unread_comments={this.context.unread_comments}
          read_only={this.context.read_only}
          add_comments={this.context.add_comments}
        />
      </>
    )
  }
}

export default EditableComponentWithComments
