import * as React from 'react'
import { connect } from 'react-redux'
import {
  NodeTitle,
  EditableComponentWithComments
} from '../../components/CommonComponents'
import { getNodeByID } from '../../../redux/FindState.js'
import * as Constants from '../../../Constants.js'

/**
 * A node in the grid view
 */
class GridNodeUnconnected extends EditableComponentWithComments {
  constructor(props) {
    super(props)
    this.objectType = 'node'
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let renderer = this.props.renderer
    let selection_manager = renderer.selection_manager
    let data = this.props.data
    let data_override
    if (data.represents_workflow)
      data_override = { ...data, ...data.linked_workflow_data, id: data.id }
    else data_override = data
    let ponderation
    ponderation = (
      <div className="grid-ponderation">
        {data_override.ponderation_theory +
          '/' +
          data_override.ponderation_practical +
          '/' +
          data_override.ponderation_individual}
      </div>
    )

    let style = {
      backgroundColor: Constants.getColumnColour(this.props.column)
    }
    if (data.lock) {
      style.outline = '2px solid ' + data.lock.user_colour
    }
    let css_class =
      'node column-' + data.column + ' ' + Constants.node_keys[data.node_type]
    if (data.is_dropped) css_class += ' dropped'
    if (data.lock) css_class += ' locked locked-' + data.lock.user_id

    let comments
    if (this.props.renderer.view_comments) comments = this.addCommenting()

    return (
      <div
        style={style}
        id={data.id}
        ref={this.maindiv}
        onClick={(evt) => selection_manager.changeSelection(evt, this)}
        className={css_class}
      >
        <div className="node-top-row">
          <NodeTitle data={data} />
          {ponderation}
        </div>
        <div className="mouseover-actions">{comments}</div>
        <div className="side-actions">
          <div className="comment-indicator-container"></div>
        </div>
        {this.addEditable(data_override, true)}
      </div>
    )
  }
}

const mapNodeStateToProps = (state, own_props) => ({
  column: state.column.find((column) => column.id == own_props.data.column)
})
export default connect(mapNodeStateToProps, null)(GridNodeUnconnected)
