import { _t } from '@cf/utility/Utility.class'
import { TNode } from '@cfRedux/types/type'

// Applies some basic formatting to node's title
export function getNodeTitle(node: TNode): string {
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

  return calcTitle() || _t('Untitled')
}
