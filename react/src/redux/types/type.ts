import { EUser } from '@XMLHTTP/types/entity'

/*******************************************************
 * INDIVIDUAL REDUCER TYPES
 *******************************************************/
export type TUser = EUser & {
  userColour?: string
}

export type TTag = {
  uuid: string
  title: string
}
