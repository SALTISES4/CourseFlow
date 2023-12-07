window.addEventListener('load', () => {
  const home_renderer = new window.library_renderers.HomeRenderer(
    window.window.COURSEFLOW_APP.home.is_teacher
  )
  $(document).ajaxError(window.renderers.fail_function)
  home_renderer.render($('#container'))
  makeActiveSidebar('#panel-home')
})
