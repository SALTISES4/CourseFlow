export type LinkedOutcomesPropsType = {
  parent: {
    uuid: string
    type: 'node' | 'outcome'
    graphUuid?: string
  }
  outcomes: string[]
  highlight?: boolean
}
