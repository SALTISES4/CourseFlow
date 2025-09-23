import { EditableDataType, EditableType } from '../../types'

const getNodelinkData = (
  id: number
): EditableDataType<EditableType.NODE_LINK> => {
  return {
    title: 'Node link name here',
    textPosition: 2,
    dashed: false
  }
}

export default getNodelinkData
