import {
  selectChannelByUuid,
  selectNodeByUuid,
  selectSectionByUuid
} from '@cf/features/graph/state/selectors/canonical.selectors'
import { selectOutcomeById } from '@cf/features/graph/state/selectors/outcomes.selectors'
import type { RootState } from '@cf/redux/store'
import { CfObjectType } from '@cf/types/enum'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'

const COMMENT_HOST_OBJECT_TYPES = new Set<CfObjectType>([
  CfObjectType.NODE,
  CfObjectType.SECTION,
  CfObjectType.COLUMN,
  CfObjectType.OUTCOME
])

export type CommentThreadContext = {
  entityUuid: string | null
  objectType: CfObjectType | null
  threadUuid: string | null
  isCommentHost: boolean
}

/**
 * Resolves the thread UUID for the entity currently targeted in the sidebar edit state.
 * Threads are not loaded via graph bootstrap; comment bodies are fetched per thread UUID.
 */
export function useCommentThreadContext(): CommentThreadContext {
  const entityUuid = useSelector((state: RootState) => state.sidebar.edit.uuid)
  const objectType = useSelector(
    (state: RootState) => state.sidebar.edit.objectType
  )

  const isCommentHost =
    Boolean(entityUuid) &&
    Boolean(objectType) &&
    COMMENT_HOST_OBJECT_TYPES.has(objectType)

  const nodeSelector = useMemo(
    () => (entityUuid ? selectNodeByUuid(entityUuid) : () => null),
    [entityUuid]
  )
  const sectionSelector = useMemo(
    () => (entityUuid ? selectSectionByUuid(entityUuid) : () => null),
    [entityUuid]
  )
  const channelSelector = useMemo(
    () => (entityUuid ? selectChannelByUuid(entityUuid) : () => null),
    [entityUuid]
  )
  const outcomeSelector = useMemo(
    () => (state: RootState) =>
      entityUuid ? selectOutcomeById(state, entityUuid) : undefined,
    [entityUuid]
  )

  const node = useSelector(nodeSelector)
  const section = useSelector(sectionSelector)
  const channel = useSelector(channelSelector)
  const outcome = useSelector(outcomeSelector)

  const threadUuid = useMemo(() => {
    if (!isCommentHost || !objectType) {
      return null
    }
    switch (objectType) {
      case CfObjectType.NODE:
        return node?.threadUuid ?? null
      case CfObjectType.SECTION:
        return section?.threadUuid ?? null
      case CfObjectType.COLUMN:
        return channel?.threadUuid ?? null
      case CfObjectType.OUTCOME:
        return outcome?.threadUuid ?? null
      default:
        return null
    }
  }, [
    channel?.threadUuid,
    isCommentHost,
    node?.threadUuid,
    objectType,
    outcome?.threadUuid,
    section?.threadUuid
  ])

  return {
    entityUuid: entityUuid ?? null,
    objectType: objectType ?? null,
    threadUuid,
    isCommentHost
  }
}
