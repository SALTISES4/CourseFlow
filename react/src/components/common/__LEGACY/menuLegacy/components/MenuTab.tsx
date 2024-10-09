import { _t } from '@cf/utility/utilityFunctions'
import MenuSection from '@cfComponents/__LEGACY/menuLegacy/components/MenuSection'
import * as React from 'react'

type PropsType = {
  data: any
  type: any
  identifier: any
  noHyperlink?: any
  selected_id?: any
  selectAction?: any
  dispatch?: any
  parentID?: any
  duplicate?: any
}

/**
 *  A tab for the menu of workflows.
 */
class MenuTab extends React.Component<PropsType> {
  render() {
    let is_empty = true
    for (let i = 0; i < this.props.data.sections.length; i++) {
      if (this.props.data.sections[i].objects.length > 0) {
        is_empty = false
        break
      }
    }
    let replacement_text
    if (is_empty) replacement_text = this.props.data.emptytext
    const sections = this.props.data.sections.map((section, i) => (
      <MenuSection
        noHyperlink={this.props.noHyperlink}
        type={this.props.type}
        replacement_text={i == 0 ? replacement_text : null}
        section_data={section}
        add={this.props.data.add}
        selected_id={this.props.selected_id}
        dispatch={this.props.dispatch}
        selectAction={this.props.selectAction}
        parentID={this.props.parentID}
        duplicate={this.props.data.duplicate}
      />
    ))
    return <div id={'tabs-' + this.props.identifier}>{sections}</div>
  }
}

export default MenuTab
