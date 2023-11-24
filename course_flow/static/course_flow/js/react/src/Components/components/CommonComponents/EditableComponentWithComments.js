import * as React from 'react'
import { getCommentsForObject } from '../../../PostFunctions.js'
import * as Constants from '../../../Constants.js'
import { reloadCommentsAction } from '../../../Reducers.js'

//Extends the react component to add a few features that are used in a large number of components
export class EditableComponentWithComments extends EditableComponent {
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
