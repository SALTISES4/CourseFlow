import WeekReordering from './WeekReordering'
import WeekSimple from './WeekSimple'

export type PropsType = {
  objectId: number
  parentId: number
  reordering: boolean
  columnColors?: string[]
}

const Week = ({ objectId, parentId, columnColors, reordering }: PropsType) => {
  return reordering ? (
    <WeekReordering objectId={objectId} />
  ) : (
    <WeekSimple
      objectId={objectId}
      parentId={parentId}
      columnColors={columnColors}
    />
  )
}

export default Week
