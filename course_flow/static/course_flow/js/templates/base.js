// This is a collection of snippets and inline scripts
// used in base.html template files.

// TODO: All of these functions should be eventually transferred
// into a corresponding React component that's rendering the UI

window.addEventListener("beforeprint", () => {
  $(".hide-print").hide();
  $(".workflow-wrapper, #container, body").addClass("printing");
});

window.addEventListener("afterprint", () => {
  $(".hide-print").show();
  $(".workflow-wrapper, #container, body").removeClass("printing");
});

const userAgent = navigator.userAgent.toLowerCase();
const isTablet =
  /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(
    userAgent,
  );
const isMobile = /android|iphone/i.test(userAgent);
const isTouch = isMobile || isTablet;
if (isTouch) {
  if (!sessionStorage.getItem("unsupported_alerted")) {
    sessionStorage.setItem("unsupported_alerted", true);
    alert(COURSEFLOW_APP.strings.unsuported_device);
  }
}
