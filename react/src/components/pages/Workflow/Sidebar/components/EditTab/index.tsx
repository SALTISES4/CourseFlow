import Alert from '@cfComponents/UIPrimitives/Alert'

import EditColumn from './components/EditColumn'
import EditNode from './components/EditNode'
import EditNodelink from './components/EditNodelink'
import EditOutcome from './components/EditOutcome'
import EditPart from './components/EditPart'
import EditSection from './components/EditSection'
import EditTerm from './components/EditTerm'
import { EditableType } from './types'

const EditTab = ({ uuid, type }: { uuid: string; type: EditableType }) => {
  if (!type) {
    return null
  }

  switch (type) {
    case EditableType.TERM:
      return <EditTerm key={uuid} />
    case EditableType.PART:
      return <EditPart key={uuid} />
    case EditableType.SECTION:
      return <EditSection key={uuid} sectionId={uuid} />
    case EditableType.OUTCOME:
      return <EditOutcome key={uuid} outcomeUuid={uuid} />
    case EditableType.NODE_LINK:
      return <EditNodelink key={uuid} nodeLinkId={uuid} />
    case EditableType.COLUMN:
      return <EditColumn key={uuid} columnId={uuid} />
    case EditableType.NODE:
      return <EditNode key={uuid} nodeId={uuid} />
    default:
      return (
        <Alert
          persistent
          severity="error"
          title="Woopsie"
          subtitle={`edit ${type} form not supported yet`}
        />
      )
  }
}

export default EditTab
