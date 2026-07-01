/** `/workflow/{uuid}/graph` → `/workflow/{uuid}` */
export function workflowOverviewPath(graphPath: string): string {
  return graphPath.replace(/\/graph$/, '');
}

/** `/workflow/{uuid}/graph` → `/workflow/{uuid}/outcomedit` (app route RelativeRoutes.OUTCOME_EDIT) */
export function workflowOutcomesPath(graphPath: string): string {
  return graphPath.replace(/\/graph$/, '/outcomedit');
}
