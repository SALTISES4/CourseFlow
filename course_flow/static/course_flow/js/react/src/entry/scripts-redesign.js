// This file is meant to be a separate entry point for the "redesigned"
// app and a place where all the code will be refactored/consolidated into
// so that we end up with a single entry point into the frontend
import React from 'react'
import reactDom from 'react-dom'

import Sidebar from '../Components/components/Layout/Sidebar.jsx'

function renderComponentIntoNode(component, node) {
  const target = document.querySelector(node)
  if (target) {
    reactDom.render(component, target)
  }
}

window.addEventListener('load', () => {
  renderComponentIntoNode(<Sidebar />, '.main-wrapper .left-panel')
})
