// This is a collection of snippets and inline scripts
// used in various HTML template files.

// TODO: All of these functions should be eventually transferred
// into a corresponding React component that's rendering the UI

const debounce = (func, timeout = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this,args);
    }, timeout);
  };
}

$('#logout').on('click', () => {
  window.location.replace(config.logout_path);
});

const makeActiveSidebar = function(id) {
  $(id).addClass('active');
}

const makeDropdown = (click_element) => {
  let checkPosition = () => {
    const dropdown = $(click_element).children('.create-dropdown');
    let width = dropdown.outerWidth(true);
    let left = $(click_element).offset().left;
    if (left + width > $(window).width()) {
      dropdown.addClass('position-right');
    } else {
      dropdown.removeClass('position-right');
    }
  }

  $(click_element).on('click', () => {
    if ($(click_element).attr('disabled') !== 'disabled') {
      $(click_element).children('.create-dropdown').toggleClass('active');
      checkPosition();
    }
  });

  document.addEventListener('click', evt => {
    if (!$(evt.target).closest(click_element)[0]) {
      $(click_element).children('.create-dropdown').removeClass('active');
    }
  });

  // check_position();
  // window.addEventListener("resize",check_position);
}

makeDropdown('#overflow-options', '#overflow-links');
makeDropdown('#account-options', '#account-links');
makeDropdown('#notifications', '#notifications-dropdown');
makeDropdown('#create-options', '#create-links');
