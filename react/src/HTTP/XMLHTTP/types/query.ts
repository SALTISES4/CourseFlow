import { ELibraryObject } from '@XMLHTTP/types/entity'

/*******************************************************
 * EmptyPostResp
 * Used for all queries that do not export
 * a response beyond confirmation that the
 * POST has been sucessfully recieved and
 * processed
 *******************************************************/
export type EmptyPostResp = {
  message: string
  error?: string
}

