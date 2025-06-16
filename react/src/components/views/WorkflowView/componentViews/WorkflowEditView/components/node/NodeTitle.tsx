import { _t } from '@cf/utility/Utility.class'
import { TNode } from '@cfRedux/types/type'

export const NodeTitle = ({ node }: { node: TNode }) => {
  function calcTitle(): string {
    if (!node.representsWorkflow || !node.linkedWorkflowData) {
      return node.title
    }

    return [
      node.linkedWorkflowData.code || '',
      node.linkedWorkflowData.code && ' - ',
      node.linkedWorkflowData.title
    ].join()
  }

  const title = calcTitle() || _t('Untitled')
  return (
    <div
      className="node-title"
      title={title}
      dangerouslySetInnerHTML={{ __html: title }}
    />
  )
}

export default NodeTitle
