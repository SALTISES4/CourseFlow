import { EditableDataType, EditableType } from '../../types'

const getNodeCategoryData = (
  id: number
): EditableDataType<EditableType.NODE_CATEGORY> => {
  return {
    title: 'Node category name here'
  }
}

export default getNodeCategoryData
