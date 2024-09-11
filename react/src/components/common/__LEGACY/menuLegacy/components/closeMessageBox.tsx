import * as reactDom from 'react-dom'
// import $ from 'jquery'

// @TODO THIS IS TEMPORARY
// closeMessageBox is imported by sub menus and prebviously defined inside the same file as
// renderMessageBox
//  it cannot live there (circ dependency) this will be solved by
//  a) context based modal OR
// b) passing state to individual menu instanmce
export default function closeMessageBox() {
  reactDom.unmountComponentAtNode($('#popup-container')[0])
}
