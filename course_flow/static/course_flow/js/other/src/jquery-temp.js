// @todo should not be inline
const debounce = (func, timeout = 300) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this, args)
    }, timeout)
  }
}

// @todo should not be inline
const makeActiveSidebar = function (id) {
  $(id).addClass('active')
}

// @todo should not be inline
const makeDropdown = (click_element) => {
  let checkPosition = () => {
    let width = $(click_element).children('.create-dropdown').outerWidth(true)
    let left = $(click_element).offset().left
    if (left + width > $(window).width())
      $(click_element).children('.create-dropdown').addClass('position-right')
    else
      $(click_element)
        .children('.create-dropdown')
        .removeClass('position-right')
  }

  $(click_element).on('click', (evt) => {
    if ($(click_element).attr('disabled') !== 'disabled') {
      $(click_element).children('.create-dropdown').toggleClass('active')
      checkPosition()
    }
  })
  document.addEventListener('click', (evt) => {
    if (!$(evt.target).closest(click_element)[0])
      $(click_element).children('.create-dropdown').removeClass('active')
  })
}

// @todo should not be inline
makeDropdown('#account-options', '#account-links')
makeDropdown('#notifications', '#notifications-dropdown')
makeDropdown('#create-options', '#create-links')
