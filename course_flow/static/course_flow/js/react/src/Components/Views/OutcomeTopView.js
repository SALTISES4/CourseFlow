import * as React from 'react'
import * as reactDom from 'react-dom'
import { connect } from 'react-redux'
import { EditableComponent } from '../components/CommonComponents'
import OutcomeView from './OutcomeView.js'
import { OutcomeBarOutcomeView } from './OutcomeView.js'
import { getOutcomeByID } from '../../FindState.js'
import { renderMessageBox } from '../components/MenuComponents/MenuComponents.js'
import { WorkflowForMenu } from '../Library'
import closeMessageBox from '../components/MenuComponents/components/closeMessageBox.js'

//Basic component representing the outcome view
class OutcomeTopView extends EditableComponent {
  constructor(props) {
    super(props)
    this.objectType = 'outcome'
  }

  render() {
    let data = this.props.data
    var selector = this
    let share
    if (!this.props.renderer.read_only)
      share = (
        <div
          id="share-button"
          className="floatbardiv"
          onClick={renderMessageBox.bind(
            this,
            data,
            'share_menu',
            closeMessageBox
          )}
        >
          <img src={config.icon_path + 'add_person.svg'} />
          <div>Sharing</div>
        </div>
      )

    return (
      <div id="outcome-wrapper" className="workflow-wrapper">
        <div className="workflow-container">
          <div className="workflow-details">
            <WorkflowForMenu
              workflow_data={data}
              selected={this.state.selected}
              selectAction={(evt) => {
                this.props.renderer.selection_manager.changeSelection(
                  evt,
                  selector
                )
              }}
            />
            {reactDom.createPortal(share, $('#floatbar')[0])}
            <OutcomeView objectID={data.id} renderer={this.props.renderer} />
          </div>
        </div>
        {this.addEditable(data)}
      </div>
    )
  }
}

const mapOutcomeStateToProps = (state, own_props) =>
  getOutcomeByID(state, own_props.objectID)
export default connect(mapOutcomeStateToProps, null)(OutcomeTopView)

class OutcomeBarUnconnected extends React.Component {
  render() {
    let data = this.props.data
    var outcomebaroutcomes = data.map((outcome) => (
      <OutcomeBarOutcomeView
        key={outcome.outcome}
        objectID={outcome.outcome}
        renderer={this.props.renderer}
      />
    ))

    return reactDom.createPortal(
      <div id="outcome-bar-workflow" className="right-panel-inner">
        <h4 className="drag-and-drop">Outcomes:</h4>
        <div className="outcome-bar-outcome-block">{outcomebaroutcomes}</div>
      </div>,
      $('#outcome-bar')[0]
    )
  }
}
const mapOutcomeBarStateToProps = (state) => ({ data: state.outcomeproject })
export const OutcomeBar = connect(
  mapOutcomeBarStateToProps,
  null
)(OutcomeBarUnconnected)
