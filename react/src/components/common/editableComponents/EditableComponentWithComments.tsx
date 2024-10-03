import * as Constants from '@cf/constants'
// @components
import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { _t } from '@cf/utility/utilityFunctions'
import ActionButton from '@cfComponents/UIPrimitives/ActionButton'
import EditableComponent, {
  EditableComponentProps,
  EditableComponentStateType
} from '@cfEditableComponents/EditableComponent'
import ActionCreator from '@cfRedux/ActionCreator'
import CommentBox from '@cfViews/WorkflowView/componentViews/GridView/components/CommentBox'
import { getCommentsForObjectQuery } from '@XMLHTTP/API/comment'
import * as React from 'react'

type StateType = {
  show_comments: boolean
} & EditableComponentStateType

type OwnProps = {
  // @todo fix this
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
      Constants.objectDictionary[this.objectType],
      (responseData) => {
        this.props.dispatch(
          ActionCreator.reloadCommentsAction(
            this.props.data.id,
            Constants.objectDictionary[this.objectType],
            responseData.dataPackage
          )
        )
        if (show_comments) {
          this.setState({ show_comments: true })
        }
        //this.setState({show_comments:true,comment_data:responseData.dataPackage});
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
          titleText={_t('Comments')}
          handleClick={this.commentClick.bind(this)}
        />
        {/*

        */}
        <CommentBox
          show={this.state.show_comments}
          comments={this.props.data.comments}
          parent={this}
          // renderer={this.props.renderer} // not used
          workflowId={this.context.workflow.workflowId}
          unreadComments={this.context.workflow.unreadComments}
          readOnly={this.context.permissions.workflowPermissions.readOnly}
          add_comments={this.context.workflow.add_comments}
        />
      </>
    )
  }
}

export default EditableComponentWithComments
