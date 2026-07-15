/*******************************************************
 * PRIMITIVES
 *******************************************************/
export type EDate = string

/*******************************************************
 * ABSTRACT
 *******************************************************/
export interface CourseFlowEntity {
  uuid: string
  hash: string
  deleted: boolean
  deletedOn: string
  createdOn: string
  lastModified: string
  title: string
  description: string
}

export type EUser = {
  uuid: string
  username: string
  firstName: string
  lastName: string
  name: string
  email?: string
  language?: string
}
