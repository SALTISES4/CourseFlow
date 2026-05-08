import Alert from '@cf/components/common/UIPrimitives/Alert'

import EditColumn from './components/EditColumn'
import EditNode from './components/EditNode'
import EditNodelink from './components/EditNodelink'
import EditOutcome from './components/EditOutcome'
import EditPart from './components/EditPart'
import EditSection from './components/EditSection'
import EditTerm from './components/EditTerm'
import { EditableType } from './types'

const EditTab = ({ id, type }: { uuid: string; type: EditableType }) => {
  if (!type) {
    return null
  }

  switch (type) {
    case EditableType.TERM:
      return <EditTerm key={id} />
    case EditableType.PART:
      return <EditPart key={id} />
    case EditableType.SECTION:
      return <EditSection key={id} sectionId={id} />
    case EditableType.OUTCOME:
      return <EditOutcome key={id} outcomeId={id} />
    case EditableType.NODE_LINK:
      return <EditNodelink key={id} nodeLinkId={id} />
    case EditableType.COLUMN:
      return <EditColumn key={id} columnId={id} />
    case EditableType.NODE:
      return <EditNode key={id} nodeId={id} />
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
