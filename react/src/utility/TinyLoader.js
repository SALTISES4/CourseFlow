// @todo this should be a component with managed state
export class TinyLoader {
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
