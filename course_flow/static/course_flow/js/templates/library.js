const { user_id } = COURSEFLOW_APP.home

window.addEventListener('load', () => {
  const library_renderer = new library_renderers.LibraryRenderer()
  $(document).ajaxError(renderers.fail_function)
  library_renderer.render($('#container'))
  makeActiveSidebar('#panel-my-library')
})
