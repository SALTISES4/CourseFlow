type NodeTimeSource = {
  timeRequiredMinutes: number | null
  linkedWorkflow?: {
    overviewMetadata: {
      timeMinutes?: number | null
    }
  } | null
}

/**
 * Resolve the Time value presented by a node.
 *
 * Linked nodes mirror the linked workflow, including an explicitly empty Time;
 * their hidden node-local value is restored only after the link is removed.
 */
export const getEffectiveNodeTimeMinutes = (
  node: NodeTimeSource
): number | null =>
  node.linkedWorkflow
    ? (node.linkedWorkflow.overviewMetadata.timeMinutes ?? null)
    : node.timeRequiredMinutes
