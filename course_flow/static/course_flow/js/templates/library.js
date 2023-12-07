const { user_id } = window.COURSEFLOW_APP.home

window.addEventListener('load', () => {
  waitUntilElementExists('.menubar').then((el) => {
    el.classList.remove('hidden')
  })

  const library_renderer = new window.library_renderers.LibraryRenderer()
  $(document).ajaxError(window.renderers.fail_function)
  library_renderer.render($('#container'))
  makeActiveSidebar('#panel-my-library')
})
