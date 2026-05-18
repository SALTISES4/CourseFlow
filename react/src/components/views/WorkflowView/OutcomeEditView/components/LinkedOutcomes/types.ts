export type LinkedOutcomesPropsType = {
  parent: {
    uuid: string
    type: 'node' | 'outcome'
  }
  outcomes: number[]
  highlight?: boolean
}
