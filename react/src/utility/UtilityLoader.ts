/**
 *  this has been refactored to remove jquery
 */
export class UtilityLoader {
  private loadScreen: HTMLDivElement
  constructor(identifier) {
    // Create a new div element
    this.loadScreen = document.createElement('div')
    this.loadScreen.className = 'load-screen'

    // Prevent default click behavior
    this.loadScreen.addEventListener('click', (evt) => {
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
      parentElement.appendChild(this.loadScreen)
    } else {
      console.error(`Element with identifier "${identifier}" not found.`)
    }
  }

  endLoad() {
    // Remove the load screen from its parent
    if (this.loadScreen && this.loadScreen.parentNode) {
      this.loadScreen.parentNode.removeChild(this.loadScreen)
    }
  }
}
