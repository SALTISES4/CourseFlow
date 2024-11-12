import { EditableDataType, EditableType } from '../../types'

const getWeekData = (id: number): EditableDataType<EditableType.WEEK> => {
  return {
    title: 'Week name here'
  }
}

export default getWeekData
