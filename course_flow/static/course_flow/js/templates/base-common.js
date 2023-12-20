// This is a collection of snippets and inline scripts
// used in base.html template files.

// TODO: All of these functions should be eventually transferred
// into a corresponding React component that's rendering the UI

// Helper/utility function to ensure DOM element exists
// before other code executes
function waitUntilElementExists(selector) {
  let itvl
  return new Promise((res, rej) => {
    itvl = setInterval(() => {
      const el = document.querySelector(selector)
      if (el) {
        clearInterval(itvl)
        res(el)
      }
    }, 20)
  })
}

const debounce = (func, timeout = 300) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this, args)
    }, timeout)
  }
}

const makeActiveSidebar = function (id) {
  $(id).addClass('active')
}

/*******************************************************
 * makeDropdown
 *******************************************************/
const makeDropdown = (click_element) => {
  if ($(click_element).hasClass('dropdown-ready')) return

  $(click_element).addClass('dropdown-ready')

  let checkPosition = () => {
    const dropdown = $(click_element).children('.create-dropdown')
    let width = dropdown.outerWidth(true)
    let left = $(click_element).offset().left
    if (left + width > $(window).width()) {
      dropdown.addClass('position-right')
    } else {
      dropdown.removeClass('position-right')
    }
  }

  $(click_element).on('click', () => {
    if ($(click_element).attr('disabled') !== 'disabled') {
      $(click_element).children('.create-dropdown').toggleClass('active')
      checkPosition()
    }
  })

  document.addEventListener('click', (evt) => {
    if (!$(evt.target).closest(click_element)[0]) {
      $(click_element).children('.create-dropdown').removeClass('active')
    }
  })

  // check_position();
  // window.addEventListener("resize",check_position);
}
COURSEFLOW_APP.makeDropdown = makeDropdown
/*******************************************************
 *  // makeDropdown
 *******************************************************/

// reload if we got here using forward or back button
if (
  window.performance &&
  window.performance.navigation.type ===
    window.performance.navigation.TYPE_BACK_FORWARD
) {
  location.reload()
}

$(window).on('load', () => {
  waitUntilElementExists('#overflow-options').then((el) => {
    makeDropdown(el, '#overflow-links')
  })
  waitUntilElementExists('#account-options').then((el) => {
    makeDropdown(el, '#account-links')
  })
  waitUntilElementExists('#notifications').then((el) => {
    makeDropdown(el, '#notifications-dropdown')
  })
  waitUntilElementExists('#create-options').then((el) => {
    makeDropdown(el, '#create-links')
  })

  if (COURSEFLOW_APP.show_notification_request) {
    const confirmNotifications = window.confirm(
      COURSEFLOW_APP.strings.confirm_email_updates
    )

    $.post(COURSEFLOW_APP.config.post_paths.select_notifications, {
      notifications: JSON.stringify(!!confirmNotifications)
    })
  }

  if ($('.create-dropdown .list-notification.unread').length > 0) {
    $('#notifications').addClass('unread')
  }
})

// @todo imports go at top
// Fix Quilljs's link sanitization
const QuillLink = Quill.import('formats/link')
// Override the existing property on the Quill global object and add custom protocols
QuillLink.PROTOCOL_WHITELIST = ['http', 'https']

class CustomLinkSanitizer extends QuillLink {
  static sanitize(url) {
    // Run default sanitize method from Quill
    const sanitizedUrl = super.sanitize(url)

    // Not whitelisted URL based on protocol so, let's return `blank`
    if (!sanitizedUrl || sanitizedUrl === 'about:blank') return sanitizedUrl

    // Verify if the URL already have a whitelisted protocol
    const hasWhitelistedProtocol = this.PROTOCOL_WHITELIST.some(
      function (protocol) {
        return sanitizedUrl.startsWith(protocol)
      }
    )

    if (hasWhitelistedProtocol) return sanitizedUrl

    // if not, then append only 'http' to not to be a relative URL
    return `http://${sanitizedUrl}`
  }
}

// @todo scope issue
Quill.register(CustomLinkSanitizer, true)

function fail_function(a, b, c, d) {
  if (typeof a === 'string') {
    alert(b)
    alert(
      a +
        ' - ' +
        window.gettext('Something went wrong. Please reload the page.')
    )
  } else if (a && a.type === 'ajaxError') {
    if (b.status === 429) {
      alert(
        window.gettext(
          'Too many requests from your IP address. Please wait and try again later.'
        )
      )
    } else if (b.status === 403 || b.status === 401 || b.status === 500) {
      alert(b.status + ' ' + window.gettext('error at ') + ' ' + c.url)
    } else
      alert(
        a +
          b.status +
          c +
          window.gettext('final Something went wrong. Please reload the page.')
      )
  } else {
    alert(
      a +
        b.status +
        c +
        window.gettext('final Something went wrong. Please reload the page.')
    )
  }
}
