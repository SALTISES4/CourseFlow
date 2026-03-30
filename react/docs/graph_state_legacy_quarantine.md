# Graph Rewrite Legacy Quarantine (Milestone: Read-Side Hydration)

Date: 2026-03-30

## Scope

This milestone isolates Redux/state architecture so the **new graph state module** is the only active hydration target for workflow graph data.

## Active Graph Hydration Path (new)

- `react/src/features/graph/state/graphState.ts`
- `react/src/features/graph/state/bootstrapGraph.thunk.ts`
- `react/src/features/graph/state/graphApi.ts`
- `react/src/features/graph/state/canonical/*`
- `react/src/features/graph/state/graphLoad.slice.ts`
- `react/src/features/graph/state/selectors/readiness.selectors.ts`
- Workflow page bootstrap wiring:
  - `react/src/components/pages/Workspace/Workflow/index.tsx`

## Removed from active path

### Websocket-driven graph synchronization

- `useWorkflowWebsocketManager` is no longer used by the workflow page bootstrap route.
- No active dispatch of websocket-delivered graph actions into Redux for hydration.

### Legacy workspace refresh/replace graph hydration

- Workflow page no longer dispatches `ActionCreator.refreshWorkspaceStoreData` / `replaceWorkspaceStoreData` for graph bootstrap.
- New graph hydration does not use `CommonActions.REPLACE_STOREDATA` or `CommonActions.REFRESH_STOREDATA`.

### Legacy workflow page graph readiness gate

- Workflow page no longer waits on `state.workspace.workflow` + websocket queue state.
- Readiness now comes from new graph selectors:
  - `canRenderShell`
  - `canRenderChannels`
  - `canRenderNodes`
  - `canRenderEdges`

## Quarantined (still present, deferred removal)

These legacy pieces remain in repo/store for deferred UI migration but are not the active hydration target:

- `react/src/redux/Reducers.ts` legacy graph reducers
- `react/src/redux/slices/*` old graph entity slices (`workflow`, `week`, `column`, `node`, `nodelink`)
- Legacy graph selectors under `react/src/redux/selectors/*`
- `react/src/components/pages/Workspace/Workflow/hooks/useWorkflowWebsocketManager.tsx`
- `react/src/redux/ActionCreator.ts` dynamic graph action bus

## Temporary compatibility shim

`WorkflowConfigProvider` currently receives no-op editable methods and disconnected ws state from `Workflow/index.tsx`.

Reason: keep page mount/route shape stable while avoiding reactivation of websocket and legacy workspace hydration logic.

## Deferred work

- Full UI migration from legacy workspace selectors/state to `state.graph` selectors.
- Removing legacy reducers/slices from store once editor components are migrated.
- Mutation and optimistic overlay integration in UI.
