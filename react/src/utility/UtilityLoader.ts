/**
 *  this has been refactored to remove jquery
 */
export class UtilityLoader {
  private load_screen: HTMLDivElement
  constructor(identifier) {
    // Create a new div element
    this.load_screen = document.createElement('div')
    this.load_screen.className = 'load-screen'

    // Prevent default click behavior
    this.load_screen.addEventListener('click', (evt) => {
      evt.preventDefault()
    })

    let parentElement
    if (identifier instanceof jQuery) {
      // Use the first element in the jQuery object
      // @ts-ignore
      parentElement = identifier.get(0)
    } else {
      // Use querySelector to find the element
      parentElement = document.querySelector(identifier)
    }

    if (parentElement) {
      parentElement.appendChild(this.load_screen)
    } else {
      console.error(`Element with identifier "${identifier}" not found.`)
    }
  }

  endLoad() {
    // Remove the load screen from its parent
    if (this.load_screen && this.load_screen.parentNode) {
      this.load_screen.parentNode.removeChild(this.load_screen)
    }
  }
}
