// This is a collection of snippets and inline scripts
// used in base.html template files.

// TODO: All of these functions should be eventually transferred
// into a corresponding React component that's rendering the UI

const makeActiveSidebar = function (id) {
  $(id)
    .addClass("active")
}

/*******************************************************
 * makeDropdown
 *******************************************************/
const makeDropdown = (click_element) => {
  if ($(click_element)
    .hasClass("dropdown-ready")) return

  $(click_element)
    .addClass("dropdown-ready")

  let checkPosition = () => {
    const dropdown = $(click_element)
      .children(".create-dropdown")
    let width = dropdown.outerWidth(true)
    let left = $(click_element)
      .offset().left
    if (left + width > $(window)
      .width()) {
      dropdown.addClass("position-right")
    } else {
      dropdown.removeClass("position-right")
    }
  }

  $(click_element)
    .on("click", () => {
      if ($(click_element)
        .attr("disabled") !== "disabled") {
        $(click_element)
          .children(".create-dropdown")
          .toggleClass("active")
        checkPosition()
      }
    })

  document.addEventListener("click", (evt) => {
    if (!$(evt.target)
      .closest(click_element)[0]) {
      $(click_element)
        .children(".create-dropdown")
        .removeClass("active")
    }
  })

  // check_position();
  // window.addEventListener("resize",check_position);
}
COURSEFLOW_APP.makeDropdown = makeDropdown
/*******************************************************
 *  // makeDropdown
 *******************************************************/


// @todo quill is not global anymore, and quill may or may not be loaded into JS scope
// this piece needs to be moved, hack this for now with try/catch
try {
// Fix Quilljs's link sanitization
  const QuillLink = Quill.import("formats/link")

// Override the existing property on the Quill global object and add custom protocols
  QuillLink.PROTOCOL_WHITELIST = ["http", "https"]

  class CustomLinkSanitizer extends QuillLink {
    static sanitize(url) {
      // Run default sanitize method from Quill
      const sanitizedUrl = super.sanitize(url)

      // Not whitelisted URL based on protocol so, let's return `blank`
      if (!sanitizedUrl || sanitizedUrl === "about:blank") return sanitizedUrl

      // Verify if the URL already have a whitelisted protocol
      const hasWhitelistedProtocol = this.PROTOCOL_WHITELIST.some(
        function (protocol) {
          return sanitizedUrl.startsWith(protocol)
        },
      )

      if (hasWhitelistedProtocol) return sanitizedUrl

      // if not, then append only 'http' to not to be a relative URL
      return `http://${sanitizedUrl}`
    }
  }

// @todo scope issue
  Quill.register(CustomLinkSanitizer, true)

} catch (e) {
  console.log('quill not loaded')

}
