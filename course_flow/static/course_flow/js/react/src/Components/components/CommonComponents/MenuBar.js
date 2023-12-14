/**
 * Creates a menu bar at the top of the page which can be passed
 * various links, buttons, etc
 */
import * as React from 'react'

export default class extends React.Component {
  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.dropdownOverflow()
  }

  componentDidUpdate() {
    this.dropdownOverflow()
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  dropdownOverflow() {
    makeDropdown('#overflow-options', '#overflow-links')
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let overflow_links
    if (this.props.overflow_links) overflow_links = this.props.overflow_links()
    let visible_buttons
    if (this.props.visible_buttons)
      visible_buttons = this.props.visible_buttons()
    let viewbar
    if (this.props.viewbar) viewbar = this.props.viewbar()
    let userbar
    if (this.props.userbar) userbar = this.props.userbar()

    return (
      <div className="menubar">
        <div id="floatbar" className="floatbar">
          <div id="visible-icons">{visible_buttons}</div>
          <div id="overflow-options">
            <span className="hover-shade green material-symbols-rounded">
              more_horiz
            </span>
            <div id="overflow-links" className="create-dropdown">
              {overflow_links}
            </div>
          </div>
        </div>
        <div id="userbar" className="floatbar">
          {userbar}
        </div>
        <div id="viewbar" className="floatbar">
          {viewbar}
        </div>
      </div>
    )
  }
}
