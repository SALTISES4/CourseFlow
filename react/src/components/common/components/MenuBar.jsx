import * as React from 'react'
/**
 * Creates a menu bar at the top of the page which can be passed
 * various links, buttons, etc
 */

/**
 *
 */
class MenuBar extends React.Component {
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
    COURSEFLOW_APP.makeDropdown('#overflow-options', '#overflow-links')
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const viewBar = this.props?.viewbar ? this.props?.viewbar() : null
    const userBar = this.props?.userbar ? this.props?.userbar() : null
    const visibleButtons = this.props?.visibleButtons
      ? this.props?.visibleButtons()
      : null
    const overflowLinks = this.props?.overflowLinks
      ? this.props?.overflowLinks()
      : null

    return (
      <div className="menubar">
        <div id="floatbar" className="floatbar">
          {visibleButtons && <div id="visible-icons">{visibleButtons}</div>}
          {overflowLinks && (
            <div id="overflow-options">
              <span className="hover-shade green material-symbols-rounded">
                more_horiz
              </span>

              <div id="overflow-links" className="create-dropdown">
                {overflowLinks}
              </div>
            </div>
          )}
        </div>
        <div id="userbar" className="floatbar">
          {userBar}
        </div>
        <div id="viewbar" className="floatbar">
          {viewBar}
        </div>
      </div>
    )
  }
}
export default MenuBar
