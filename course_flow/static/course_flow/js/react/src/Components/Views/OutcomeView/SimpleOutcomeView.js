//Basic component representing an outcome in a node, or somewhere else where it doesn't have to do anything
import * as React from 'react'
import { EditableComponentWithComments } from '../../components/CommonComponents/Extended'
import { OutcomeTitle } from '../../components/CommonComponents/UIComponents'
import * as Utility from '../../../UtilityFunctions.js'
import { SimpleOutcomeOutcomeView } from '../OutcomeOutcomeView.js'
import { connect } from 'react-redux'
import { getOutcomeByID } from '../../../redux/FindState.js'

export class SimpleOutcomeViewUnconnected extends EditableComponentWithComments {
  constructor(props) {
    super(props)
    this.objectType = 'outcome'
    this.children_block = React.createRef()
    this.state = { is_dropped: false }
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    if (this.props.checkHidden) this.props.checkHidden()
  }

  componentDidUpdate() {
    if (this.props.checkHidden) this.props.checkHidden()
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  toggleDrop() {
    this.setState({ is_dropped: !this.state.is_dropped })
  }

  getChildType(outcomeoutcome) {
    let data = this.props.data
    return (
      <SimpleOutcomeOutcomeView
        key={outcomeoutcome}
        objectID={outcomeoutcome}
        parentID={data.id}
        renderer={this.props.renderer}
        comments={this.props.comments}
        edit={this.props.edit}
      />
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.data
    let children
    let dropIcon
    let droptext
    let comments
    let edit
    let onClick

    if (Utility.checkSetHidden(data, this.props.object_sets)) return null
    if (this.state.is_dropped) {
      children = data.child_outcome_links.map((outcomeoutcome) =>
        this.getChildType(outcomeoutcome)
      )
    }

    if (this.state.is_dropped) dropIcon = 'droptriangleup'
    else dropIcon = 'droptriangledown'

    if (this.state.is_dropped) droptext = window.gettext('hide')
    else
      droptext =
        window.gettext('show ') +
        data.child_outcome_links.length +
        ' ' +
        nwindow.gettext('descendant', 'descendants', data.child_outcome_links.length)

    if (this.props.renderer.view_comments) comments = this.addCommenting()

    if (this.props.edit) edit = this.addEditable(data, true)
    onClick = (evt) =>
      this.props.renderer.selection_manager.changeSelection(evt, this)

    let css_class = 'outcome outcome-' + data.id
    if (this.state.is_dropped) css_class += ' dropped'
    if (data.lock) css_class += ' locked locked-' + data.lock.user_id

    return (
      <div
        className={css_class}
        style={this.get_border_style()}
        ref={this.maindiv}
        onClick={onClick}
      >
        <div className="outcome-title">
          <OutcomeTitle
            data={data}
            prefix={this.props.prefix}
            hovertext={this.props.hovertext}
          />
        </div>
        {data.depth < 2 && data.child_outcome_links.length > 0 && (
          <div className="outcome-drop" onClick={this.toggleDrop.bind(this)}>
            <div className="outcome-drop-img">
              <img src={window.config.icon_path + dropIcon + '.svg'} />
            </div>
            <div className="outcome-drop-text">{droptext}</div>
          </div>
        )}
        {data.depth < 2 && (
          <div
            className="children-block"
            id={this.props.objectID + '-children-block'}
            ref={this.children_block}
          >
            {children}
          </div>
        )}
        <div className="mouseover-actions">{comments}</div>
        <div className="side-actions">
          <div className="comment-indicator-container" />
        </div>
        {edit}
      </div>
    )
  }
}

/*******************************************************
 * MAP STATE
 *******************************************************/
const mapOutcomeStateToProps = (state, own_props) =>
  getOutcomeByID(state, own_props.objectID)

/*******************************************************
 * CONNECT REDUX
 *******************************************************/
const SimpleOutcomeView = connect(
  mapOutcomeStateToProps,
  null
)(SimpleOutcomeViewUnconnected)

export default SimpleOutcomeView
