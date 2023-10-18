// This is a collection of snippets and inline scripts
// used in base.html template files.

// TODO: All of these functions should be eventually transferred
// into a corresponding React component that's rendering the UI

const debounce = (func, timeout = 300) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this, args)
    }, timeout)
  }
}

$('#logout').on('click', () => {
  window.location.replace(config.logout_path)
})

const makeActiveSidebar = function (id) {
  $(id).addClass('active')
}

const makeDropdown = (click_element) => {
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

makeDropdown('#overflow-options', '#overflow-links')
makeDropdown('#account-options', '#account-links')
makeDropdown('#notifications', '#notifications-dropdown')
makeDropdown('#create-options', '#create-links')

// reload if we got here using forward or back button
if (
  window.performance &&
  window.performance.navigation.type ===
    window.performance.navigation.TYPE_BACK_FORWARD
) {
  location.reload()
}

$(window).on('load', () => {
  $('#create-links #activity-create').on('click', () => {
    renderers.CreateNew(config.create_path.activity)
  })

  $('#create-links #course-create').on('click', () => {
    renderers.CreateNew(config.create_path.course)
  })

  $('#create-links #program-create').on('click', () => {
    renderers.CreateNew(config.create_path.program)
  })

  if (COURSEFLOW_APP.show_notification_request) {
    const confirmNotifications = window.confirm(
      COURSEFLOW_APP.strings.confirm_email_updates
    )

    $.post(config.post_paths.select_notifications, {
      notifications: JSON.stringify(!!confirmNotifications)
    })
  }

  if ($('.create-dropdown .list-notification.unread').length > 0) {
    $('#notifications').addClass('unread')
  }
})

// Fix Quilljs's link sanitization
const Link = Quill.import('formats/link')
// Override the existing property on the Quill global object and add custom protocols
Link.PROTOCOL_WHITELIST = ['http', 'https']

class CustomLinkSanitizer extends Link {
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

Quill.register(CustomLinkSanitizer, true)
