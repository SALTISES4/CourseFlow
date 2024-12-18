import WeekReordering from './WeekReordering'
import WeekSimple from './WeekSimple'

export type PropsType = {
  objectId: number
  parentId: number
  reordering: boolean
}

const Week = ({ objectId, parentId, reordering }: PropsType) => {
  return reordering ? (
    <WeekReordering objectId={objectId} />
  ) : (
    <WeekSimple objectId={objectId} parentId={parentId} />
  )
}

export default Week
