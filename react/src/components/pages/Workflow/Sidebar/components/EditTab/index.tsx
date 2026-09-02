import Alert from '@cfComponents/UIPrimitives/Alert'
import { useTranslation } from 'react-i18next'

import EditColumn from './components/EditColumn'
import EditNode from './components/EditNode'
import EditNodelink from './components/EditNodelink'
import EditOutcome from './components/EditOutcome'
import EditSection from './components/EditSection'
import { EditableType } from './types'

const EditTab = ({ uuid, type }: { uuid: string; type: EditableType }) => {
  const { t } = useTranslation('workflow')
  if (!type) {
    return null
  }

  switch (type) {
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
          title={t('sidebar.unavailableTitle')}
          subtitle={t('sidebar.unsupportedEditor', { type })}
        />
      )
  }
}

export default EditTab
