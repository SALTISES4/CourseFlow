# Frontend Graph Rewrite Implementation Note

Date: 2026-03-30
Scope: `react/src` graph/editor Redux architecture inventory for rewrite planning.

## 1) Legacy architecture inventory (old-model bound)

These parts are tightly coupled to the legacy local-first + websocket-driven model and should be treated as reference only.

- `react/src/redux/store.ts`
  - Registers `legacyGraphReducers` + `workspaceReducer` + `dummyReducers` as the active graph state backbone.
- `react/src/redux/Reducers.ts`
  - Aggregates legacy relation reducers (`nodeweek`, `weekgraph`, `outcomegraph`, `parentNode`, `childGraph`, etc).
  - Explicitly documents websocket/publisher filtering assumptions.
- `react/src/redux/ActionCreator.ts`
  - Dynamic string action dispatch (`objectType + '/changeField'`, `createLock`) and global refresh/replace action bus.
  - Architecture assumes generic action routing rather than explicit intent commands.
- `react/src/components/pages/Workspace/Graph/hooks/useGraphWebsocketManager.tsx`
  - Mixes websocket lifecycle, initial hydration, queueing/replay, lock updates, and optimistic field writes.
  - Dispatches raw server actions and `refresh/replace` payload dumps into Redux.
- Graph domain slices with client-owned mutation semantics:
  - `react/src/redux/slices/node.slice.ts` (`graphNodeReorder`, `graphNodeInsert`, `graphNodeDelete`, row-collapse/chain-bump logic).
  - `react/src/redux/slices/graph.slice.ts` (local structural reorder semantics for sections/columns + relation mutation handlers).
  - `react/src/redux/slices/week.slice.ts` (through-set mutation logic tied to legacy `week/nodeweek` model).
  - `react/src/redux/slices/nodelink.slice.ts` (edge create/update semantics in reducer via `svglinkDragEnd`).
  - `react/src/redux/slices/column.slice.ts` (local clone/insert semantics).
- Legacy relation reducers under `react/src/redux/reducers/graph/*` and `react/src/redux/reducers/outcome/*`
  - Reducer boundaries mirror legacy through-tables and old backend shape.

## 2) Safe reuse candidates

Safe to reuse only after rewiring to new selectors/actions (not by keeping old store contracts).

- Presentational/editor UI components (view layer):
  - `react/src/components/views/GraphView/GraphEditView/components/**`
  - `ColumnsHeader`, `Week`, `Cell`, `LineSVG` visual components and styles.
- UI-only Redux state patterns:
  - `react/src/redux/slices/svglink.slice.ts` (drag gesture/preview state) as ephemeral editor state pattern.
  - `react/src/redux/slices/sidebar.slice.ts`, `viewsettings.slice.ts` (non-domain UI concerns).
- Pure utilities:
  - `react/src/redux/selectors/helpers.ts` style of pure helper functions (but not current graph semantics).
  - Small edge-port mapping utility usage (`getEdgePortKey`) where still applicable.
- Generic UX hooks/components:
  - snackbar/error handling hooks (`useGenericMsgHandler`) and non-graph scaffolding.

## 3) Must be replaced (new architecture)

- Any reducer that computes canonical graph mutation consequences client-side.
- Any generic `changeField`/`createLock` action bus dispatch model for graph domain writes.
- `CommonActions.REPLACE_STOREDATA` / `REFRESH_STOREDATA` as graph synchronization mechanism.
- Websocket-driven graph synchronization assumptions (`useGraphWebsocketManager`, queue replay, remote action passthrough).
- Legacy entity boundaries tied to `week/column/nodeweek/weekgraph/...` as canonical model for the rewrite.
- Selector contracts that assume old board shape (`weeks/columns/order`) as canonical storage model.

## 4) Proposed new graph state module structure

Suggested minimal structure under `react/src/features/graph/`:

```text
react/src/features/graph/
  state/
    graphCanonical/
      graphMeta.slice.ts        # graph id/revision/load flags
      sections.slice.ts         # normalized entities only
      channels.slice.ts         # normalized entities only
      nodes.slice.ts            # normalized entities only
      edges.slice.ts            # normalized entities only
      tags.slice.ts             # optional bounded related entities
      disciplines.slice.ts      # optional bounded related entities
      outcomes.slice.ts         # optional bounded related entities
      applyGraphDelta.ts        # backend-delta -> canonical entity updates
    graphOps/
      graphOps.slice.ts         # pending local operations queue/registry
      graphOps.types.ts
      graphCommand.thunks.ts    # explicit intent -> API -> settle pending op
    graphUi/
      graphUi.slice.ts          # selection, hover, drag mode, panels
      edgeDraft.slice.ts        # in-progress edge gesture only
    selectors/
      graphCanonical.selectors.ts
      graphOps.selectors.ts
      graphUi.selectors.ts
      graphProjection.selectors.ts  # effective projection = canonical + pending ops
  api/
    graphApi.ts                 # imperative HTTP via generated fetch/SDK (Hey API); not TanStack Query as graph store
  model/
    graph.types.ts
    graphCommands.types.ts
```

## 5) Enforcement notes for implementation

- Reducers in `graphCanonical/*` store normalized canonical state only; no domain mutation orchestration.
- All graph writes originate from explicit intent handlers (`graphCommand.thunks.ts`), not from store diff listeners.
- UI renders from selectors in `graphProjection.selectors.ts`, not from ad hoc reducer-computed cross-entity state.
- No dependency on websocket action replay for canonical graph correctness.
- Keep future collaboration path by preserving explicit command + delta application seams (`applyGraphDelta.ts`), without implementing realtime now.

## 6) Placeholder module scaffolding

No placeholder code directories were created in this step; this note is architecture inventory only.
