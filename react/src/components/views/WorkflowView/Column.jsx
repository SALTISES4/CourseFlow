import * as React from 'react'
import { connect } from 'react-redux'
import { EditableComponentWithActions } from '@cfParentComponents'
import { getColumnByID } from '@cfFindState'
import * as Constants from '@cfConstants'

/**
 * The column in a workflow.
 */
class Column extends EditableComponentWithActions {
  constructor(props) {
    super(props)
    this.objectType = 'column'
    this.objectClass = '.column'
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getIcon() {
    if (this.props.data.icon && this.props.data.icon != '') {
      return (
        <span className="material-symbols-rounded">{this.props.data.icon}</span>
      )
    }
    return (
      <img
        src={
          COURSEFLOW_APP.config.icon_path +
          Constants.default_column_settings[this.props.data.column_type].icon +
          '.svg'
        }
      />
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    let title = data.title
    if (!title) title = data.column_type_display

    const style = {}
    if (data.lock) {
      style.border = '2px solid ' + data.lock.user_colour
    }
    let css_class = 'column'
    if (data.lock) css_class += ' locked locked-' + data.lock.user_id

    const mouseover_actions = []
    if (!this.props.renderer.read_only) {
      mouseover_actions.push(this.addInsertSibling(data))
      mouseover_actions.push(this.addDuplicateSelf(data))
      mouseover_actions.push(this.addDeleteSelf(data))
    }
    if (this.props.renderer.view_comments) {
      // mouseover_actions.push(this.addCommenting(data))
      mouseover_actions.push(this.addCommenting())
    }

    return (
      <div
        ref={this.mainDiv}
        style={style}
        className={css_class}
        onClick={(evt) =>
          this.props.renderer.selection_manager.changeSelection(evt, this)
        }
      >
        <div className="column-line">
          {this.getIcon()}
          <div dangerouslySetInnerHTML={{ __html: title }}></div>
        </div>
        {this.addEditable(data)}
        <div className="mouseover-actions">{mouseover_actions}</div>
      </div>
    )
  }
}
const mapColumnStateToProps = (state, own_props) =>
  getColumnByID(state, own_props.objectID)
const mapColumnDispatchToProps = {}
export default connect(mapColumnStateToProps, null)(Column)
