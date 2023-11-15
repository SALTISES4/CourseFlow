// This is a collection of snippets and inline scripts
// used in base.html template files.

// TODO: All of these functions should be eventually transferred
// into a corresponding React component that's rendering the UI

window.addEventListener('beforeprint', () => {
  $('.hide-print').hide()
  $('.workflow-wrapper, #container, body').addClass('printing')
})

window.addEventListener('afterprint', () => {
  $('.hide-print').show()
  $('.workflow-wrapper, #container, body').removeClass('printing')
})

const userAgent = navigator.userAgent.toLowerCase()
const isTablet =
  /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(
    userAgent
  )
const isMobile = /android|iphone/i.test(userAgent)
const isTouch = isMobile || isTablet
if (isTouch) {
  if (!sessionStorage.getItem('unsupported_alerted')) {
    sessionStorage.setItem('unsupported_alerted', true)
    alert(COURSEFLOW_APP.strings.unsuported_device)
  }
}

const { update_notifications } = COURSEFLOW_APP

if (
  update_notifications.title &&
  update_notifications.id !== localStorage.getItem('last_hidden_notification')
) {
  $('#update-notifications').html(
    "<div id='notification-inner'>" +
      "<span class='material-symbols-rounded filled'>campaign</span>" +
      update_notifications.title +
      '</div>' +
      "<div id='close-notification' class='window-close-button'>" +
      "<span class='material-symbols-rounded green'>close</span>" +
      '</div>'
  )
}

$('#close-notification').on('click', () => {
  localStorage.setItem('last_hidden_notification', update_notifications.id)
  $('#update-notifications').css({ display: 'none' })
})

// TODO: Remove since this is imlpemented by the Sidebar component internally
// $('.left-panel-toggle').on('click', () => {
//   $('.left-panel').toggleClass('collapsed')
//   if ($('.left-panel').hasClass('collapsed')) {
//     sessionStorage.setItem('collapsed_sidebar', true)
//   } else {
//     sessionStorage.removeItem('collapsed_sidebar')
//   }
// })

// if (!sessionStorage.getItem('collapsed_sidebar')) {
//   $('.left-panel').removeClass('collapsed')
// }
