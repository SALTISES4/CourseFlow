/**
 * note this was previously
 * TinyLoader
 * this is a generic loading animation which uses a body class and changes the mouse cursor
 * it pushes/pops loading queue to a global class instance
 *
 * this pattern should be reexamined, but it doesn't make sense to go through the trouble of
 * creating a context for this until
 * a) class component pattern is settled
 * b) loading design is reviewed
 * therefore, for now it is declared in the global scope
 */
export class MouseCursorLoader {
  constructor(identifier = $('body')[0]) {
    this.identifier = identifier
    this.loadings = 0
  }

  startLoad() {
    $(this.identifier).addClass('waiting')
    this.loadings++
  }

  endLoad() {
    if (this.loadings > 0) {
      this.loadings--
    }

    if (this.loadings <= 0) {
      $(this.identifier).removeClass('waiting')
    }
  }
}
