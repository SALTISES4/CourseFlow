import type { RootState } from '@cfRedux/store'
import {
  selectAllSections as selectAllSectionsCanonical,
  selectSectionByUuid,
  selectSectionEntityIds as selectSectionEntityIdsCanonical
} from '@cf/features/graph/state/selectors/canonical.selectors'

/** @deprecated Prefer `@cf/features/graph/state/selectors/canonical.selectors` (canonical graph sections). */
export const selectAllSections = selectAllSectionsCanonical

/** @deprecated Prefer `selectSectionByUuid` from graph canonical selectors. */
export const selectSectionById = (state: RootState, sectionId: string) =>
  selectSectionByUuid(sectionId)(state)

/** @deprecated Prefer `selectSectionEntityIds` from graph canonical selectors. */
export const selectSectionIds = (state: RootState) =>
  selectSectionEntityIdsCanonical(state)
