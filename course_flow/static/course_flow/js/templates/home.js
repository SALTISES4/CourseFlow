const { user_id, is_teacher } = COURSEFLOW_APP.home

window.addEventListener('load', () => {
  const home_renderer = new library_renderers.HomeRenderer(is_teacher)
  $(document).ajaxError(renderers.fail_function)
  home_renderer.render($('#container'))
  makeActiveSidebar('#panel-home')
})
